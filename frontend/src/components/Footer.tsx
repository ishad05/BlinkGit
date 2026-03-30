import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { GITHUB_URL, GITHUB_ISSUES_URL, GITHUB_RELEASES_URL, GITHUB_README_URL } from "@/lib/constants";

const PROJECT_LINKS = [
  { label: "Source Code", href: GITHUB_URL, external: true },
  { label: "Docs", href: GITHUB_README_URL, external: true },
  { label: "Changelog", href: GITHUB_RELEASES_URL, external: true },
  { label: "Report an Issue", href: GITHUB_ISSUES_URL, external: true },
];

const STACK_LINKS = [
  { label: "React + Vite", href: "https://vitejs.dev" },
  { label: "Hono + Node.js", href: "https://hono.dev" },
  { label: "Vercel AI SDK", href: "https://sdk.vercel.ai" },
  { label: "Railway + CF Pages", href: "https://railway.app" },
];

function FooterLinkGroup({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground/40">
        {heading}
      </p>
      {links.map(({ label, href, external }) => (
        <a
          key={label}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          {label}
          {external && <ArrowUpRight className="h-3 w-3" />}
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-border/50">
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-0">
        {/* Top row */}
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: brand */}
          <div className="flex flex-col gap-4 sm:max-w-[260px]">
            <Logo size="md" />
            <p className="font-mono text-xs leading-relaxed text-muted-foreground/40">
              AI-powered GitHub repository intelligence. Architecture diagrams,
              ranked issues, and codebase overviews — streamed live.
            </p>
            <div className="inline-flex w-fit items-center gap-2 border border-border/50 px-3 py-1">
              <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground/40">
                FOSS HACK 2025
              </span>
            </div>
          </div>

          {/* Right: link columns */}
          <div className="flex gap-16">
            <FooterLinkGroup heading="PROJECT" links={PROJECT_LINKS} />
            <FooterLinkGroup heading="STACK" links={STACK_LINKS} />
          </div>
        </div>

        {/* Bottom bar */}
        <Separator className="my-8 opacity-30" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-muted-foreground/30">
            © 2025 BlinkGit. Open source under MIT License.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground/30">
            Built for FOSS Hack 2025 · Deployed on Railway &amp; Cloudflare
          </p>
        </div>
      </div>
    </footer>
  );
}
