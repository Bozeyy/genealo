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
 * Builds a clean, intuitive family tree layout where:
 * 1. Spouses are ALWAYS placed side-by-side as an unbreakable couple unit with their union node centered between them.
 * 2. Parent couples without grandparents are pulled down to sit EXACTLY ONE ROW ABOVE their children.
 * 3. Parent couples are centered directly above their children.
 * 4. Siblings with the same parents stay grouped together side-by-side.
 * 5. Straight horizontal edges connect spouses to union nodes; step edges connect union nodes to children.
 */
export function buildFamilyGraph(
  people: PersonNodeData[],
  couples: RawCouple[],
  cardLayout: 'horizontal' | 'vertical' = 'horizontal'
) {
  const cardWidth = cardLayout === 'vertical' ? 140 : 180;
  const cardHeight = cardLayout === 'vertical' ? 115 : 75;
  const unionSize = 28;
  const rankSep = cardLayout === 'vertical' ? 260 : 220;
  const nodeGap = 70;
  const spouseGap = 50;
  const coupleUnitSpan = cardWidth + spouseGap + unionSize + spouseGap + cardWidth;

  if (people.length === 0) return { nodes: [], edges: [] };

  const personById = new Map<string, PersonNodeData>();
  for (const p of people) {
    personById.set(p.id, p);
  }

  // 1. Calculate Generational Rank for every person
  const rankMap = new Map<string, number>();
  for (const person of people) {
    rankMap.set(person.id, 0);
  }

  // Pass A: Push ranks DOWN from parents to children and equalize siblings/spouses
  let changed = true;
  let passes = 0;
  while (changed && passes < 50) {
    changed = false;
    passes++;

    for (const couple of couples) {
      const p1Rank = rankMap.get(couple.partner1Id) ?? 0;
      const p2Rank = rankMap.get(couple.partner2Id) ?? 0;
      const maxParentRank = Math.max(p1Rank, p2Rank);

      if (p1Rank !== maxParentRank) {
        rankMap.set(couple.partner1Id, maxParentRank);
        changed = true;
      }
      if (couple.partner1Id !== couple.partner2Id && p2Rank !== maxParentRank) {
        rankMap.set(couple.partner2Id, maxParentRank);
        changed = true;
      }

      let maxChildRank = maxParentRank + 1;
      for (const child of couple.children) {
        const cRank = rankMap.get(child.id) ?? 0;
        if (cRank > maxChildRank) {
          maxChildRank = cRank;
        }
      }

      for (const child of couple.children) {
        if ((rankMap.get(child.id) ?? 0) !== maxChildRank) {
          rankMap.set(child.id, maxChildRank);
          changed = true;
        }
      }
    }
  }

  // Pass B: Pull root parents DOWN so they sit EXACTLY 1 rank above their children
  changed = true;
  passes = 0;
  while (changed && passes < 50) {
    changed = false;
    passes++;

    for (const couple of couples) {
      if (couple.children.length === 0) continue;

      const p1HasParent = Boolean(personById.get(couple.partner1Id)?.parentCoupleId);
      const p2HasParent =
        couple.partner1Id !== couple.partner2Id &&
        Boolean(personById.get(couple.partner2Id)?.parentCoupleId);

      if (!p1HasParent && !p2HasParent) {
        let minChildRank = 999;
        for (const child of couple.children) {
          const cRank = rankMap.get(child.id) ?? 0;
          if (cRank < minChildRank) minChildRank = cRank;
        }

        if (minChildRank < 999 && minChildRank > 0) {
          const targetParentRank = minChildRank - 1;

          if ((rankMap.get(couple.partner1Id) ?? 0) !== targetParentRank) {
            rankMap.set(couple.partner1Id, targetParentRank);
            changed = true;
          }
          if (
            couple.partner1Id !== couple.partner2Id &&
            (rankMap.get(couple.partner2Id) ?? 0) !== targetParentRank
          ) {
            rankMap.set(couple.partner2Id, targetParentRank);
            changed = true;
          }
        }
      }
    }
  }

  // 2. Map persons to couples and parent couples
  const couplesByPerson = new Map<string, RawCouple[]>();
  for (const c of couples) {
    if (!couplesByPerson.has(c.partner1Id)) couplesByPerson.set(c.partner1Id, []);
    couplesByPerson.get(c.partner1Id)!.push(c);
    if (c.partner1Id !== c.partner2Id) {
      if (!couplesByPerson.has(c.partner2Id)) couplesByPerson.set(c.partner2Id, []);
      couplesByPerson.get(c.partner2Id)!.push(c);
    }
  }

  const parentCoupleByChild = new Map<string, RawCouple>();
  for (const c of couples) {
    for (const ch of c.children) {
      parentCoupleByChild.set(ch.id, c);
    }
  }

  // 3. Group persons by generation rank
  const rankGroups = new Map<number, string[]>();
  for (const person of people) {
    const r = rankMap.get(person.id) ?? 0;
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r)!.push(person.id);
  }

  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);

  const personPositions = new Map<string, { x: number; y: number }>();
  const unionPositions = new Map<string, { x: number; y: number }>();

  // 4. Position generation by generation
  for (const r of sortedRanks) {
    const personIds = rankGroups.get(r) || [];
    const yLevel = r * rankSep;

    // Group persons in rank r by Parent Couple ID
    const familyGroupMap = new Map<string, string[]>();
    for (const pid of personIds) {
      const parentCouple = parentCoupleByChild.get(pid);
      const key = parentCouple ? parentCouple.id : `no_parent_${pid}`;
      if (!familyGroupMap.has(key)) familyGroupMap.set(key, []);
      familyGroupMap.get(key)!.push(pid);
    }

    type FamilyGroup = {
      key: string;
      desiredX: number;
      people: string[];
    };

    const familyGroups: FamilyGroup[] = [];

    for (const [key, groupPids] of familyGroupMap.entries()) {
      let desiredX = 0;
      if (!key.startsWith('no_parent_') && unionPositions.has(key)) {
        desiredX = unionPositions.get(key)!.x + unionSize / 2;
      }
      familyGroups.push({ key, desiredX, people: groupPids });
    }

    familyGroups.sort((a, b) => a.desiredX - b.desiredX);

    // Sort siblings inside each family group to face their spouse's family
    for (let fgIdx = 0; fgIdx < familyGroups.length; fgIdx++) {
      const fg = familyGroups[fgIdx];
      if (fg.people.length > 1) {
        fg.people.sort((p1, p2) => {
          const getSpouseGroupIdx = (pid: string) => {
            const cList = couplesByPerson.get(pid) || [];
            for (const c of cList) {
              const spouseId = c.partner1Id === pid ? c.partner2Id : c.partner1Id;
              if (spouseId !== pid) {
                const sFgIdx = familyGroups.findIndex(g => g.people.includes(spouseId));
                if (sFgIdx !== -1 && sFgIdx !== fgIdx) return sFgIdx;
              }
            }
            return fgIdx;
          };

          const s1Idx = getSpouseGroupIdx(p1);
          const s2Idx = getSpouseGroupIdx(p2);
          return s1Idx - s2Idx;
        });
      }
    }

    let currentX = 0;
    const processedInRank = new Set<string>();

    for (let fgIdx = 0; fgIdx < familyGroups.length; fgIdx++) {
      const fg = familyGroups[fgIdx];

      let fgWidth = 0;
      for (const pid of fg.people) {
        if (processedInRank.has(pid)) continue;
        const pCouples = (couplesByPerson.get(pid) || []).filter(
          c => rankMap.get(c.partner1Id) === r && rankMap.get(c.partner2Id) === r
        );
        const spouseCouple = pCouples.find(c => c.partner1Id !== c.partner2Id);

        if (spouseCouple) {
          fgWidth += coupleUnitSpan;
        } else {
          fgWidth += cardWidth;
        }
      }
      if (fg.people.length > 1) {
        fgWidth += (fg.people.length - 1) * nodeGap;
      }

      let groupStartX = fg.desiredX > 0 ? fg.desiredX - fgWidth / 2 : currentX;
      let startX = Math.max(currentX, groupStartX);

      let itemX = startX;

      for (let pIdx = 0; pIdx < fg.people.length; pIdx++) {
        const pid = fg.people[pIdx];
        if (processedInRank.has(pid)) continue;

        const pCouples = (couplesByPerson.get(pid) || []).filter(
          c => rankMap.get(c.partner1Id) === r && rankMap.get(c.partner2Id) === r
        );
        const spouseCouple = pCouples.find(c => c.partner1Id !== c.partner2Id);
        const singleParentCouple = pCouples.find(c => c.partner1Id === c.partner2Id);

        if (spouseCouple) {
          const spouseId = spouseCouple.partner1Id === pid ? spouseCouple.partner2Id : spouseCouple.partner1Id;

          // Always place Partner 1, Union, and Partner 2 side-by-side as an unbreakable block
          personPositions.set(pid, { x: itemX, y: yLevel });
          processedInRank.add(pid);
          itemX += cardWidth + spouseGap;

          unionPositions.set(spouseCouple.id, {
            x: itemX,
            y: yLevel + cardHeight / 2 - unionSize / 2,
          });
          itemX += unionSize + spouseGap;

          personPositions.set(spouseId, { x: itemX, y: yLevel });
          processedInRank.add(spouseId);
          itemX += cardWidth;
        } else {
          personPositions.set(pid, { x: itemX, y: yLevel });
          processedInRank.add(pid);

          if (singleParentCouple) {
            unionPositions.set(singleParentCouple.id, {
              x: itemX + cardWidth / 2 - unionSize / 2,
              y: yLevel + cardHeight + 20,
            });
          }
          itemX += cardWidth;
        }

        if (pIdx < fg.people.length - 1) {
          itemX += nodeGap;
        }
      }

      currentX = itemX + nodeGap;
    }
  }

  // 5. Bottom-Up Parent Centering Pass: Center parent couples directly above their children
  const reverseRanks = Array.from(sortedRanks).reverse();
  const processedCouplesInAlign = new Set<string>();

  for (const r of reverseRanks) {
    const pInRank = rankGroups.get(r) || [];
    for (const pid of pInRank) {
      const pCouples = (couplesByPerson.get(pid) || []).filter(
        c => rankMap.get(c.partner1Id) === r && rankMap.get(c.partner2Id) === r
      );

      for (const couple of pCouples) {
        if (processedCouplesInAlign.has(couple.id)) continue;
        processedCouplesInAlign.add(couple.id);

        if (couple.children.length === 0) continue;
        const uPos = unionPositions.get(couple.id);
        if (!uPos) continue;

        const childPosList = couple.children
          .map(ch => personPositions.get(ch.id))
          .filter((pos): pos is { x: number; y: number } => pos !== undefined);

        if (childPosList.length === 0) continue;

        const minCX = Math.min(...childPosList.map(p => p.x));
        const maxCX = Math.max(...childPosList.map(p => p.x + cardWidth));
        const childrenCenter = (minCX + maxCX) / 2;
        const unionCenter = uPos.x + unionSize / 2;
        const shiftX = childrenCenter - unionCenter;

        if (Math.abs(shiftX) > 5) {
          const p1Pos = personPositions.get(couple.partner1Id);
          if (p1Pos) p1Pos.x += shiftX;

          if (couple.partner1Id !== couple.partner2Id) {
            const p2Pos = personPositions.get(couple.partner2Id);
            if (p2Pos) p2Pos.x += shiftX;
          }

          uPos.x += shiftX;
        }
      }
    }

    // Resolve any horizontal overlaps in rank r while preserving couple blocks
    const rankPeople = pInRank.map(id => ({
      id,
      x: personPositions.get(id)?.x ?? 0,
    })).sort((a, b) => a.x - b.x);

    let curX = 0;
    const handledInOverlap = new Set<string>();

    for (const rp of rankPeople) {
      if (handledInOverlap.has(rp.id)) continue;
      const pPos = personPositions.get(rp.id);
      if (!pPos) continue;

      const pCouples = (couplesByPerson.get(rp.id) || []).filter(
        c => rankMap.get(c.partner1Id) === r && rankMap.get(c.partner2Id) === r
      );
      const spouseCouple = pCouples.find(c => c.partner1Id !== c.partner2Id);

      if (spouseCouple) {
        const spouseId = spouseCouple.partner1Id === rp.id ? spouseCouple.partner2Id : spouseCouple.partner1Id;
        const spousePos = personPositions.get(spouseId);

        if (pPos.x < curX) {
          pPos.x = curX;
        }

        if (spousePos) {
          spousePos.x = pPos.x + cardWidth + 2 * spouseGap + unionSize;
          handledInOverlap.add(spouseId);
          curX = spousePos.x + cardWidth + nodeGap;
        } else {
          curX = pPos.x + cardWidth + nodeGap;
        }
        handledInOverlap.add(rp.id);
      } else {
        if (pPos.x < curX) {
          pPos.x = curX;
        }
        curX = pPos.x + cardWidth + nodeGap;
        handledInOverlap.add(rp.id);
      }
    }
  }

  // 6. Recalculate and Guarantee Union Node Centering for All Couples
  for (const couple of couples) {
    const isSingleParent = couple.partner1Id === couple.partner2Id;
    const p1Pos = personPositions.get(couple.partner1Id);
    const p2Pos = personPositions.get(couple.partner2Id);

    if (isSingleParent && p1Pos) {
      unionPositions.set(couple.id, {
        x: p1Pos.x + cardWidth / 2 - unionSize / 2,
        y: p1Pos.y + cardHeight + 20,
      });
    } else if (p1Pos && p2Pos) {
      const leftP = p1Pos.x < p2Pos.x ? p1Pos : p2Pos;
      const rightP = p1Pos.x < p2Pos.x ? p2Pos : p1Pos;

      const centeredX = (leftP.x + cardWidth + rightP.x) / 2 - unionSize / 2;
      unionPositions.set(couple.id, {
        x: centeredX,
        y: leftP.y + cardHeight / 2 - unionSize / 2,
      });
    }
  }

  // 7. Build React Flow Nodes and Edges
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

  for (const couple of couples) {
    const uPos = unionPositions.get(couple.id) || { x: 0, y: 0 };
    const unionNodeId = `union-${couple.id}`;
    const isSep = Boolean(couple.isSeparated);
    const isSingleParent = couple.partner1Id === couple.partner2Id;

    nodes.push({
      id: unionNodeId,
      type: 'union',
      position: uPos,
      data: {
        coupleId: couple.id,
        partner1Id: couple.partner1Id,
        partner2Id: couple.partner2Id,
        isSeparated: isSep,
        isSingleParent,
        children: couple.children,
      },
    });

    const spouseEdgeStyle = isSep
      ? { stroke: '#8c387b', strokeWidth: 2, strokeDasharray: '6 4' }
      : { stroke: '#5c2456', strokeWidth: 2.5 };

    const childEdgeStyle = { stroke: '#7bb686', strokeWidth: 2.5 };

    if (isSingleParent) {
      edges.push({
        id: `edge-${couple.partner1Id}-${unionNodeId}`,
        source: couple.partner1Id,
        target: unionNodeId,
        sourceHandle: 'bottom-source',
        targetHandle: 'union-top',
        type: 'straight',
        style: spouseEdgeStyle,
      });
    } else {
      const p1Pos = personPositions.get(couple.partner1Id);
      const p2Pos = personPositions.get(couple.partner2Id);

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
        id: `edge-${couple.partner1Id}-${unionNodeId}`,
        source: couple.partner1Id,
        target: unionNodeId,
        sourceHandle: p1SourceHandle,
        targetHandle: u1TargetHandle,
        type: 'straight',
        style: spouseEdgeStyle,
      });

      edges.push({
        id: `edge-${couple.partner2Id}-${unionNodeId}`,
        source: couple.partner2Id,
        target: unionNodeId,
        sourceHandle: p2SourceHandle,
        targetHandle: u2TargetHandle,
        type: 'straight',
        style: spouseEdgeStyle,
      });
    }

    for (const child of couple.children) {
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
