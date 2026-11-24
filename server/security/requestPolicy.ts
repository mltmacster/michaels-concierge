import type { Request } from "express";

export function approvedOrigin(
  value: string | undefined,
  origins: readonly string[]
) {
  if (!value || value === "null") return false;
  try {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      url.origin === value &&
      origins.includes(url.origin)
    );
  } catch {
    return false;
  }
}

export function validCallback(value: string, origins: readonly string[]) {
  try {
    const url = new URL(value);
    return (
      approvedOrigin(url.origin, origins) &&
      url.pathname === "/api/oauth/callback" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function mutationAllowed(req: Request, origins: readonly string[]) {
  const site = req.get("Sec-Fetch-Site");
  if (site && site !== "same-origin") return false;
  if (!approvedOrigin(req.get("Origin"), origins)) return false;
  if (req.get("X-MGECS-Request") !== "1") return false;
  return (
    req.is("application/json") !== false && req.is("application/json") !== null
  );
}
