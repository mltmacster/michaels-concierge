import type { CookieOptions, Request } from "express";
import {
  COOKIE_NAME,
  DEV_COOKIE_NAME,
  OAUTH_STATE_COOKIE,
  DEV_OAUTH_STATE_COOKIE,
} from "../../shared/const";

function localDevelopment(req: Request) {
  return (
    process.env.NODE_ENV !== "production" &&
    req.protocol === "http" &&
    ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
      req.socket.remoteAddress ?? ""
    ) &&
    ["localhost", "127.0.0.1", "[::1]"].includes(req.hostname)
  );
}
export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: !localDevelopment(req),
  };
}
export function sessionCookieName(req: Request) {
  return localDevelopment(req) ? DEV_COOKIE_NAME : COOKIE_NAME;
}
export function stateCookieName(req: Request) {
  return localDevelopment(req) ? DEV_OAUTH_STATE_COOKIE : OAUTH_STATE_COOKIE;
}
