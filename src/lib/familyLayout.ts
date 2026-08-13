import type { Node, Edge } from 'reactflow';
import type { PersonNodeData } from '@/components/PersonNode';

export type RawCouple = {
  id: string;
  partner1Id: string;
  partner2Id: string;
  isSeparated?: boolean;
  children: { id: string; firstName: string; lastName?: string | null }[];
};

/**
 * Clean & Non-Overlapping Family Tree Layout:
 * 1. Spouses are strictly adjacent with ZERO cards inserted between them (e.g. Sébastien and Valérie).
 * 2. Children of the same parent are strictly contiguous without external families inserted between them.
 * 3. Parents are centered directly over their children.
 * 4. Zero lines pass over or through any person cards.
 */
export function buildFamilyGraph(
  people: PersonNodeData[],
  couples: RawCouple[],
  cardLayout: 'horizontal' | 'vertical' = 'horizontal'
) {
  const CARD_W = cardLayout === 'vertical' ? 130 : 170;
  const CARD_H = cardLayout === 'vertical' ? 110 : 70;
  const UNION_S = 28;
  const SPOUSE_GAP = 25;
  const SIBLING_GAP = 35;
  const LEVEL_GAP = 160;

  if (people.length === 0) return { nodes: [], edges: [] };

  const personById = new Map<string, PersonNodeData>();
  for (const p of people) personById.set(p.id, p);

  const couplesByPerson = new Map<string, RawCouple[]>();
  for (const c of couples) {
    for (const pid of new Set([c.partner1Id, c.partner2Id])) {
      if (!couplesByPerson.has(pid)) couplesByPerson.set(pid, []);
      couplesByPerson.get(pid)!.push(c);
    }
  }

  const parentCoupleByChild = new Map<string, RawCouple>();
  for (const c of couples) {
    for (const ch of c.children) {
      parentCoupleByChild.set(ch.id, c);
    }
  }

  // 1. Calculate generational rank for all persons
  const rankMap = new Map<string, number>();
  for (const p of people) rankMap.set(p.id, 0);

  let changed = true;
  let passes = 0;
  while (changed && passes < 50) {
    changed = false;
    passes++;

    for (const c of couples) {
      const r1 = rankMap.get(c.partner1Id) ?? 0;
      const r2 = rankMap.get(c.partner2Id) ?? 0;
      const maxP = Math.max(r1, r2);

      if (r1 !== maxP) { rankMap.set(c.partner1Id, maxP); changed = true; }
      if (c.partner1Id !== c.partner2Id && r2 !== maxP) { rankMap.set(c.partner2Id, maxP); changed = true; }

      let maxC = maxP + 1;
      for (const ch of c.children) {
        const cr = rankMap.get(ch.id) ?? 0;
        if (cr > maxC) maxC = cr;
      }

      for (const ch of c.children) {
        if ((rankMap.get(ch.id) ?? 0) !== maxC) {
          rankMap.set(ch.id, maxC);
          changed = true;
        }
      }
    }
  }

  // Adjust root parents rank to be (minChildRank - 1)
  for (const c of couples) {
    if (c.children.length === 0) continue;
    const p1HasParent = Boolean(personById.get(c.partner1Id)?.parentCoupleId);
    const p2HasParent = c.partner1Id !== c.partner2Id && Boolean(personById.get(c.partner2Id)?.parentCoupleId);

    if (!p1HasParent && !p2HasParent) {
      let minC = 999;
      for (const ch of c.children) {
        const cr = rankMap.get(ch.id) ?? 0;
        if (cr < minC) minC = cr;
      }
      if (minC < 999 && minC > 0) {
        const targetR = minC - 1;
        rankMap.set(c.partner1Id, targetR);
        if (c.partner1Id !== c.partner2Id) rankMap.set(c.partner2Id, targetR);
      }
    }
  }

  // 2. Group persons by generation rank
  const rankGroups = new Map<number, string[]>();
  for (const person of people) {
    const r = rankMap.get(person.id) ?? 0;
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r)!.push(person.id);
  }

  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
  const reverseRanks = Array.from(sortedRanks).reverse();

  const personPositions = new Map<string, { x: number; y: number }>();
  const unionPositions = new Map<string, { x: number; y: number }>();

  // 3. Initial placement per rank
  for (const r of sortedRanks) {
    const pInRank = rankGroups.get(r) || [];
    const yLevel = r * LEVEL_GAP;

    const familyGroupMap = new Map<string, string[]>();
    for (const pid of pInRank) {
      const parentCouple = parentCoupleByChild.get(pid);
      const key = parentCouple ? parentCouple.id : `no_parent_${pid}`;
      if (!familyGroupMap.has(key)) familyGroupMap.set(key, []);
      familyGroupMap.get(key)!.push(pid);
    }

    let curX = 0;
    for (const [key, pids] of familyGroupMap.entries()) {
      let desiredX = curX;
      if (!key.startsWith('no_parent_') && unionPositions.has(key)) {
        desiredX = unionPositions.get(key)!.x + UNION_S / 2 - (pids.length * CARD_W + (pids.length - 1) * SIBLING_GAP) / 2;
      }

      let startX = Math.max(curX, desiredX);
      let itemX = startX;

      const processedInFamily = new Set<string>();

      for (let i = 0; i < pids.length; i++) {
        const pid = pids[i];
        if (processedInFamily.has(pid)) continue;

        // Check if pid is married to a spouse in the SAME rank
        const pCouples = (couplesByPerson.get(pid) || []).filter(
          c => rankMap.get(c.partner1Id) === r && rankMap.get(c.partner2Id) === r
        );
        const spouseCouple = pCouples.find(c => c.partner1Id !== c.partner2Id);

        if (spouseCouple) {
          const spouseId = spouseCouple.partner1Id === pid ? spouseCouple.partner2Id : spouseCouple.partner1Id;

          // Place Partner 1 and Partner 2 strictly adjacent with union node in between
          personPositions.set(pid, { x: itemX, y: yLevel });
          processedInFamily.add(pid);
          itemX += CARD_W + SPOUSE_GAP;

          unionPositions.set(spouseCouple.id, {
            x: itemX,
            y: yLevel + CARD_H / 2 - UNION_S / 2,
          });
          itemX += UNION_S + SPOUSE_GAP;

          personPositions.set(spouseId, { x: itemX, y: yLevel });
          processedInFamily.add(spouseId);
          itemX += CARD_W + SIBLING_GAP;
        } else {
          personPositions.set(pid, { x: itemX, y: yLevel });
          processedInFamily.add(pid);
          itemX += CARD_W + SIBLING_GAP;
        }
      }
      curX = itemX + SIBLING_GAP;
    }
  }

  // 4. Centering Pass: Center parent couples directly over their children, from bottom ranks up
  for (const r of reverseRanks) {
    const pInRank = rankGroups.get(r) || [];
    for (const pid of pInRank) {
      const pCouples = (couplesByPerson.get(pid) || []).filter(
        c => rankMap.get(c.partner1Id) === r && rankMap.get(c.partner2Id) === r
      );

      for (const couple of pCouples) {
        if (couple.children.length === 0) continue;

        const childPosList = couple.children
          .map(ch => personPositions.get(ch.id))
          .filter((pos): pos is { x: number; y: number } => pos !== undefined);

        if (childPosList.length === 0) continue;

        const minCX = Math.min(...childPosList.map(p => p.x));
        const maxCX = Math.max(...childPosList.map(p => p.x + CARD_W));
        const childrenCenter = (minCX + maxCX) / 2;

        const isSingleParent = couple.partner1Id === couple.partner2Id;
        const coupleW = isSingleParent ? CARD_W : CARD_W + SPOUSE_GAP + UNION_S + SPOUSE_GAP + CARD_W;
        const startX = childrenCenter - coupleW / 2;

        if (isSingleParent) {
          personPositions.set(couple.partner1Id, { x: startX, y: r * LEVEL_GAP });
          unionPositions.set(couple.id, {
            x: startX + CARD_W / 2 - UNION_S / 2,
            y: r * LEVEL_GAP + CARD_H + 15,
          });
        } else {
          const p1Pos = personPositions.get(couple.partner1Id);
          const p2Pos = personPositions.get(couple.partner2Id);
          const p1Left = !p1Pos || !p2Pos || p1Pos.x <= p2Pos.x;

          const pLeftId = p1Left ? couple.partner1Id : couple.partner2Id;
          const pRightId = p1Left ? couple.partner2Id : couple.partner1Id;

          personPositions.set(pLeftId, { x: startX, y: r * LEVEL_GAP });
          const uX = startX + CARD_W + SPOUSE_GAP;
          unionPositions.set(couple.id, {
            x: uX,
            y: r * LEVEL_GAP + CARD_H / 2 - UNION_S / 2,
          });
          personPositions.set(pRightId, { x: uX + UNION_S + SPOUSE_GAP, y: r * LEVEL_GAP });
        }
      }
    }

    // Resolve any overlaps on rank r while preserving spouse adjacency
    const rankPeople = pInRank.map(id => ({
      id,
      x: personPositions.get(id)?.x ?? 0,
    })).sort((a, b) => a.x - b.x);

    let curX = 0;
    const handledInRank = new Set<string>();

    for (const rp of rankPeople) {
      if (handledInRank.has(rp.id)) continue;
      const pPos = personPositions.get(rp.id);
      if (!pPos) continue;

      const pCouples = (couplesByPerson.get(rp.id) || []).filter(
        c => rankMap.get(c.partner1Id) === r && rankMap.get(c.partner2Id) === r
      );
      const spouseCouple = pCouples.find(c => c.partner1Id !== c.partner2Id);

      if (spouseCouple) {
        const spouseId = spouseCouple.partner1Id === rp.id ? spouseCouple.partner2Id : spouseCouple.partner1Id;
        const spousePos = personPositions.get(spouseId);

        let p1Id = rp.id;
        let p2Id = spouseId;
        if (spousePos && spousePos.x < pPos.x) {
          p1Id = spouseId;
          p2Id = rp.id;
        }

        const p1P = personPositions.get(p1Id)!;
        const p2P = personPositions.get(p2Id)!;

        if (p1P.x < curX) {
          p1P.x = curX;
        }
        const uX = p1P.x + CARD_W + SPOUSE_GAP;
        unionPositions.set(spouseCouple.id, {
          x: uX,
          y: r * LEVEL_GAP + CARD_H / 2 - UNION_S / 2,
        });
        p2P.x = uX + UNION_S + SPOUSE_GAP;

        curX = p2P.x + CARD_W + SIBLING_GAP;
        handledInRank.add(p1Id);
        handledInRank.add(p2Id);
      } else {
        if (pPos.x < curX) {
          pPos.x = curX;
        }
        curX = pPos.x + CARD_W + SIBLING_GAP;
        handledInRank.add(rp.id);
      }
    }
  }

  // 5. Final Union Node Centering Pass
  for (const couple of couples) {
    const isSingleParent = couple.partner1Id === couple.partner2Id;
    const p1Pos = personPositions.get(couple.partner1Id);
    const p2Pos = personPositions.get(couple.partner2Id);

    if (isSingleParent && p1Pos) {
      unionPositions.set(couple.id, {
        x: p1Pos.x + CARD_W / 2 - UNION_S / 2,
        y: p1Pos.y + CARD_H + 15,
      });
    } else if (p1Pos && p2Pos) {
      const leftX = Math.min(p1Pos.x, p2Pos.x);
      const rightX = Math.max(p1Pos.x, p2Pos.x);
      const midX = (leftX + CARD_W + rightX) / 2 - UNION_S / 2;
      unionPositions.set(couple.id, {
        x: midX,
        y: p1Pos.y + CARD_H / 2 - UNION_S / 2,
      });
    }
  }

  // 6. Build React Flow Nodes and Edges
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const p of people) {
    const pos = personPositions.get(p.id) || { x: 0, y: 0 };
    nodes.push({
      id: p.id,
      type: 'person',
      position: pos,
      data: { ...p, cardLayout },
    });
  }

  for (const c of couples) {
    const uPos = unionPositions.get(c.id) || { x: 0, y: 0 };
    const unionNodeId = `union-${c.id}`;
    const isSep = Boolean(c.isSeparated);
    const isSingleParent = c.partner1Id === c.partner2Id;

    nodes.push({
      id: unionNodeId,
      type: 'union',
      position: uPos,
      data: {
        coupleId: c.id,
        partner1Id: c.partner1Id,
        partner2Id: c.partner2Id,
        isSeparated: isSep,
        isSingleParent,
        children: c.children,
      },
    });

    const spouseEdgeStyle = isSep
      ? { stroke: '#8c387b', strokeWidth: 2, strokeDasharray: '6 4' }
      : { stroke: '#5c2456', strokeWidth: 2.5 };

    const childEdgeStyle = { stroke: '#7bb686', strokeWidth: 2.5 };

    if (isSingleParent) {
      edges.push({
        id: `edge-${c.partner1Id}-${unionNodeId}`,
        source: c.partner1Id,
        target: unionNodeId,
        sourceHandle: 'bottom-source',
        targetHandle: 'union-top',
        type: 'straight',
        style: spouseEdgeStyle,
      });
    } else {
      const p1Pos = personPositions.get(c.partner1Id);
      const p2Pos = personPositions.get(c.partner2Id);

      let p1SourceHandle = 'right-source';
      let p2SourceHandle = 'left-source';
      let u1TargetHandle = 'union-left';
      let u2TargetHandle = 'union-right';

      if (p1Pos && p2Pos && p1Pos.x > p2Pos.x) {
        p1SourceHandle = 'left-source';
        u1TargetHandle = 'union-right';
        p2SourceHandle = 'right-source';
        u2TargetHandle = 'union-left';
      }

      edges.push({
        id: `edge-${c.partner1Id}-${unionNodeId}`,
        source: c.partner1Id,
        target: unionNodeId,
        sourceHandle: p1SourceHandle,
        targetHandle: u1TargetHandle,
        type: 'straight',
        style: spouseEdgeStyle,
      });

      edges.push({
        id: `edge-${c.partner2Id}-${unionNodeId}`,
        source: c.partner2Id,
        target: unionNodeId,
        sourceHandle: p2SourceHandle,
        targetHandle: u2TargetHandle,
        type: 'straight',
        style: spouseEdgeStyle,
      });
    }

    for (const child of c.children) {
      edges.push({
        id: `edge-${unionNodeId}-${child.id}`,
        source: unionNodeId,
        target: child.id,
        sourceHandle: 'union-bottom',
        targetHandle: 'top-target',
        type: 'step',
        style: childEdgeStyle,
      });
    }
  }

  return { nodes, edges };
}
