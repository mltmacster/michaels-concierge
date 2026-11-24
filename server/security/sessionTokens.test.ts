import { createHash, randomBytes } from "node:crypto";
import { decodeJwt, decodeProtectedHeader, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { createSessionCodec, hashSessionId } from "./sessionTokens";

const START_MS = 1_800_000_000_789;
const ABSOLUTE_MS = 3_600_000;
const APP_ID = "portable-session-tests";

function testSecret() {
  return randomBytes(48).toString("base64url");
}

function fixture(absoluteMs = ABSOLUTE_MS) {
  const secret = testSecret();
  let clock = START_MS;
  const codec = createSessionCodec({
    secret,
    appId: APP_ID,
    absoluteMs,
    now: () => clock,
  });
  const validPayload = () => ({
    sub: "123",
    jti: randomBytes(32).toString("base64url"),
    iat: Math.floor(START_MS / 1_000),
    exp: Math.floor(START_MS / 1_000) + Math.floor(absoluteMs / 1_000),
    iss: "mgecs:session",
    aud: APP_ID,
  });
  const sign = (payload: Record<string, unknown>, algorithm = "HS256") =>
    new SignJWT(payload)
      .setProtectedHeader({ alg: algorithm, typ: "JWT" })
      .sign(new TextEncoder().encode(secret));
  return {
    codec,
    secret,
    validPayload,
    sign,
    setClock: (milliseconds: number) => {
      clock = milliseconds;
    },
  };
}

function compactPart(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("createSessionCodec configuration", () => {
  it.each(["", "short", "x".repeat(31)])(
    "rejects insufficient secret length (%s)",
    secret => {
      expect(() =>
        createSessionCodec({ secret, appId: APP_ID, absoluteMs: ABSOLUTE_MS })
      ).toThrow("Session signing secret");
    }
  );

  it.each(["", " ", "\t\n"])("rejects empty application ID (%j)", appId => {
    expect(() =>
      createSessionCodec({
        secret: testSecret(),
        appId,
        absoluteMs: ABSOLUTE_MS,
      })
    ).toThrow("Session application ID");
  });

  it.each([NaN, Infinity, -Infinity, -1, 0, 59_999, 86_400_001])(
    "rejects invalid absolute lifetime (%s)",
    absoluteMs => {
      expect(() =>
        createSessionCodec({ secret: testSecret(), appId: APP_ID, absoluteMs })
      ).toThrow("Session absolute lifetime");
    }
  );

  it("accepts a generated secret of exactly 32 characters", async () => {
    const codec = createSessionCodec({
      secret: randomBytes(24).toString("base64url"),
      appId: APP_ID,
      absoluteMs: ABSOLUTE_MS,
      now: () => START_MS,
    });
    const issued = await codec.issue(1);
    expect(await codec.verify(issued.token)).toEqual(issued.claims);
  });

  it.each([60_000, 60_001.5, 86_400_000])(
    "accepts bounded lifetime %s without exceeding it",
    async absoluteMs => {
      const { codec } = fixture(absoluteMs);
      const { token, claims } = await codec.issue(1);
      expect((claims.exp - claims.iat) * 1_000).toBeLessThanOrEqual(absoluteMs);
      expect(claims.exp * 1_000 - START_MS).toBeLessThanOrEqual(absoluteMs);
      expect(await codec.verify(token)).toEqual(claims);
    }
  );

  it("preserves the exact configured audience rather than normalizing it", async () => {
    const codec = createSessionCodec({
      secret: testSecret(),
      appId: " exact-app ",
      absoluteMs: ABSOLUTE_MS,
      now: () => START_MS,
    });
    const { token, claims } = await codec.issue(1);
    expect(claims.aud).toBe(" exact-app ");
    expect(await codec.verify(token)).toEqual(claims);
  });
});

describe("session issuance", () => {
  it.each([1, 123, Number.MAX_SAFE_INTEGER])(
    "round-trips canonical numeric user ID %s with only required claims",
    async id => {
      const { codec } = fixture();
      const { token, claims } = await codec.issue(id);
      expect(claims).toEqual({
        sub: String(id),
        jti: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
        iat: Math.floor(START_MS / 1_000),
        exp: Math.floor(START_MS / 1_000) + ABSOLUTE_MS / 1_000,
        iss: "mgecs:session",
        aud: APP_ID,
      });
      expect(Buffer.from(claims.jti, "base64url")).toHaveLength(32);
      expect(Number.isInteger(claims.iat)).toBe(true);
      expect(Number.isInteger(claims.exp)).toBe(true);
      expect(decodeJwt(token)).toEqual(claims);
      expect(decodeProtectedHeader(token)).toEqual({
        alg: "HS256",
        typ: "JWT",
      });
      expect(await codec.verify(token)).toEqual(claims);
    }
  );

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid numeric user ID %s",
    async id => {
      await expect(fixture().codec.issue(id)).rejects.toThrow(
        "Session subject"
      );
    }
  );

  it("generates independent random identifiers for each session", async () => {
    const { codec } = fixture();
    const first = await codec.issue(1);
    const second = await codec.issue(1);
    expect(first.claims.jti).not.toBe(second.claims.jti);
    expect(first.token).not.toBe(second.token);
  });

  it("uses the real current clock when no injected clock is supplied", async () => {
    const codec = createSessionCodec({
      secret: testSecret(),
      appId: APP_ID,
      absoluteMs: ABSOLUTE_MS,
    });
    const before = Math.floor(Date.now() / 1_000);
    const { token, claims } = await codec.issue(1);
    const after = Math.floor(Date.now() / 1_000);
    expect(claims.iat).toBeGreaterThanOrEqual(before);
    expect(claims.iat).toBeLessThanOrEqual(after);
    expect(await codec.verify(token)).toEqual(claims);
  });

  it.each([NaN, Infinity, -1, 8_640_000_000_000_001])(
    "fails closed on invalid injected time %s",
    async milliseconds => {
      const test = fixture();
      const { token } = await test.codec.issue(1);
      test.setClock(milliseconds);
      await expect(test.codec.issue(1)).rejects.toThrow(
        "Invalid session clock"
      );
      expect(await test.codec.verify(token)).toBeNull();
    }
  );
});

describe("session verification", () => {
  it("accepts an independently signed conforming HS256 session", async () => {
    const test = fixture();
    const payload = test.validPayload();
    expect(await test.codec.verify(await test.sign(payload))).toEqual(payload);
  });

  it.each(["sub", "jti", "iat", "exp", "iss", "aud"])(
    "rejects legacy tokens missing %s",
    async name => {
      const test = fixture();
      const payload: Record<string, unknown> = test.validPayload();
      delete payload[name];
      expect(await test.codec.verify(await test.sign(payload))).toBeNull();
    }
  );

  it("rejects a legacy token containing none of the required claims", async () => {
    const test = fixture();
    expect(await test.codec.verify(await test.sign({}))).toBeNull();
  });

  it.each([
    "",
    "0",
    "-1",
    "+1",
    "01",
    " 1",
    "1 ",
    "1.0",
    "1e3",
    "9007199254740992",
    "oauth-provider-subject",
    "١",
    1,
    null,
    true,
    {},
  ])("rejects malformed subject %j", async sub => {
    const test = fixture();
    expect(
      await test.codec.verify(await test.sign({ ...test.validPayload(), sub }))
    ).toBeNull();
  });

  it.each([
    "",
    "A".repeat(42),
    "A".repeat(44),
    "A".repeat(43) + "=",
    "+".repeat(43),
    "/".repeat(43),
    "A".repeat(42) + "B",
    123,
    null,
    {},
  ])("rejects malformed/noncanonical session identifier %j", async jti => {
    const test = fixture();
    expect(
      await test.codec.verify(await test.sign({ ...test.validPayload(), jti }))
    ).toBeNull();
  });

  it.each(["wrong-issuer", "", null, ["mgecs:session"]])(
    "rejects invalid issuer %j",
    async iss => {
      const test = fixture();
      expect(
        await test.codec.verify(
          await test.sign({ ...test.validPayload(), iss })
        )
      ).toBeNull();
    }
  );

  it.each(["wrong-app", "", null, [APP_ID], [APP_ID, "other-app"]])(
    "rejects a non-exact audience %j",
    async aud => {
      const test = fixture();
      expect(
        await test.codec.verify(
          await test.sign({ ...test.validPayload(), aud })
        )
      ).toBeNull();
    }
  );

  it.each([
    { iat: "1800000000" },
    { exp: "1800003600" },
    { iat: null },
    { exp: null },
    { iat: 1_800_000_000.5 },
    { exp: 1_800_003_600.5 },
    { iat: -1 },
    { exp: -1 },
    { iat: Number.MAX_SAFE_INTEGER + 1 },
    { exp: Number.MAX_SAFE_INTEGER + 1 },
    { exp: 1_800_000_000 },
    { exp: 1_799_999_999 },
    { iat: 1_800_000_001 },
    { exp: 1_800_003_601 },
  ])("rejects invalid temporal claims %j", async overrides => {
    const test = fixture();
    expect(
      await test.codec.verify(
        await test.sign({ ...test.validPayload(), ...overrides })
      )
    ).toBeNull();
  });

  it("rejects future issuance even when the expiration is otherwise valid", async () => {
    const test = fixture();
    const payload = test.validPayload();
    payload.iat += 1;
    expect(await test.codec.verify(await test.sign(payload))).toBeNull();
  });

  it("has no expiration tolerance and uses the injected clock in jose", async () => {
    const test = fixture();
    const { token, claims } = await test.codec.issue(1);
    test.setClock(claims.exp * 1_000 - 1);
    expect(await test.codec.verify(token)).toEqual(claims);
    test.setClock(claims.exp * 1_000);
    expect(await test.codec.verify(token)).toBeNull();
    test.setClock(claims.exp * 1_000 + 1);
    expect(await test.codec.verify(token)).toBeNull();
    test.setClock((claims.iat - 1) * 1_000);
    expect(await test.codec.verify(token)).toBeNull();
  });

  it("rejects overlong lifetime even if only a short time remains", async () => {
    const test = fixture();
    const payload = test.validPayload();
    payload.iat -= ABSOLUTE_MS / 1_000;
    payload.exp = Math.floor(START_MS / 1_000) + 1;
    expect(await test.codec.verify(await test.sign(payload))).toBeNull();
  });

  it("does not round fractional configuration up when verifying lifetime", async () => {
    const test = fixture(60_999.5);
    const payload = test.validPayload();
    payload.exp = payload.iat + 61;
    expect(await test.codec.verify(await test.sign(payload))).toBeNull();
  });

  it("rejects a token issued under a larger configured lifetime", async () => {
    const test = fixture();
    const stricter = createSessionCodec({
      secret: test.secret,
      appId: APP_ID,
      absoluteMs: 60_000,
      now: () => START_MS,
    });
    expect(await stricter.verify((await test.codec.issue(1)).token)).toBeNull();
  });

  it("rejects wrong-key and wrong-application sessions", async () => {
    const test = fixture();
    const { token } = await test.codec.issue(1);
    const wrongKey = createSessionCodec({
      secret: testSecret(),
      appId: APP_ID,
      absoluteMs: ABSOLUTE_MS,
      now: () => START_MS,
    });
    const wrongApplication = createSessionCodec({
      secret: test.secret,
      appId: "another-application",
      absoluteMs: ABSOLUTE_MS,
      now: () => START_MS,
    });
    expect(await wrongKey.verify(token)).toBeNull();
    expect(await wrongApplication.verify(token)).toBeNull();
  });

  it("rejects tampered payloads and signatures", async () => {
    const test = fixture();
    const { token, claims } = await test.codec.issue(1);
    const [header, payload, signature] = token.split(".");
    const tamperedPayload = `${header}.${compactPart({ ...claims, sub: "2" })}.${signature}`;
    const changedSignature = `${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
    expect(await test.codec.verify(tamperedPayload)).toBeNull();
    expect(
      await test.codec.verify(`${header}.${payload}.${changedSignature}`)
    ).toBeNull();
  });

  it.each(["HS384", "HS512"])(
    "rejects signed algorithm %s",
    async algorithm => {
      const test = fixture();
      expect(
        await test.codec.verify(await test.sign(test.validPayload(), algorithm))
      ).toBeNull();
    }
  );

  it("rejects an unsigned none-algorithm token", async () => {
    const test = fixture();
    const token = `${compactPart({ alg: "none", typ: "JWT" })}.${compactPart(test.validPayload())}.`;
    expect(await test.codec.verify(token)).toBeNull();
  });

  it.each(["", "not-a-token", "a.b", "a.b.c", "a.b.c.d", "..."])(
    "rejects malformed compact token %j without throwing",
    async token => {
      expect(await fixture().codec.verify(token)).toBeNull();
    }
  );

  it.each([
    { role: "admin" },
    { email: "isolated-test@example.invalid" },
    { name: "Isolated test" },
    { userId: 123 },
    { nbf: 1_800_000_000 },
  ])("rejects unapproved extra claims %j", async extra => {
    const test = fixture();
    expect(
      await test.codec.verify(
        await test.sign({ ...test.validPayload(), ...extra })
      )
    ).toBeNull();
  });
});

describe("hashSessionId", () => {
  it("produces the SHA256 hex digest without retaining the raw identifier", () => {
    const jti = randomBytes(32).toString("base64url");
    const digest = hashSessionId(jti);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).toBe(createHash("sha256").update(jti, "utf8").digest("hex"));
    expect(hashSessionId(jti)).toBe(digest);
    expect(hashSessionId(randomBytes(32).toString("base64url"))).not.toBe(
      digest
    );
    expect(digest).not.toContain(jti);
  });

  it("matches the independent SHA256 empty-input vector", () => {
    expect(hashSessionId("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });
});
