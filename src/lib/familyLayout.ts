import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { PersonNodeData } from '@/components/PersonNode';

export type RawCouple = {
  id: string;
  partner1Id: string;
  partner2Id: string;
  isSeparated?: boolean;
  children: { id: string; firstName: string; lastName?: string | null }[];
};

export function buildFamilyGraph(people: PersonNodeData[], couples: RawCouple[], cardLayout: 'horizontal' | 'vertical' = 'horizontal') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: cardLayout === 'vertical' ? 50 : 70, ranksep: cardLayout === 'vertical' ? 90 : 100 });

  const nodesMap = new Map<string, Node>();
  const edgesMap = new Map<string, Edge>();

  // 1. Add Person Nodes
  for (const person of people) {
    const node: Node = {
      id: person.id,
      type: 'person',
      position: { x: 0, y: 0 },
      data: { ...person, cardLayout },
    };
    nodesMap.set(person.id, node);
    const nodeWidth = cardLayout === 'vertical' ? 140 : 200;
    const nodeHeight = cardLayout === 'vertical' ? 115 : 75;
    dagreGraph.setNode(person.id, { width: nodeWidth, height: nodeHeight });
  }

  // 2. Add Couple Union Nodes & Edges
  for (const couple of couples) {
    const unionNodeId = `union-${couple.id}`;
    const isSep = Boolean(couple.isSeparated);
    const isSingleParent = couple.partner1Id === couple.partner2Id;

    const unionNode: Node = {
      id: unionNodeId,
      type: 'union',
      position: { x: 0, y: 0 },
      data: {
        coupleId: couple.id,
        partner1Id: couple.partner1Id,
        partner2Id: couple.partner2Id,
        isSeparated: isSep,
        isSingleParent,
        children: couple.children,
      },
    };
    nodesMap.set(unionNodeId, unionNode);
    dagreGraph.setNode(unionNodeId, { width: 30, height: 30 });

    const spouseEdgeStyle = isSep
      ? { stroke: '#c49a3c', strokeWidth: 2, strokeDasharray: '6 4' }
      : { stroke: '#c0785a', strokeWidth: 2.5 };

    // Edge Partner 1 -> Union
    if (nodesMap.has(couple.partner1Id)) {
      const e1Id = `edge-${couple.partner1Id}-${unionNodeId}`;
      edgesMap.set(e1Id, {
        id: e1Id,
        source: couple.partner1Id,
        target: unionNodeId,
        type: 'smoothstep',
        style: isSingleParent ? { stroke: '#7a9b6d', strokeWidth: 2.5 } : spouseEdgeStyle,
      });
      dagreGraph.setEdge(couple.partner1Id, unionNodeId);
    }

    // Edge Partner 2 -> Union (only if distinct partner)
    if (!isSingleParent && nodesMap.has(couple.partner2Id)) {
      const e2Id = `edge-${couple.partner2Id}-${unionNodeId}`;
      edgesMap.set(e2Id, {
        id: e2Id,
        source: couple.partner2Id,
        target: unionNodeId,
        type: 'smoothstep',
        style: spouseEdgeStyle,
      });
      dagreGraph.setEdge(couple.partner2Id, unionNodeId);
    }

    // Edges Union -> Children (Vibrant cyan-blue)
    for (const child of couple.children) {
      if (nodesMap.has(child.id)) {
        const eChildId = `edge-${unionNodeId}-${child.id}`;
        edgesMap.set(eChildId, {
          id: eChildId,
          source: unionNodeId,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: '#7a9b6d', strokeWidth: 2.5 },
        });
        dagreGraph.setEdge(unionNodeId, child.id);
      }
    }
  }

  // 3. Run Dagre Layout
  dagre.layout(dagreGraph);

  // Apply layout coordinates
  const nodes = Array.from(nodesMap.values()).map(node => {
    const nodeWithPos = dagreGraph.node(node.id);
    if (nodeWithPos) {
      node.position = {
        x: nodeWithPos.x - (nodeWithPos.width || 100) / 2,
        y: nodeWithPos.y - (nodeWithPos.height || 40) / 2,
      };
    }
    return node;
  });

  const edges = Array.from(edgesMap.values());

  return { nodes, edges };
}
