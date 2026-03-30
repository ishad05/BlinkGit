import { ArrowUpRight, GitBranch, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/lib/constants";
import { useThemeStore } from "@/stores/themeStore";

export function Navbar() {
  const { theme, toggle } = useThemeStore();

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
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center border border-border/50 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 font-mono text-xs tracking-wide"
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <GitBranch className="h-3.5 w-3.5" />
              View Source
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
