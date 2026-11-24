import { ArrowRight, ArrowUpRight, Check, Compass } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f2eb] text-[#1a2925]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:block focus:p-4"
      >
        Skip to content
      </a>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Michaels Concierge home"
        >
          <span className="flex size-10 items-center justify-center rounded-full border border-[#1a2925]/30">
            <Compass size={22} />
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
          aria-label="Main navigation"
          className="flex flex-wrap justify-end gap-x-5 gap-y-2 text-sm"
        >
          <Link
            href="/identity"
            className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Identity
          </Link>
          <Link
            href="/foundation"
            className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Build status <ArrowUpRight className="ml-1 inline size-4" />
          </Link>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-6 md:px-12">
        <section className="grid gap-12 py-16 md:grid-cols-[1.3fr_1fr] md:py-28">
          <div>
            <p className="mb-7 text-xs font-semibold tracking-[0.2em] uppercase text-[#647264]">
              Considered service. Built on trust.
            </p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Your time.
              <br />
              Thoughtfully
              <br />
              <span className="italic text-[#536b58]">taken care of.</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-[#5a655d]">
              A new foundation for personal dining and local-experience
              concierge service. Human-led attention, with technology that keeps
              every detail connected.
            </p>
            <Link href="/foundation">
              <Button className="mt-9 h-12 rounded-none bg-[#1a2925] px-6 text-white hover:bg-[#31493d]">
                Explore the foundation <ArrowRight className="ml-3 size-4" />
              </Button>
            </Link>
          </div>
          <aside className="self-center border-l border-[#1a2925]/20 pl-8 md:pl-12">
            <p className="mb-5 text-xs font-semibold tracking-[0.18em] uppercase">
              A deliberate rebuild
            </p>
            <p className="font-serif text-3xl leading-snug">
              The experience starts with a dependable foundation—not a promise
              we cannot yet keep.
            </p>
            <div className="mt-8 space-y-4 text-sm text-[#5a655d]">
              <p className="flex items-center gap-3">
                <Check className="size-4" /> One coherent client and server
                stack
              </p>
              <p className="flex items-center gap-3">
                <Check className="size-4" /> Public source and repeatable
                quality checks
              </p>
              <p className="flex items-center gap-3">
                <Check className="size-4" /> No fabricated provider data
              </p>
            </div>
            <p className="mt-8 border-t border-[#1a2925]/20 pt-5 text-xs leading-relaxed">
              Foundation and identity preview—not a customer service launch.
              Customer requests, reservations, AI recommendations, and billing
              are not available in this release.
            </p>
          </aside>
        </section>
        <section
          className="grid gap-7 border-t border-[#1a2925]/20 py-10 md:grid-cols-3"
          aria-label="Delivery principles"
        >
          {[
            [
              "01",
              "Design",
              "A clear journey, a bounded service, and explicit decisions.",
            ],
            [
              "02",
              "Development",
              "Typed contracts, tested behavior, and traceable evidence.",
            ],
            [
              "03",
              "Deployment",
              "A reproducible artifact, safe configuration, and a recovery path.",
            ],
          ].map(([number, title, copy]) => (
            <div key={title}>
              <span className="text-xs text-[#647264]">{number}</span>
              <h2 className="mt-3 font-serif text-2xl">{title}</h2>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#5a655d]">
                {copy}
              </p>
            </div>
          ))}
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-6 py-8 text-xs text-[#647264] md:px-12">
        <p>Michaels Global Executive Mobile Concierge Service</p>
        <a
          href="https://github.com/mltmacster/michaels-concierge"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          Source &amp; engineering evidence{" "}
          <ArrowUpRight className="inline size-3" />
        </a>
      </footer>
    </div>
  );
}
