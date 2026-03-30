import { cn } from "@/lib/utils";

export type ResultsTab = "overview" | "architecture" | "setup" | "issues" | "chat";

const NAV_ITEMS: { tab: ResultsTab; icon: string; label: string }[] = [
  { tab: "overview",     icon: "⊙", label: "Overview"     },
  { tab: "architecture", icon: "⬡", label: "Architecture" },
  { tab: "setup",        icon: "$", label: "Setup"        },
  { tab: "issues",       icon: "#", label: "Issues"       },
  { tab: "chat",         icon: "~", label: "Chat"         },
];

interface ResultsSidebarProps {
  activeTab: ResultsTab;
  onTabChange: (tab: ResultsTab) => void;
}

export function ResultsSidebar({ activeTab, onTabChange }: ResultsSidebarProps) {
  return (
    <aside className="flex w-[200px] flex-shrink-0 flex-col border-r border-border/50 py-2">
      {NAV_ITEMS.map(({ tab, icon, label }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              "flex items-center gap-2.5 border-l-2 px-5 py-2.5 text-left transition-colors",
              isActive
                ? "border-green-500 bg-white/5 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "font-mono text-sm",
                isActive ? "text-green-500" : "text-muted-foreground",
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
            <span className={cn("font-mono text-[11px] tracking-[0.06em]", isActive && "font-semibold")}>
              {label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
