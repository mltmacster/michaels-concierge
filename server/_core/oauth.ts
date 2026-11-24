import { decodeOAuthState } from "@shared/const";
import { parse } from "cookie";
import type { Express } from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { saveOAuthIdentity } from "../db";
import { identityService } from "../security/identityService";
import { validCallback } from "../security/requestPolicy";
import { IdentityStorageUnavailable, securityEvent } from "../security/events";
import {
  getSessionCookieOptions,
  sessionCookieName,
  stateCookieName,
} from "./cookies";
import { sdk } from "./sdk";

const providerIdentity = z.object({
  openId: z.string().min(1).max(64),
  projectId: z.string().min(1),
  name: z.string().max(500).nullish(),
  email: z.string().max(320).nullish(),
  loginMethod: z.string().max(64).nullish(),
  platform: z.string().max(64).nullish(),
});

export function registerOAuthRoutes(app: Express, origins: readonly string[]) {
  app.get("/api/oauth/callback", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!code || !state || code.length > 4096 || state.length > 4096) {
      res.status(400).json({
        error: {
          code: "OAUTH_REQUEST_INVALID",
          message: "Invalid sign-in request",
        },
      });
      return;
    }
    const decoded = decodeOAuthState(state);
    const expected =
      parse(req.headers.cookie ?? "")[stateCookieName(req)] ?? "";
    if (
      !decoded.nonce ||
      !/^[A-Za-z0-9_-]{20,128}$/.test(decoded.nonce) ||
      !/^[A-Za-z0-9_-]{20,128}$/.test(expected) ||
      decoded.nonce.length !== expected.length ||
      !timingSafeEqual(Buffer.from(decoded.nonce), Buffer.from(expected)) ||
      !validCallback(decoded.redirectUri, origins)
    ) {
      securityEvent(
        "oauth.state_rejected",
        String(res.getHeader("X-Request-ID") ?? "")
      );
      res.status(403).json({
        error: {
          code: "OAUTH_STATE_INVALID",
          message:
            "Sign-in could not be verified. Open the app directly, allow cookies and try again.",
        },
      });
      return;
    }
    res.clearCookie(stateCookieName(req), {
      path: "/",
      secure: getSessionCookieOptions(req).secure,
      sameSite: "lax",
    });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      if (
        typeof tokenResponse.accessToken !== "string" ||
        !tokenResponse.accessToken
      )
        throw new Error("Invalid provider exchange");
      const info = providerIdentity.parse(
        await sdk.getUserInfo(tokenResponse.accessToken)
      );
      if (info.projectId !== process.env.VITE_APP_ID)
        throw new Error("Invalid provider audience");
      const user = await saveOAuthIdentity({
        openId: info.openId,
        name: info.name ?? null,
        email: info.email ?? null,
        loginMethod: info.loginMethod ?? info.platform ?? null,
      });
      const sessions = identityService();
      // Reauthentication never reuses an existing browser session identifier.
      await sessions.revoke(
        parse(req.headers.cookie ?? "")[sessionCookieName(req)]
      );
      const session = await sessions.start(user);
      res.cookie(sessionCookieName(req), session.token, {
        ...getSessionCookieOptions(req),
        maxAge: Math.max(0, session.expiresAtMs - Date.now()),
      });
      securityEvent(
        "oauth.session_created",
        String(res.getHeader("X-Request-ID") ?? "")
      );
      res.redirect(302, "/identity");
    } catch (error) {
      const unavailable = error instanceof IdentityStorageUnavailable;
      securityEvent(
        unavailable ? "identity.storage_unavailable" : "oauth.callback_failed",
        String(res.getHeader("X-Request-ID") ?? "")
      );
      res.status(unavailable ? 503 : 502).json({
        error: {
          code: unavailable ? "IDENTITY_UNAVAILABLE" : "OAUTH_UNAVAILABLE",
          message: "Sign-in could not be completed. Please try again.",
        },
      });
    }
  });
}
