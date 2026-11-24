import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`foundation navigation at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Your time."
    );
    await page.getByRole("button", { name: "Explore the foundation" }).click();
    await expect(page.getByText("API connected")).toBeVisible();
    await expect(page.getByText("Not enabled", { exact: true })).toHaveCount(4);
    await page.getByRole("button", { name: "Refresh status" }).click();
    await expect(
      page.getByRole("button", { name: "Refresh status" })
    ).toBeEnabled();
    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/missing-route");
    await page.getByRole("link", { name: "Return to home" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Your time."
    );
    expect(errors).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
  });
}

test("API outage does not masquerade as service readiness", async ({
  page,
}) => {
  await page.route("**/api/trpc/foundation.status**", route => route.abort());
  await page.goto("/foundation");
  await expect(page.getByRole("alert")).toContainText("unavailable");
  await expect(page.getByText("API connected")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
});
