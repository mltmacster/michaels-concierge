import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Foundation from "./pages/Foundation";

function MissingPage() {
  return (
    <main className="min-h-screen bg-[#f5f2eb] p-10 text-[#1a2925]">
      <h1 className="font-serif text-4xl">Page not found</h1>
      <p className="my-5">This route is not part of the foundation release.</p>
      <Link href="/" className="underline">
        Return to home
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/foundation" component={Foundation} />
            <Route component={MissingPage} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
