import { useState, useEffect, useRef } from "react";
import { useThemeStore } from "@/stores/themeStore";
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
  const { theme } = useThemeStore();
  const { data, submit, isLoading, error, stop } = useAnalysis();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);
  const [currentRepo, setCurrentRepo] = useState<string | null>(() => getRepoFromUrl());
  const submitRef = useRef(submit);
  submitRef.current = submit;

  // Run once on mount — if URL has a repo, auto-trigger analysis
  useEffect(() => {
    const repo = getRepoFromUrl();
    if (repo) {
      submitRef.current(`https://github.com/${repo}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        error={error ?? null}
        onNewAnalysis={handleNewAnalysis}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
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
