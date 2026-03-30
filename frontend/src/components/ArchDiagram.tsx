import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { Architecture } from "@/components/ResultsPage";

// ---------------------------------------------------------------------------
// Layout — topological layers, left → right
// ---------------------------------------------------------------------------

const NODE_W = 180;
const NODE_H = 68;
const LAYER_GAP = 170;
const NODE_GAP = 44;

function computeLayout(
  nodes: Array<{ id: string }>,
  edges: Array<{ from: string; to: string }>,
): Map<string, { x: number; y: number }> {
  const inDegree = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map<string, string[]>(nodes.map((n) => [n.id, []]));

  for (const e of edges) {
    adj.get(e.from)?.push(e.to);
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }

  const layers: string[][] = [];
  const placed = new Set<string>();
  let current = nodes
    .filter((n) => (inDegree.get(n.id) ?? 0) === 0)
    .map((n) => n.id);

  while (current.length > 0) {
    layers.push(current);
    current.forEach((id) => placed.add(id));
    const next: string[] = [];
    for (const id of current) {
      for (const nb of adj.get(id) ?? []) {
        const deg = (inDegree.get(nb) ?? 0) - 1;
        inDegree.set(nb, deg);
        if (deg === 0 && !placed.has(nb)) next.push(nb);
      }
    }
    current = next;
  }

  // remaining nodes (cycles / disconnected)
  const rest = nodes.filter((n) => !placed.has(n.id)).map((n) => n.id);
  if (rest.length > 0) layers.push(rest);

  const positions = new Map<string, { x: number; y: number }>();
  layers.forEach((layer, li) => {
    const totalH = layer.length * NODE_H + (layer.length - 1) * NODE_GAP;
    layer.forEach((id, ni) => {
      positions.set(id, {
        x: li * (NODE_W + LAYER_GAP),
        y: ni * (NODE_H + NODE_GAP) - totalH / 2 + 240,
      });
    });
  });

  return positions;
}

// ---------------------------------------------------------------------------
// Edge style — infer from verb label
// ---------------------------------------------------------------------------

const DATA_VERBS = new Set([
  "reads",
  "writes",
  "queries",
  "stores",
  "sends",
  "receives",
  "streams",
]);

function edgeStyle(label?: string): React.CSSProperties {
  const v = label?.toLowerCase().trim();
  return v && DATA_VERBS.has(v)
    ? { stroke: "rgba(255,255,255,0.22)", strokeDasharray: "5,4", strokeWidth: 1.5 }
    : { stroke: "rgba(255,255,255,0.16)", strokeWidth: 1.5 };
}

// ---------------------------------------------------------------------------
// Custom node
// ---------------------------------------------------------------------------

type ArchNodeData = { label: string; nodeType: string };
type ArchNodeType = Node<ArchNodeData, "arch">;

function ArchNode({ data }: NodeProps<ArchNodeType>) {
  const isEntry = data.nodeType === "entry";
  return (
    <div
      className="flex flex-col justify-center gap-1.5 px-3 py-2.5"
      style={{
        width: NODE_W,
        height: NODE_H,
        background: "#1a1a1a",
        border: `1px solid ${isEntry ? "#22C55E" : "rgba(255,255,255,0.1)"}`,
        boxShadow: isEntry ? "0 0 0 1px rgba(34,197,94,0.15)" : "none",
      }}
    >
      <span
        className="font-mono text-[9px] uppercase tracking-[0.14em]"
        style={{ color: isEntry ? "#22C55E" : "rgba(255,255,255,0.3)" }}
      >
        {data.nodeType}
      </span>
      <span className="truncate font-mono text-[11px] font-medium leading-tight text-white/85">
        {data.label}
      </span>
    </div>
  );
}

const nodeTypes = { arch: ArchNode };

// ---------------------------------------------------------------------------
// Toolbar — needs to be inside ReactFlowProvider to use useReactFlow
// ---------------------------------------------------------------------------

function Toolbar({
  nodeCount,
  edgeCount,
}: {
  nodeCount: number;
  edgeCount: number;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <div className="flex items-center gap-3 border-b border-white/8 bg-[#1C1C1C]/90 px-4 py-2 backdrop-blur-sm">
      <span className="font-mono text-[11px] tracking-[0.12em] text-white/35">
        ARCHITECTURE
      </span>
      <span className="font-mono text-[10px] text-white/20">
        {nodeCount} nodes · {edgeCount} edges
      </span>
      <div className="ml-auto flex items-center gap-1">
        {(
          [
            {
              icon: Maximize2,
              action: () => fitView({ padding: 0.15, duration: 300 }),
              label: "Fit view",
            },
            {
              icon: Minus,
              action: () => zoomOut({ duration: 200 }),
              label: "Zoom out",
            },
            {
              icon: Plus,
              action: () => zoomIn({ duration: 200 }),
              label: "Zoom in",
            },
          ] as const
        ).map(({ icon: Icon, action, label }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            aria-label={label}
            className="flex h-6 w-6 items-center justify-center border border-white/8 text-white/35 transition-colors hover:border-white/20 hover:text-white/70"
          >
            <Icon className="h-3 w-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

function Legend() {
  return (
    <div className="flex items-center gap-5 border-t border-white/8 bg-[#1C1C1C]/90 px-4 py-1.5 backdrop-blur-sm">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/20">
        Legend
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-px w-5 bg-white/25" />
        <span className="font-mono text-[9px] text-white/30">Dependency</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="20" height="2" className="overflow-visible">
          <line
            x1="0"
            y1="1"
            x2="20"
            y2="1"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeDasharray="5,3"
          />
        </svg>
        <span className="font-mono text-[9px] text-white/30">Data flow</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-px w-5 bg-green-500" />
        <span className="font-mono text-[9px] text-white/30">Entry point</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner canvas (must be inside ReactFlowProvider)
// ---------------------------------------------------------------------------

function DiagramCanvas({ architecture }: { architecture: Architecture }) {
  const positions = useMemo(
    () => computeLayout(architecture.nodes, architecture.edges),
    [architecture],
  );

  const rfNodes: ArchNodeType[] = useMemo(
    () =>
      architecture.nodes.map((n) => ({
        id: n.id,
        type: "arch" as const,
        position: positions.get(n.id) ?? { x: 0, y: 0 },
        data: { label: n.label, nodeType: n.type },
      })),
    [architecture.nodes, positions],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      architecture.edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.from,
        target: e.to,
        type: "smoothstep",
        label: e.label,
        style: edgeStyle(e.label),
        labelStyle: {
          fontFamily: "monospace",
          fontSize: 9,
          fill: "rgba(255,255,255,0.25)",
        },
        labelBgStyle: { fill: "transparent" },
      })),
    [architecture.edges],
  );

  return (
    <div className="flex h-full flex-col">
      <Toolbar nodeCount={rfNodes.length} edgeCount={rfEdges.length} />
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: "#1C1C1C", height: "100%" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255,0.06)"
          />
        </ReactFlow>
      </div>
      <Legend />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

interface ArchDiagramProps {
  architecture: Architecture | undefined;
}

export function ArchDiagram({ architecture }: ArchDiagramProps) {
  if (!architecture) {
    return (
      <div
        className="flex items-center justify-center border border-border/40"
        style={{ height: "calc(100vh - 9rem)", background: "#1C1C1C" }}
      >
        <p className="font-mono text-xs text-white/25">
          waiting for analysis…
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden border border-border/40"
      style={{ height: "calc(100vh - 9rem)" }}
    >
      <ReactFlowProvider>
        <DiagramCanvas architecture={architecture} />
      </ReactFlowProvider>
    </div>
  );
}
