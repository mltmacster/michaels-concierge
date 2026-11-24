import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import superjson from "superjson";
import type { PublicPrincipal } from "../shared/identity";

// These are browser-owned DTO fixtures, not sessions or server-auth tests.
// No request reaches a database, OAuth provider, or live tRPC endpoint.
const mobile = { width: 375, height: 812 };
const desktop = { width: 1280, height: 900 };
const customer: PublicPrincipal = {
  id: 4101,
  name: "Identity Audit Customer",
  email: "customer@identity.example.invalid",
  role: "user",
  identityRole: "customer",
  permissions: ["identity:read:self", "session:revoke:self"],
};
const operator: PublicPrincipal = {
  id: 4102,
  name: "Identity Audit Operator",
  email: "operator@identity.example.invalid",
  role: "admin",
  identityRole: "operator",
  permissions: [...customer.permissions, "operator:access"],
};
const foundation = {
  phase: "Phase 1 — Identity/security development",
  acceptsRequests: false,
  billingEnabled: false,
  providerDiscoveryEnabled: false,
  aiEnabled: false,
};
const verifiedAccess = { identityRole: "operator", accessVerified: true };
const errors = {
  UNAUTHORIZED: { httpStatus: 401, numericCode: -32001 },
  FORBIDDEN: { httpStatus: 403, numericCode: -32003 },
  SERVICE_UNAVAILABLE: { httpStatus: 503, numericCode: -32603 },
  INTERNAL_SERVER_ERROR: { httpStatus: 500, numericCode: -32603 },
} as const;
type ErrorCode = keyof typeof errors;
type DtoResult = { value: unknown } | { error: ErrorCode };
type DtoHandler = () => DtoResult | Promise<DtoResult>;
type FixtureOptions = {
  me?: DtoHandler;
  access?: DtoHandler;
  logout?: DtoHandler;
  viewport?: typeof mobile;
};
type FetchObservation = {
  url: string;
  credentials: RequestCredentials;
  explicitCredentials: RequestCredentials | null;
  marker: string | null;
  authorization: string | null;
};
type BrowserAudit = {
  fetches: FetchObservation[];
  storageWrites: { key: string; value: string }[];
};
declare global {
  interface Window {
    __identityBrowserAudit: BrowserAudit;
  }
}
type RpcCall = {
  procedure: string;
  method: string;
  headers: Record<string, string>;
  batched: boolean;
};

const dto = (value: unknown): DtoResult => ({ value });
const denied = (error: ErrorCode): DtoResult => ({ error });

function deferredDto() {
  let resolve!: (result: DtoResult) => void;
  const result = new Promise<DtoResult>(complete => {
    resolve = complete;
  });
  return { result, resolve };
}

async function installDtoFixtures(page: Page, options: FixtureOptions = {}) {
  await page.setViewportSize(options.viewport ?? mobile);
  const calls: RpcCall[] = [];
  const unexpectedRequests: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  // Observe the real fetch options without replacing transport or its result.
  // credentials: include is observable here; this does not prove cookie flags,
  // token verification, authorization middleware, or server cryptography.
  await page.addInitScript(() => {
    const audit: BrowserAudit = { fetches: [], storageWrites: [] };
    window.__identityBrowserAudit = audit;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const request = new Request(input, init);
      if (new URL(request.url).pathname.startsWith("/api/trpc/")) {
        audit.fetches.push({
          url: request.url,
          credentials: request.credentials,
          explicitCredentials: init?.credentials ?? null,
          marker: request.headers.get("X-MGECS-Request"),
          authorization: request.headers.get("Authorization"),
        });
      }
      return originalFetch(input, init);
    };
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      audit.storageWrites.push({ key: String(key), value: String(value) });
      return originalSetItem.call(this, key, value);
    };
  });

  // A safety net prevents even an accidental navigation/fetch to a provider.
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (
      url.origin !== "http://127.0.0.1:4179" ||
      url.pathname.startsWith("/api/")
    ) {
      unexpectedRequests.push(route.request().url());
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  // Playwright runs the most recently registered matching route first.
  await page.route("**/api/trpc/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const procedures = decodeURIComponent(
      url.pathname.slice("/api/trpc/".length)
    ).split(",");
    const batched = url.searchParams.get("batch") === "1";
    const handlers: Record<string, DtoHandler> = {
      "auth.me": options.me ?? (() => dto(null)),
      "auth.logout": options.logout ?? (() => dto({ success: true })),
      "operator.access": options.access ?? (() => denied("UNAUTHORIZED")),
      "foundation.status": () => dto(foundation),
    };
    const responses = await Promise.all(
      procedures.map(async procedure => {
        calls.push({
          procedure,
          method: request.method(),
          headers: await request.allHeaders(),
          batched,
        });
        const handler = handlers[procedure];
        if (!handler) unexpectedRequests.push(request.url());
        const result = handler
          ? await handler()
          : denied("INTERNAL_SERVER_ERROR");
        if ("error" in result) {
          const shape = errors[result.error];
          return {
            status: shape.httpStatus,
            body: {
              error: superjson.serialize({
                message: "Isolated identity DTO failure",
                code: shape.numericCode,
                data: {
                  code: result.error,
                  httpStatus: shape.httpStatus,
                  path: procedure,
                },
              }),
            },
          };
        }
        return {
          status: 200,
          body: { result: { data: superjson.serialize(result.value) } },
        };
      })
    );
    const statuses = new Set(responses.map(response => response.status));
    await route.fulfill({
      // tRPC batches return an ordered envelope for every procedure, including
      // mixed success/error responses (207), each transformed by superjson.
      status: statuses.size === 1 ? responses[0].status : 207,
      contentType: "application/json",
      body: JSON.stringify(
        batched ? responses.map(response => response.body) : responses[0].body
      ),
    });
  });

  return {
    calls,
    async assertSafe() {
      expect(unexpectedRequests, "No live API/provider requests").toEqual([]);
      expect(pageErrors, "No browser runtime exceptions").toEqual([]);
      expect(calls.length, "At least one isolated DTO request").toBeGreaterThan(
        0
      );
      for (const call of calls) {
        expect(call.headers["x-mgecs-request"]).toBe("1");
        expect(call.headers.authorization).toBeUndefined();
        expect(call.method).toBe(
          call.procedure === "auth.logout" ? "POST" : "GET"
        );
      }
      const browser = await page.evaluate(async () => ({
        audit: window.__identityBrowserAudit,
        local: Object.entries(localStorage),
        session: Object.entries(sessionStorage),
        databases: await indexedDB.databases(),
        caches: await caches.keys(),
      }));
      expect(browser.audit.fetches.length).toBeGreaterThan(0);
      for (const request of browser.audit.fetches) {
        expect(request.marker).toBe("1");
        expect(request.authorization).toBeNull();
        expect(request.explicitCredentials).toBe("include");
        expect(request.credentials).toBe("include");
      }
      expect(
        browser.audit.storageWrites,
        "No profile/token storage writes"
      ).toEqual([]);
      expect(browser.local).toEqual([]);
      expect(browser.session).toEqual([]);
      expect(browser.databases).toEqual([]);
      expect(browser.caches).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        ),
        "No horizontal overflow"
      ).toBe(false);
    },
  };
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const directory = path.resolve("test-results/identity-audit");
  await mkdir(directory, { recursive: true });
  const image = await page.screenshot({
    path: path.join(directory, `${name}.jpg`),
    type: "jpeg",
    quality: 55,
    scale: "css",
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });
  await testInfo.attach(name, { body: image, contentType: "image/jpeg" });
}

for (const viewport of [mobile, desktop]) {
  test(`home → identity → home/foundation links at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    const audit = await installDtoFixtures(page, { viewport });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Your time."
    );
    await capture(page, testInfo, `home-${viewport.width}`);
    await page.getByRole("link", { name: "Identity", exact: true }).click();
    await expect(page).toHaveURL(/\/identity$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Your identity. A clear boundary."
    );
    await expect(
      page.getByRole("status").filter({ hasText: "Not signed in" })
    ).toHaveText("Not signed in");
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true })
    ).toBeEnabled();
    await expect(
      page.getByRole("link", { name: "Verify operator access" })
    ).toHaveCount(0);
    const navigation = page.getByRole("navigation", {
      name: "Identity navigation",
    });
    await expect(
      navigation.getByRole("link", { name: "Identity" })
    ).toHaveAttribute("aria-current", "page");
    await capture(page, testInfo, `identity-anonymous-${viewport.width}`);
    await navigation.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("link", { name: "Identity", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Refresh identity", exact: true })
    ).toBeEnabled();
    await expect(
      page.getByRole("status").filter({ hasText: /^Not signed in$/ })
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Identity navigation" })
      .getByRole("link", { name: "Foundation", exact: true })
      .click();
    await expect(page).toHaveURL(/\/foundation$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "A foundation you can inspect."
    );
    await expect(
      page.getByText("API connected", { exact: false })
    ).toBeVisible();
    await expect(page.getByText("Not enabled", { exact: true })).toHaveCount(4);
    await capture(page, testInfo, `foundation-${viewport.width}`);
    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Your time."
    );
    await audit.assertSafe();
  });
}

test("identity waits for its DTO without assuming access or starting sign-in", async ({
  page,
}, testInfo) => {
  const pending = deferredDto();
  const audit = await installDtoFixtures(page, { me: () => pending.result });
  try {
    await page.goto("/identity");
    await expect(page.getByRole("status")).toContainText("Checking identity");
    await expect(
      page.getByRole("region", { name: "Your identity and session" })
    ).toHaveAttribute("aria-busy", "true");
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Sign out", exact: true })
    ).toHaveCount(0);
    await capture(page, testInfo, "identity-loading-375");
  } finally {
    pending.resolve(dto(null));
  }
  await expect(
    page.getByRole("status").filter({ hasText: "Not signed in" })
  ).toHaveText("Not signed in");
  await expect(page).toHaveURL(/\/identity$/);
  await audit.assertSafe();
});

test("customer DTO exposes only its identity and updates on explicit refresh", async ({
  page,
}, testInfo) => {
  let principal = customer;
  const audit = await installDtoFixtures(page, { me: () => dto(principal) });
  await page.goto("/identity");
  await expect(
    page.getByRole("status").filter({ hasText: "Signed in · customer" })
  ).toHaveText("Signed in · customer");
  await expect(
    page.getByRole("heading", { name: customer.name! })
  ).toBeVisible();
  await expect(page.getByText(customer.email!, { exact: true })).toBeVisible();
  await expect(
    page.getByText(String(customer.id), { exact: true })
  ).toBeVisible();
  for (const permission of customer.permissions) {
    await expect(
      page.getByRole("listitem").filter({ hasText: permission })
    ).toHaveText(permission);
  }
  await expect(page.getByText("operator:access", { exact: true })).toHaveCount(
    0
  );
  await expect(
    page.getByRole("link", { name: "Verify operator access" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true })
  ).toHaveCount(0);
  await capture(page, testInfo, "identity-customer-375");
  principal = { ...customer, name: null, email: null, permissions: [] };
  await page.getByRole("button", { name: "Refresh identity" }).click();
  await expect(
    page.getByRole("heading", { name: "Your account", exact: true })
  ).toBeVisible();
  await expect(page.getByText("Not provided", { exact: true })).toBeVisible();
  await expect(
    page.getByText("No permissions were returned for this account.")
  ).toBeVisible();
  expect(audit.calls.filter(call => call.procedure === "auth.me")).toHaveLength(
    2
  );
  await audit.assertSafe();
});

for (const viewport of [mobile, desktop]) {
  test(`operator link waits for a separate verified access DTO at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    const pending = deferredDto();
    const audit = await installDtoFixtures(page, {
      viewport,
      me: () => dto(operator),
      access: () => pending.result,
    });
    await page.goto("/identity");
    await expect(
      page.getByRole("status").filter({ hasText: "Signed in · operator" })
    ).toHaveText("Signed in · operator");
    await expect(
      page.getByText("operator:access", { exact: true })
    ).toBeVisible();
    await capture(page, testInfo, `identity-operator-${viewport.width}`);
    try {
      await page.getByRole("link", { name: "Verify operator access" }).click();
      await expect(page).toHaveURL(/\/operator$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Operator identity."
      );
      await expect(page.getByRole("status")).toContainText(
        "Checking operator access"
      );
      await expect(
        page.getByRole("region", { name: "Operator access verification" })
      ).toHaveAttribute("aria-busy", "true");
      await expect(
        page.getByText("Operator access verified", { exact: true })
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Checking access…" })
      ).toBeDisabled();
      if (viewport.width === mobile.width) {
        await capture(page, testInfo, "operator-loading-375");
      }
    } finally {
      pending.resolve(dto(verifiedAccess));
    }
    await expect(page.getByRole("status")).toHaveText(
      "Operator access verified"
    );
    await expect(
      page.getByText("Confirmed by the backend", { exact: true })
    ).toBeVisible();
    await capture(page, testInfo, `operator-verified-${viewport.width}`);
    await page.getByRole("button", { name: "Recheck access" }).click();
    await expect
      .poll(
        () =>
          audit.calls.filter(call => call.procedure === "operator.access")
            .length
      )
      .toBe(2);
    await expect(
      page.getByRole("region", { name: "Operator access verification" })
    ).toHaveAttribute("aria-busy", "false");
    await expect(page.getByRole("status")).toHaveText(
      "Operator access verified"
    );
    expect(
      audit.calls.filter(call => call.procedure === "operator.access")
    ).toHaveLength(2);
    await page.getByRole("link", { name: "Back to Identity" }).click();
    await expect(page).toHaveURL(/\/identity$/);
    await expect(
      page.getByRole("status").filter({ hasText: "Signed in · operator" })
    ).toHaveText("Signed in · operator");
    await audit.assertSafe();
  });
}

test("direct anonymous operator navigation obeys a mixed-batch unauthorized DTO without redirect", async ({
  page,
}, testInfo) => {
  const audit = await installDtoFixtures(page);
  await page.goto("/operator");
  await expect(page.getByRole("alert")).toContainText("Sign-in required");
  await expect(
    page.getByRole("heading", { name: "A valid session is required." })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/operator$/);
  await expect(
    page.getByText("Operator access verified", { exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true })
  ).toHaveCount(0);
  expect(audit.calls.map(call => call.procedure).sort()).toEqual([
    "auth.me",
    "operator.access",
  ]);
  expect(audit.calls.every(call => call.batched)).toBe(true);
  await capture(page, testInfo, "operator-unauthorized-375");
  await page.getByRole("link", { name: "Back to Identity" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Not signed in" })
  ).toHaveText("Not signed in");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true })
  ).toBeEnabled();
  await audit.assertSafe();
});

test("direct customer navigation makes an access request and obeys forbidden", async ({
  page,
}, testInfo) => {
  const audit = await installDtoFixtures(page, {
    me: () => dto(customer),
    access: () => denied("FORBIDDEN"),
  });
  await page.goto("/operator");
  await expect(page.getByRole("alert")).toContainText("Operator access denied");
  await expect(
    page.getByText("Operator access verified", { exact: true })
  ).toHaveCount(0);
  expect(audit.calls.map(call => call.procedure).sort()).toEqual([
    "auth.me",
    "operator.access",
  ]);
  await capture(page, testInfo, "operator-customer-forbidden-375");
  await page.getByRole("link", { name: "Back to Identity" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Signed in · customer" })
  ).toHaveText("Signed in · customer");
  await audit.assertSafe();
});

test("a client-forged operator role cannot replace a denied access DTO", async ({
  page,
}, testInfo) => {
  // Deliberately forge only the browser-visible auth.me response. A shown role
  // and link must not override the independent operator.access failure.
  const audit = await installDtoFixtures(page, {
    me: () => dto(operator),
    access: () => denied("FORBIDDEN"),
  });
  await page.goto("/identity");
  await expect(
    page.getByRole("status").filter({ hasText: "Signed in · operator" })
  ).toHaveText("Signed in · operator");
  await page.getByRole("link", { name: "Verify operator access" }).click();
  await expect(page.getByRole("alert")).toContainText("Operator access denied");
  await expect(
    page.getByRole("heading", { name: "This identity is not authorized." })
  ).toBeVisible();
  await expect(
    page.getByText("Operator access verified", { exact: true })
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/operator$/);
  expect(
    audit.calls.filter(call => call.procedure === "operator.access")
  ).toHaveLength(1);
  await capture(page, testInfo, "operator-forged-role-forbidden-375");
  await audit.assertSafe();
});

const identityFailures: {
  code: ErrorCode;
  heading: string;
  message: string;
}[] = [
  {
    code: "UNAUTHORIZED",
    heading: "Sign in again to continue.",
    message: "Session not valid",
  },
  {
    code: "FORBIDDEN",
    heading: "This request was not permitted.",
    message: "Access denied",
  },
  {
    code: "SERVICE_UNAVAILABLE",
    heading: "The session service is unavailable.",
    message: "This is a service failure, not proof that you are signed out.",
  },
  {
    code: "INTERNAL_SERVER_ERROR",
    heading: "We could not check your identity.",
    message: "A failed check does not confirm sign-out",
  },
];
for (const failure of identityFailures) {
  test(`identity ${failure.code} is explicit and recovers only on refresh`, async ({
    page,
  }, testInfo) => {
    let response = denied(failure.code);
    const audit = await installDtoFixtures(page, { me: () => response });
    await page.goto("/identity");
    await expect(
      page.getByRole("heading", { name: failure.heading, exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(failure.message, { exact: false })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/identity$/);
    await expect(
      page.getByText("Signed out · server confirmed", { exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Verify operator access" })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true })
    ).toHaveCount(failure.code === "UNAUTHORIZED" ? 1 : 0);
    await capture(page, testInfo, `identity-${failure.code.toLowerCase()}-375`);
    response = dto(null);
    await page.getByRole("button", { name: "Refresh identity" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Not signed in" })
    ).toHaveText("Not signed in");
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true })
    ).toBeEnabled();
    expect(
      audit.calls.filter(call => call.procedure === "auth.me")
    ).toHaveLength(2);
    await audit.assertSafe();
  });
}

for (const failure of [
  {
    code: "SERVICE_UNAVAILABLE",
    heading: "The access service is unavailable.",
  },
  {
    code: "INTERNAL_SERVER_ERROR",
    heading: "We could not verify operator access.",
  },
] as const) {
  test(`operator ${failure.code} cannot masquerade as verified or signed out`, async ({
    page,
  }, testInfo) => {
    let response = denied(failure.code);
    const audit = await installDtoFixtures(page, {
      me: () => dto(operator),
      access: () => response,
    });
    await page.goto("/operator");
    await expect(page.getByRole("alert")).toContainText(failure.heading);
    await expect(
      page.getByText("Operator access verified", { exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByText("Signed out · server confirmed", { exact: true })
    ).toHaveCount(0);
    await expect(page).toHaveURL(/\/operator$/);
    await capture(page, testInfo, `operator-${failure.code.toLowerCase()}-375`);
    response = dto(verifiedAccess);
    await page.getByRole("button", { name: "Recheck access" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Operator access verified"
    );
    await audit.assertSafe();
  });
}

for (const access of [
  { identityRole: "operator", accessVerified: false },
  { identityRole: "customer", accessVerified: true },
]) {
  test(`operator needs both operator role and explicit verification (${access.identityRole}/${access.accessVerified})`, async ({
    page,
  }) => {
    const audit = await installDtoFixtures(page, {
      me: () => dto(operator),
      access: () => dto(access),
    });
    await page.goto("/operator");
    await expect(page.getByRole("alert")).toContainText(
      "Access was not verified."
    );
    await expect(
      page.getByText("Operator access verified", { exact: true })
    ).toHaveCount(0);
    await audit.assertSafe();
  });
}

for (const code of Object.keys(errors) as ErrorCode[]) {
  test(`failed ${code} logout retains identity; confirmed retry clears it`, async ({
    page,
  }, testInfo) => {
    const pending = deferredDto();
    let logoutAttempts = 0;
    let signedOut = false;
    const audit = await installDtoFixtures(page, {
      me: () => dto(signedOut ? null : customer),
      logout: () => {
        logoutAttempts += 1;
        if (logoutAttempts === 1) return pending.result;
        signedOut = true;
        return dto({ success: true });
      },
    });
    await page.goto("/identity");
    await expect(
      page.getByRole("status").filter({ hasText: "Signed in · customer" })
    ).toHaveText("Signed in · customer");
    try {
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Signing out…" })
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Refresh identity" })
      ).toBeDisabled();
      await expect(
        page.getByRole("heading", { name: customer.name! })
      ).toBeVisible();
      await expect(
        page.getByText("Signed out · server confirmed", { exact: true })
      ).toHaveCount(0);
    } finally {
      pending.resolve(denied(code));
    }
    await expect(page.getByRole("alert")).toContainText(
      code === "UNAUTHORIZED"
        ? "Sign-out was not completed"
        : "Your session may still be active",
      { ignoreCase: true }
    );
    await expect(
      page.getByRole("status").filter({ hasText: "Signed in · customer" })
    ).toHaveText("Signed in · customer");
    await expect(
      page.getByRole("heading", { name: customer.name! })
    ).toBeVisible();
    await expect(
      page.getByText(customer.email!, { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Retry sign-out" })
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true })
    ).toHaveCount(0);
    await capture(page, testInfo, `logout-${code.toLowerCase()}-retained-375`);
    await page.getByRole("button", { name: "Retry sign-out" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Signed out · server confirmed"
    );
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true })
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", { name: customer.name! })
    ).toHaveCount(0);
    await expect(page.getByText(customer.email!, { exact: true })).toHaveCount(
      0
    );
    await expect(
      page.getByText("identity:read:self", { exact: true })
    ).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(logoutAttempts).toBe(2);
    expect(
      audit.calls.filter(call => call.procedure === "auth.me")
    ).toHaveLength(1);
    if (code === "SERVICE_UNAVAILABLE") {
      await capture(page, testInfo, "identity-confirmed-logout-375");
    }
    await page.getByRole("button", { name: "Refresh identity" }).click();
    await expect
      .poll(
        () => audit.calls.filter(call => call.procedure === "auth.me").length
      )
      .toBe(2);
    await expect(
      page.getByRole("region", { name: "Your identity and session" })
    ).toHaveAttribute("aria-busy", "false");
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: /^Signed out · server confirmed$/ })
    ).toBeVisible();
    await audit.assertSafe();
  });
}

test("confirmed operator logout discards verified access and identity when returning", async ({
  page,
}, testInfo) => {
  let signedOut = false;
  const audit = await installDtoFixtures(page, {
    me: () => dto(signedOut ? null : operator),
    access: () => (signedOut ? denied("UNAUTHORIZED") : dto(verifiedAccess)),
    logout: () => {
      signedOut = true;
      return dto({ success: true });
    },
  });
  await page.goto("/operator");
  await expect(page.getByRole("status")).toHaveText("Operator access verified");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Signed out · server confirmed"
  );
  await expect(
    page.getByText("Operator access verified", { exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Recheck access" })
  ).toHaveCount(0);
  await capture(page, testInfo, "operator-confirmed-logout-375");
  await page.getByRole("link", { name: "Back to Identity" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Not signed in" })
  ).toHaveText("Not signed in");
  await expect(
    page.getByRole("link", { name: "Verify operator access" })
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: operator.name! })).toHaveCount(
    0
  );
  await page
    .getByRole("navigation", { name: "Identity navigation" })
    .getByRole("link", { name: "Home", exact: true })
    .click();
  await page.goto("/operator");
  await expect(page.getByRole("alert")).toContainText("Sign-in required");
  await expect(
    page.getByText("Operator access verified", { exact: true })
  ).toHaveCount(0);
  await audit.assertSafe();
});
