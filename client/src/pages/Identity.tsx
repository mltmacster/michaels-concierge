import { getIdentityErrorState, useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import {
  ArrowRight,
  Compass,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "wouter";

const primaryButton =
  "h-12 rounded-none bg-[#1a2925] px-6 text-white hover:bg-[#31493d] focus-visible:ring-[#1a2925]/50";
const secondaryButton =
  "h-12 rounded-none border-[#1a2925]/30 px-5 text-[#1a2925] hover:bg-[#e8e8df] focus-visible:ring-[#1a2925]/50";
const navigationLink =
  "underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4";

// A public identity portal, deliberately not the unused concierge dashboard.
export function IdentityPortalLayout({
  operator = false,
  children,
}: {
  operator?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f2eb] text-[#1a2925]">
      <a
        href="#identity-main"
        className="sr-only focus:not-sr-only focus:block focus:p-4"
      >
        Skip to content
      </a>
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-7 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Michaels Concierge home"
        >
          <span className="flex size-10 items-center justify-center rounded-full border border-[#1a2925]/30">
            <Compass size={22} aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-[0.12em] uppercase">
            Michaels
            <br />
            <span className="text-[10px] font-normal tracking-[0.3em]">
              Concierge
            </span>
          </span>
        </Link>
        <nav
          aria-label="Identity navigation"
          className="flex flex-wrap gap-x-6 gap-y-3 text-sm"
        >
          <Link href="/" className={navigationLink}>
            Home
          </Link>
          <Link
            href="/identity"
            className={navigationLink}
            aria-current={!operator ? "page" : undefined}
          >
            Identity
          </Link>
          <Link href="/foundation" className={navigationLink}>
            Foundation
          </Link>
        </nav>
      </header>
      <main
        id="identity-main"
        className="mx-auto max-w-7xl px-6 pb-16 pt-10 md:px-12 md:pt-20"
      >
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#536b58]">
          Phase 1 · Identity &amp; session security
        </p>
        <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight tracking-tight md:text-6xl">
          {operator ? "Operator identity." : "Your identity. A clear boundary."}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5a655d]">
          {operator
            ? "A server-verified access check for approved operators. This is not a concierge dashboard."
            : "Sign in to view your own account and its permissions. This is an identity preview, not a customer service launch."}
        </p>
        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {children}
          <aside
            className="border-t border-[#1a2925]/20 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
            aria-labelledby="session-policy-title"
          >
            <ShieldCheck
              className="mb-5 size-6 text-[#536b58]"
              aria-hidden="true"
            />
            <h2 id="session-policy-title" className="font-serif text-2xl">
              Trust has limits.
            </h2>
            <div className="mt-5 space-y-5 text-sm leading-relaxed text-[#5a655d]">
              <p>
                Sessions use a server-managed, HttpOnly cookie. Profile details
                and bearer tokens are not written to browser storage by this
                portal. Cookies must be allowed; there is no alternate token
                sign-in.
              </p>
              <p>
                Session policy is enforced by the server. The proposed defaults
                are a one-hour absolute limit and a fifteen-minute idle limit;
                deployment configuration may vary. An expired or revoked session
                requires sign-in again.
              </p>
              <p>
                Permissions come from the current account on the server. A role
                label or a visible link cannot grant operator access. Sign-out
                is confirmed only after the server reports success.
              </p>
              <p className="border-t border-[#1a2925]/20 pt-5">
                Customer requests, reservations, provider discovery, AI
                recommendations, and billing remain unavailable.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <footer className="mx-auto max-w-7xl border-t border-[#1a2925]/20 px-6 py-7 text-xs text-[#5a655d] md:px-12">
        Michaels Global Executive Mobile Concierge Service · Identity preview
      </footer>
    </div>
  );
}

export function SignOutControl({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const failure = auth.logoutError
    ? getIdentityErrorState(auth.logoutError)
    : null;
  async function handleSignOut() {
    try {
      await auth.logout();
    } catch {
      // The mutation's explicit error state stays visible; never claim success.
    }
  }
  return (
    <div className="mt-7">
      <Button
        type="button"
        variant="outline"
        className={secondaryButton}
        disabled={auth.logoutPending || auth.refreshing}
        onClick={() => void handleSignOut()}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {auth.logoutPending
          ? "Signing out…"
          : failure
            ? "Retry sign-out"
            : "Sign out"}
      </Button>
      {failure && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-[#8c4535] pl-4 text-sm leading-relaxed text-[#713c2f]"
        >
          {failure === "unavailable"
            ? "The session service is unavailable. Sign-out was not confirmed; your session may still be active. Please retry."
            : failure === "unauthorized"
              ? "The server did not confirm session revocation. Sign-out was not completed; check your identity or retry."
              : failure === "forbidden"
                ? "The server rejected this sign-out request. Your session may still be active; open the secure site and retry."
                : "Sign-out could not be confirmed. Your session may still be active. Check your connection and retry."}
        </p>
      )}
    </div>
  );
}

export default function Identity() {
  const auth = useAuth();
  const [loginPending, setLoginPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const anonymous =
    auth.status === "anonymous" || auth.status === "unauthorized";
  const signedIn = auth.status === "authenticated" && auth.user;
  const failed = ["forbidden", "unavailable", "error"].includes(auth.status);

  function handleSignIn() {
    if (loginPending) return;
    setLoginError(null);
    setLoginPending(true);
    try {
      startLogin();
    } catch (error: unknown) {
      setLoginPending(false);
      setLoginError(
        error instanceof Error
          ? error.message
          : "Secure sign-in could not start. Open this site in a full browser and retry."
      );
    }
  }

  return (
    <IdentityPortalLayout>
      <section
        className="border border-[#1a2925]/20 bg-[#fbf9f4] p-6 sm:p-8"
        aria-label="Your identity and session"
        aria-busy={auth.loading || auth.refreshing || auth.logoutPending}
      >
        {auth.loading ? (
          <div role="status" className="py-6">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#536b58]">
              Checking identity
            </p>
            <h2 className="mt-4 font-serif text-3xl">
              A moment to verify your session.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#5a655d]">
              Waiting for the identity service. No access is assumed while this
              check is in progress.
            </p>
          </div>
        ) : (
          <>
            {anonymous && (
              <>
                <p
                  role="status"
                  className="text-xs font-semibold tracking-[0.15em] uppercase text-[#536b58]"
                >
                  {auth.logoutState === "success"
                    ? "Signed out · server confirmed"
                    : auth.status === "unauthorized"
                      ? "Session not valid"
                      : "Not signed in"}
                </p>
                <h2 className="mt-4 font-serif text-3xl">
                  {auth.status === "unauthorized"
                    ? "Sign in again to continue."
                    : "An explicit first step."}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[#5a655d]">
                  {auth.status === "unauthorized"
                    ? "Your session is missing, expired, or revoked. Sign in when you are ready; you will not be redirected automatically."
                    : "Use the existing managed sign-in portal to verify your identity. New identities receive customer access; this does not enable concierge services."}
                </p>
                <Button
                  type="button"
                  className={`${primaryButton} mt-7`}
                  onClick={handleSignIn}
                  disabled={loginPending || auth.refreshing}
                >
                  {loginPending ? "Opening secure sign-in…" : "Sign in"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                {loginPending && (
                  <p role="status" className="mt-3 text-sm text-[#5a655d]">
                    Continue in the managed sign-in portal.
                  </p>
                )}
                {loginError && (
                  <p
                    role="alert"
                    className="mt-4 text-sm leading-relaxed text-[#713c2f]"
                  >
                    {loginError}
                  </p>
                )}
              </>
            )}
            {failed && (
              <div role="alert">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#713c2f]">
                  {auth.status === "forbidden"
                    ? "Access denied"
                    : "Identity not verified"}
                </p>
                <h2 className="mt-4 font-serif text-3xl">
                  {auth.status === "unavailable"
                    ? "The session service is unavailable."
                    : auth.status === "forbidden"
                      ? "This request was not permitted."
                      : "We could not check your identity."}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[#5a655d]">
                  {auth.status === "unavailable"
                    ? "This is a service failure, not proof that you are signed out. Retry the check; public home and foundation pages remain available."
                    : auth.status === "forbidden"
                      ? "The server denied this identity request. No permissions or operator access are assumed. You can return home or retry from the secure site."
                      : "Check your connection and retry. A failed check does not confirm sign-out, and no automatic sign-in will start."}
                </p>
              </div>
            )}
            {signedIn && (
              <>
                <p
                  role="status"
                  className="text-xs font-semibold tracking-[0.15em] uppercase text-[#536b58]"
                >
                  Signed in · {signedIn.identityRole}
                </p>
                <h2 className="mt-4 font-serif text-3xl">
                  {signedIn.name || "Your account"}
                </h2>
                <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[#5a655d]">Account ID</dt>
                    <dd className="mt-1 font-medium">{signedIn.id}</dd>
                  </div>
                  <div>
                    <dt className="text-[#5a655d]">Identity</dt>
                    <dd className="mt-1 font-medium capitalize">
                      {signedIn.identityRole}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[#5a655d]">Email</dt>
                    <dd className="mt-1 break-words font-medium">
                      {signedIn.email || "Not provided"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-7 border-t border-[#1a2925]/20 pt-5">
                  <h3 className="font-semibold">Current permissions</h3>
                  {signedIn.permissions.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm text-[#5a655d]">
                      {signedIn.permissions.map(permission => (
                        <li
                          key={permission}
                          className="break-words border-l-2 border-[#536b58]/30 pl-3"
                        >
                          {permission}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[#5a655d]">
                      No permissions were returned for this account.
                    </p>
                  )}
                  <p className="mt-4 text-sm leading-relaxed text-[#5a655d]">
                    These are server-reported permissions for your account, not
                    controls you can edit. Every protected request is
                    independently authorized by the backend.
                  </p>
                </div>
                {signedIn.identityRole === "operator" && (
                  <Button asChild className={`${primaryButton} mt-6`}>
                    <Link href="/operator">
                      Verify operator access
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </>
            )}
            {(signedIn || (failed && auth.user)) && (
              <SignOutControl auth={auth} />
            )}
            <div className="mt-7 border-t border-[#1a2925]/20 pt-5">
              <Button
                type="button"
                variant="outline"
                className={secondaryButton}
                disabled={auth.refreshing || auth.logoutPending || loginPending}
                onClick={() => void auth.refresh()}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                {auth.refreshing ? "Checking identity…" : "Refresh identity"}
              </Button>
              {auth.refreshing && (
                <p role="status" className="mt-3 text-sm text-[#5a655d]">
                  Rechecking your session with the server…
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </IdentityPortalLayout>
  );
}
