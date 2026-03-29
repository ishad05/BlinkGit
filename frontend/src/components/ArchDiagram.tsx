// TODO: implement React Flow architecture diagram from agent node/edge data

interface DiagramNode {
  id: string;
  label: string;
  type: string;
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

interface Architecture {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface ArchDiagramProps {
  architecture: Architecture | undefined;
}

export function ArchDiagram({ architecture: _architecture }: ArchDiagramProps) {
  return (
    <div className="p-4 border rounded-lg h-64 flex items-center justify-center">
      <p className="text-gray-400 text-sm">ArchDiagram — TODO</p>
    </div>
  );
}
