import "@xyflow/react/dist/style.css";
import { useMemo, useState, useCallback } from "react";
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
import { Maximize2, Minus, Plus, X, ArrowRight, ArrowLeft } from "lucide-react";
import type { Architecture } from "@/components/ResultsPage";

// ---------------------------------------------------------------------------
// Type → colour mapping
// ---------------------------------------------------------------------------

type TypeStyle = { border: string; accent: string; bg: string };

const TYPE_STYLES: Record<string, TypeStyle> = {
  frontend:   { border: "#60A5FA", accent: "#60A5FA", bg: "rgba(96,165,250,0.07)"  },
  backend:    { border: "#34D399", accent: "#34D399", bg: "rgba(52,211,153,0.07)"  },
  service:    { border: "#34D399", accent: "#34D399", bg: "rgba(52,211,153,0.07)"  },
  api:        { border: "#22D3EE", accent: "#22D3EE", bg: "rgba(34,211,238,0.07)"  },
  database:   { border: "#FBBF24", accent: "#FBBF24", bg: "rgba(251,191,36,0.07)"  },
  external:   { border: "#A78BFA", accent: "#A78BFA", bg: "rgba(167,139,250,0.07)" },
  middleware: { border: "#FB923C", accent: "#FB923C", bg: "rgba(251,146,60,0.07)"  },
  config:     { border: "#6B7280", accent: "#9CA3AF", bg: "rgba(107,114,128,0.07)" },
  module:     { border: "#94A3B8", accent: "#94A3B8", bg: "rgba(148,163,184,0.07)" },
  util:       { border: "#64748B", accent: "#94A3B8", bg: "rgba(100,116,139,0.07)" },
};

const DEFAULT_STYLE: TypeStyle = {
  border: "rgba(255,255,255,0.15)",
  accent: "rgba(255,255,255,0.4)",
  bg: "rgba(255,255,255,0.03)",
};

function typeStyle(type: string, selected: boolean): TypeStyle {
  const base = TYPE_STYLES[type.toLowerCase()] ?? DEFAULT_STYLE;
  if (!selected) return base;
  return {
    border: base.accent,
    accent: base.accent,
    bg: base.bg.replace(/[\d.]+\)$/, "0.15)"),
  };
}

// ---------------------------------------------------------------------------
// Layout — topological layers, left → right
// ---------------------------------------------------------------------------

const NODE_W = 190;
const NODE_H = 72;
const LAYER_GAP = 180;
const NODE_GAP = 48;

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
// Edge style
// ---------------------------------------------------------------------------

const DATA_VERBS = new Set(["reads", "writes", "queries", "stores", "sends", "receives", "streams"]);

function edgeStyle(label?: string): React.CSSProperties {
  const v = label?.toLowerCase().trim();
  return v && DATA_VERBS.has(v)
    ? { stroke: "rgba(255,255,255,0.20)", strokeDasharray: "5,4", strokeWidth: 1.5 }
    : { stroke: "rgba(255,255,255,0.14)", strokeWidth: 1.5 };
}

// ---------------------------------------------------------------------------
// Custom node
// ---------------------------------------------------------------------------

type ArchNodeData = {
  label: string;
  nodeType: string;
  description: string;
  selected: boolean;
};
type ArchNodeType = Node<ArchNodeData, "arch">;

function ArchNode({ data }: NodeProps<ArchNodeType>) {
  const s = typeStyle(data.nodeType, data.selected);
  return (
    <div
      className="flex flex-col justify-center gap-1 px-3 py-2.5 transition-all duration-150"
      style={{
        width: NODE_W,
        height: NODE_H,
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: data.selected ? `0 0 0 1px ${s.border}40, 0 0 12px ${s.border}20` : "none",
        cursor: "pointer",
      }}
    >
      <span
        className="font-mono text-[9px] uppercase tracking-[0.14em]"
        style={{ color: s.accent }}
      >
        {data.nodeType}
      </span>
      <span className="truncate font-mono text-[11px] font-medium leading-tight text-white/85">
        {data.label}
      </span>
      {data.description && (
        <span className="line-clamp-1 font-mono text-[9px] leading-tight text-white/30">
          {data.description}
        </span>
      )}
    </div>
  );
}

const nodeTypes = { arch: ArchNode };

// ---------------------------------------------------------------------------
// Detail panel — shown when a node is selected
// ---------------------------------------------------------------------------

interface NodeDetailProps {
  node: Architecture["nodes"][number];
  edges: Architecture["edges"];
  allNodes: Architecture["nodes"];
  onClose: () => void;
}

function NodeDetail({ node, edges, allNodes, onClose }: NodeDetailProps) {
  const s = typeStyle(node.type, false);
  const nodeById = useMemo(
    () => new Map(allNodes.map((n) => [n.id, n])),
    [allNodes],
  );

  const outgoing = edges
    .filter((e) => e.from === node.id)
    .map((e) => ({ edge: e, target: nodeById.get(e.to) }))
    .filter((x) => x.target);

  const incoming = edges
    .filter((e) => e.to === node.id)
    .map((e) => ({ edge: e, source: nodeById.get(e.from) }))
    .filter((x) => x.source);

  return (
    <div className="flex w-64 flex-shrink-0 flex-col border-l border-white/8 bg-[#161616]">
      {/* Header */}
      <div className="flex items-start gap-2 border-b border-white/8 p-4">
        <div className="min-w-0 flex-1">
          <span
            className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em]"
            style={{ color: s.accent }}
          >
            {node.type}
          </span>
          <span className="block font-mono text-sm font-semibold text-white/90">
            {node.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-white/30 hover:text-white/70"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Description */}
      <div className="border-b border-white/8 p-4">
        <p className="font-mono text-[11px] leading-relaxed text-white/55">
          {node.description || "No description available."}
        </p>
      </div>

      {/* Connections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {outgoing.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/25">
              Calls / Depends on
            </p>
            <div className="space-y-1.5">
              {outgoing.map(({ edge, target }) => (
                <div key={edge.to} className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 flex-shrink-0 text-white/20" />
                  <div className="min-w-0">
                    <span className="block truncate font-mono text-[11px] text-white/70">
                      {target!.label}
                    </span>
                    {edge.label && (
                      <span className="font-mono text-[9px] text-white/30">{edge.label}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {incoming.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/25">
              Used by
            </p>
            <div className="space-y-1.5">
              {incoming.map(({ edge, source }) => (
                <div key={edge.from} className="flex items-center gap-2">
                  <ArrowLeft className="h-3 w-3 flex-shrink-0 text-white/20" />
                  <div className="min-w-0">
                    <span className="block truncate font-mono text-[11px] text-white/70">
                      {source!.label}
                    </span>
                    {edge.label && (
                      <span className="font-mono text-[9px] text-white/30">{edge.label}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {outgoing.length === 0 && incoming.length === 0 && (
          <p className="font-mono text-[10px] text-white/20">No connections.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function Toolbar({ nodeCount, edgeCount }: { nodeCount: number; edgeCount: number }) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  return (
    <div className="flex items-center gap-3 border-b border-white/8 bg-[#1C1C1C]/90 px-4 py-2 backdrop-blur-sm">
      <span className="font-mono text-[11px] tracking-[0.12em] text-white/35">ARCHITECTURE</span>
      <span className="font-mono text-[10px] text-white/20">
        {nodeCount} nodes · {edgeCount} edges
      </span>
      <div className="ml-auto flex items-center gap-1">
        {([
          { icon: Maximize2, action: () => fitView({ padding: 0.15, duration: 300 }), label: "Fit view" },
          { icon: Minus,     action: () => zoomOut({ duration: 200 }),                label: "Zoom out" },
          { icon: Plus,      action: () => zoomIn({ duration: 200 }),                 label: "Zoom in"  },
        ] as const).map(({ icon: Icon, action, label }) => (
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

const LEGEND_TYPES = [
  { type: "frontend", label: "Frontend" },
  { type: "backend",  label: "Backend"  },
  { type: "api",      label: "API"      },
  { type: "database", label: "Database" },
  { type: "external", label: "External" },
] as const;

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/8 bg-[#1C1C1C]/90 px-4 py-1.5 backdrop-blur-sm">
      {LEGEND_TYPES.map(({ type, label }) => {
        const s = TYPE_STYLES[type];
        return (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 border"
              style={{ borderColor: s.border, background: s.bg }}
            />
            <span className="font-mono text-[9px] text-white/30">{label}</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5">
        <svg width="16" height="2" className="overflow-visible">
          <line x1="0" y1="1" x2="16" y2="1" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4,3" />
        </svg>
        <span className="font-mono text-[9px] text-white/30">Data flow</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner canvas
// ---------------------------------------------------------------------------

function DiagramCanvas({ architecture }: { architecture: Architecture }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => architecture.nodes.find((n) => n.id === selectedId) ?? null,
    [architecture.nodes, selectedId],
  );

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
        data: {
          label: n.label,
          nodeType: n.type,
          description: n.description ?? "",
          selected: n.id === selectedId,
        },
      })),
    [architecture.nodes, positions, selectedId],
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
        labelStyle: { fontFamily: "monospace", fontSize: 9, fill: "rgba(255,255,255,0.22)" },
        labelBgStyle: { fill: "transparent" },
      })),
    [architecture.edges],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedId((prev) => (prev === node.id ? null : node.id));
    },
    [],
  );

  const handlePaneClick = useCallback(() => setSelectedId(null), []);

  return (
    <div className="flex h-full flex-col">
      <Toolbar nodeCount={rfNodes.length} edgeCount={rfEdges.length} />
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div className="flex-1">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
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
              color="rgba(255,255,255,0.05)"
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeDetail
            node={selectedNode}
            edges={architecture.edges}
            allNodes={architecture.nodes}
            onClose={() => setSelectedId(null)}
          />
        )}
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
        <p className="font-mono text-xs text-white/25">waiting for analysis…</p>
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
