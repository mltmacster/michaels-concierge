import { expect, it } from "vitest";

it("CI canary rejects a deliberately broken assertion", () => {
  expect(true).toBe(false);
});
