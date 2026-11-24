import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function Foundation() {
  const status = trpc.foundation.status.useQuery(undefined, { retry: false });
  return (
    <main className="min-h-screen bg-[#f5f2eb] px-6 py-10 text-[#1a2925]">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>
        <p className="mt-16 text-xs font-semibold tracking-[0.2em] uppercase text-[#647264]">
          Engineering preview
        </p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">
          A foundation you can inspect.
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-[#5a655d]">
          This screen reads the current capability boundary from the server. It
          does not represent a finished customer service.
        </p>
        <section
          className="mt-10 border-y border-[#1a2925]/20 py-8"
          aria-live="polite"
          aria-label="Foundation status"
        >
          {status.isLoading && <p>Checking the foundation API…</p>}
          {status.error && (
            <p role="alert">
              The foundation API is unavailable. Retry below; no service
              readiness is assumed.
            </p>
          )}
          {status.data && (
            <>
              <p className="text-sm">API connected · {status.data.phase}</p>
              <dl className="mt-6 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
                {[
                  ["Customer requests", status.data.acceptsRequests],
                  ["Live billing", status.data.billingEnabled],
                  ["Provider discovery", status.data.providerDiscoveryEnabled],
                  ["AI recommendations", status.data.aiEnabled],
                ].map(([label, available]) => (
                  <div key={String(label)}>
                    <dt className="text-[#647264]">{label}</dt>
                    <dd className="mt-1 font-medium">
                      {available ? "Enabled" : "Not enabled"}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <Button
            variant="outline"
            className="mt-7"
            disabled={status.isFetching}
            onClick={() => void status.refetch()}
          >
            <RefreshCw className="mr-2 size-4" />{" "}
            {status.isFetching ? "Checking…" : "Refresh status"}
          </Button>
        </section>
        <p className="mt-7 text-sm leading-relaxed text-[#5a655d]">
          Next: identity and data contracts, followed by the complete client →
          administrator → client request journey. Payment and provider
          integrations follow their own verification gates.
        </p>
      </div>
    </main>
  );
}
