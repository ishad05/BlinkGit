import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeatureStrip } from "@/components/FeatureStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";
import { ResultsPage } from "@/components/ResultsPage";
import { useAnalysis } from "@/hooks/useAnalysis";
import "./index.css";

const queryClient = new QueryClient();

function getRepoFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("repo");
}

function AppInner() {
  const { data, submit, isLoading, error, stop } = useAnalysis();
  const [currentRepo, setCurrentRepo] = useState<string | null>(() => getRepoFromUrl());
  const didAutoSubmit = useRef(false);

  // On mount (or when submit becomes available), auto-trigger if URL has a repo
  useEffect(() => {
    if (didAutoSubmit.current) return;
    const repo = getRepoFromUrl();
    if (repo) {
      didAutoSubmit.current = true;
      submit(`https://github.com/${repo}`);
    }
  }, [submit]);

  // Handle browser back/forward navigation
  useEffect(() => {
    function onPopState() {
      const repo = getRepoFromUrl();
      if (repo) {
        setCurrentRepo(repo);
        submit(`https://github.com/${repo}`);
      } else {
        stop();
        setCurrentRepo(null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [submit, stop]);

  function handleAnalyze(repoUrl: string) {
    const match = repoUrl.match(/github\.com\/([^/?#]+\/[^/?#]+)/);
    const repo = match ? match[1].replace(/\.git$/, "") : repoUrl;
    setCurrentRepo(repo);
    window.history.pushState({}, "", `?repo=${encodeURIComponent(repo)}`);
    submit(repoUrl);
  }

  function handleNewAnalysis() {
    stop();
    setCurrentRepo(null);
    window.history.pushState({}, "", window.location.pathname);
  }

  if (currentRepo) {
    return (
      <ResultsPage
        repo={currentRepo}
        analysis={data}
        isStreaming={isLoading}
        onNewAnalysis={handleNewAnalysis}
      />
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {error && (
          <div className="mx-auto max-w-xl px-6 pt-4">
            <div className="flex items-center gap-3 border border-destructive/40 bg-destructive/5 px-4 py-3">
              <span className="flex-1 font-mono text-xs text-destructive">
                {error.message}
              </span>
              <button
                type="button"
                onClick={handleNewAnalysis}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
              >
                dismiss
              </button>
            </div>
          </div>
        )}
        <HeroSection onSubmit={handleAnalyze} isLoading={isLoading} />
        <FeatureStrip />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppInner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
