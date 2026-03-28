// TODO: implement repo overview display (purpose, tech stack, key files, highlights)

interface Overview {
  purpose: string;
  techStack: string[];
  keyFiles: string[];
  highlights: string[];
}

interface OverviewPanelProps {
  overview: Overview | undefined;
}

export function OverviewPanel({ overview: _overview }: OverviewPanelProps) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-gray-400 text-sm">OverviewPanel — TODO</p>
    </div>
  );
}
