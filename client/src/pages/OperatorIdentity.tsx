import { getIdentityErrorState, useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { IdentityPortalLayout, SignOutControl } from "./Identity";

export default function OperatorIdentity() {
  const auth = useAuth();
  // This request is never enabled/authorized by a client role. Even direct
  // navigation by a customer or anonymous browser reaches the backend check.
  const access = trpc.operator.access.useQuery(undefined, {
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const failure = access.error ? getIdentityErrorState(access.error) : null;
  const signedOut = auth.logoutState === "success";
  const checking = access.isFetching || access.isLoading;
  const verified =
    !signedOut &&
    !checking &&
    !access.error &&
    access.data?.identityRole === "operator" &&
    access.data.accessVerified === true;

  return (
    <IdentityPortalLayout operator>
      <section
        className="border border-[#1a2925]/20 bg-[#fbf9f4] p-6 sm:p-8"
        aria-label="Operator access verification"
        aria-busy={checking || auth.logoutPending}
      >
        {signedOut ? (
          <div role="status">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#536b58]">
              Signed out · server confirmed
            </p>
            <h2 className="mt-4 font-serif text-3xl">
              Your session has ended.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#5a655d]">
              Return to your identity page if you want to sign in again.
              Operator access must be checked for each session.
            </p>
          </div>
        ) : checking ? (
          <div role="status" className="py-6">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#536b58]">
              Checking operator access
            </p>
            <h2 className="mt-4 font-serif text-3xl">
              Verification, not assumption.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#5a655d]">
              Waiting for the backend authorization check. A navigation link or
              account label does not establish operator access.
            </p>
          </div>
        ) : failure ? (
          <div role="alert">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#713c2f]">
              {failure === "unauthorized"
                ? "Sign-in required"
                : failure === "forbidden"
                  ? "Operator access denied"
                  : "Access not verified"}
            </p>
            <h2 className="mt-4 font-serif text-3xl">
              {failure === "unauthorized"
                ? "A valid session is required."
                : failure === "forbidden"
                  ? "This identity is not authorized."
                  : failure === "unavailable"
                    ? "The access service is unavailable."
                    : "We could not verify operator access."}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#5a655d]">
              {failure === "unauthorized"
                ? "Your session is missing, expired, or revoked. Go to Identity and choose Sign in when ready. You will not be redirected automatically."
                : failure === "forbidden"
                  ? "The server denied operator access for this account. Customer sign-in does not grant operator permissions; provisioning requires explicit approval for a verified identity."
                  : failure === "unavailable"
                    ? "This is a service failure, not an anonymous session or proof of permission. Retry later; the public home and foundation remain available."
                    : "The backend check did not succeed. Check your connection and retry. No operator access or service readiness is assumed."}
            </p>
          </div>
        ) : verified ? (
          <>
            <div
              role="status"
              className="flex items-center gap-3 text-xs font-semibold tracking-[0.15em] uppercase text-[#536b58]"
            >
              <ShieldCheck className="size-5" aria-hidden="true" />
              Operator access verified
            </div>
            <h2 className="mt-4 font-serif text-3xl">
              A confirmed identity. A bounded portal.
            </h2>
            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#5a655d]">Identity role</dt>
                <dd className="mt-1 font-medium">Operator</dd>
              </div>
              <div>
                <dt className="text-[#5a655d]">Access verification</dt>
                <dd className="mt-1 font-medium">Confirmed by the backend</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-[#5a655d]">
              The operator access endpoint accepted your current session. This
              verifies only this access check; it does not enable a request
              queue, customer records, provider tools, or billing. Future
              protected actions must still be authorized by the backend.
            </p>
          </>
        ) : (
          <div role="alert">
            <h2 className="font-serif text-3xl">Access was not verified.</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#5a655d]">
              No successful operator verification was returned. You can retry
              the check or return to Identity.
            </p>
          </div>
        )}
        {!signedOut && (verified || auth.user) && (
          <SignOutControl auth={auth} />
        )}
        <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-[#1a2925]/20 pt-5">
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-none border-[#1a2925]/30 px-5 text-[#1a2925] hover:bg-[#e8e8df]"
          >
            <Link href="/identity">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Identity
            </Link>
          </Button>
          {!signedOut && (
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-none border-[#1a2925]/30 px-5 text-[#1a2925] hover:bg-[#e8e8df]"
              disabled={checking || auth.logoutPending}
              onClick={() => void access.refetch()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              {checking ? "Checking access…" : "Recheck access"}
            </Button>
          )}
        </div>
      </section>
    </IdentityPortalLayout>
  );
}
