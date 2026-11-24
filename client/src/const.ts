import {
  DEV_OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE,
  encodeOAuthState,
} from "@shared/const";

export { COOKIE_NAME, DEV_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

let loginInProgress = false;

// Call only from an explicit user action. This creates a browser-bound nonce
// and immediately opens the existing managed OAuth portal, never another login.
export const startLogin = () => {
  if (loginInProgress) return;

  const { origin, protocol, hostname } = window.location;
  const secure = protocol === "https:";
  const loopback = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(
    hostname
  );
  const localDevelopment =
    import.meta.env.DEV && protocol === "http:" && loopback;

  if (!secure && !localDevelopment) {
    throw new Error(
      "Sign-in requires HTTPS. Open the secure site, or use HTTP on localhost only in a development server."
    );
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  const appId = import.meta.env.VITE_APP_ID?.trim();
  const configurationError =
    "Sign-in is not configured. Ask the site administrator to configure the managed OAuth portal and application ID.";
  if (!oauthPortalUrl || !appId) throw new Error(configurationError);

  let portal: URL;
  try {
    portal = new URL(oauthPortalUrl);
  } catch {
    throw new Error(configurationError);
  }
  if (portal.protocol !== "https:" || portal.username || portal.password) {
    throw new Error(configurationError);
  }

  let nonce: string;
  try {
    nonce = window.crypto.randomUUID();
  } catch {
    throw new Error(
      "This browser cannot start a secure sign-in. Use an up-to-date browser on the HTTPS site."
    );
  }

  // The backend validates this actual browser origin against its own allowlist.
  const redirectUri = `${origin}/api/oauth/callback`;
  const state = encodeOAuthState({ redirectUri, nonce });
  const url = new URL("/app-auth", portal);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  // No Domain attribute: HTTPS uses the host-prefixed production nonce cookie.
  // HTTP loopback development has a distinct name and no insecure fallback.
  const cookieName = secure ? OAUTH_STATE_COOKIE : DEV_OAUTH_STATE_COOKIE;
  const cookieOptions = `Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
  document.cookie = `${cookieName}=${nonce}; Max-Age=600; ${cookieOptions}`;
  const nonceStored = document.cookie
    .split(";")
    .some(cookie => cookie.trim() === `${cookieName}=${nonce}`);
  if (!nonceStored) {
    throw new Error(
      "Cookies are required for sign-in. Allow cookies for this site and open it in a full browser window, then try again."
    );
  }

  loginInProgress = true;
  try {
    window.location.assign(url.toString());
  } catch {
    loginInProgress = false;
    document.cookie = `${cookieName}=; Max-Age=0; ${cookieOptions}`;
    throw new Error(
      "The browser could not open secure sign-in. Open this site in a full browser window and try again."
    );
  }
};
