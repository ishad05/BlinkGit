import { Github } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const GITHUB_URL = "https://github.com/harshsngh1/BlinkGit";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[800px] items-center justify-between px-4 sm:px-0">
        {/* Logo */}
        <a href="/" aria-label="BlinkGit home">
          <Logo size="md" />
        </a>

        {/* Nav right */}
        <nav className="flex items-center gap-6">
          <a
            href="#how-it-works"
            className="hidden font-mono text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            How it works
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden font-mono text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Docs
          </a>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 font-mono text-xs tracking-wide"
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-3.5 w-3.5" />
              View Source
              <span className="text-muted-foreground">↗</span>
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
