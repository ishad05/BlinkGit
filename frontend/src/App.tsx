import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeatureStrip } from "@/components/FeatureStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";
import "./index.css";

// TODO(step-2): import OverviewPanel, IssueRanker, ArchDiagram, ModelSwitcher
// TODO(step-3): wire useObject streaming from @ai-sdk/react against POST /analyze
// TODO(step-3): connect ModelSwitcher to GET/POST /models endpoint

const queryClient = new QueryClient();

function AppInner() {
  function handleAnalyze(repoUrl: string) {
    // TODO(step-3): kick off streaming analysis
    console.log("analyze", repoUrl);
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        <HeroSection onSubmit={handleAnalyze} isLoading={false} />
        <FeatureStrip />
        <HowItWorks />

        {/* TODO(step-2): results area — OverviewPanel, IssueRanker, ArchDiagram */}
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
