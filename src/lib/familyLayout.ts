import type { Node, Edge } from 'reactflow';
import type { PersonNodeData } from '@/components/PersonNode';

export type RawCouple = {
  id: string;
  partner1Id: string;
  partner2Id: string;
  isSeparated?: boolean;
  children: { id: string; firstName: string; lastName?: string | null }[];
};

// ============================================================
//  CLEAN FAMILY GRAPH LAYOUT
//  Strictly places:
//  - Couples side-by-side with union node between them
//  - Children directly below their parent couple's union node
// ============================================================

export function buildFamilyGraph(
  people: PersonNodeData[],
  couples: RawCouple[],
  options?: { forceAutoLayout?: boolean }
) {
  const CARD_W = 130;
  const CARD_H = 110;
  const UNION_S = 28;
  const SPOUSE_GAP = 50;

  if (people.length === 0) return { nodes: [], edges: [] };

  const hasSavedPositions = people.some(p => p.positionX !== null && p.positionX !== undefined && p.positionY !== null && p.positionY !== undefined);
  const useSavedPositions = hasSavedPositions && !options?.forceAutoLayout;

  const coupleById = new Map<string, RawCouple>(couples.map(c => [c.id, c]));
  const couplesByPid = new Map<string, string[]>();
  for (const c of couples) {
    for (const pid of [c.partner1Id, c.partner2Id]) {
      if (!couplesByPid.has(pid)) couplesByPid.set(pid, []);
      couplesByPid.get(pid)!.push(c.id);
    }
  }

  const posP = new Map<string, { x: number; y: number }>();
  const posU = new Map<string, { x: number; y: number }>();

  if (useSavedPositions) {
    // 1. Charger les positions enregistrées pour les personnes
    for (const p of people) {
      if (p.positionX !== null && p.positionX !== undefined && p.positionY !== null && p.positionY !== undefined) {
        posP.set(p.id, { x: p.positionX, y: p.positionY });
      } else {
        posP.set(p.id, { x: 0, y: 0 });
      }
    }

    // 1b. FORCER L'ALIGNEMENT VERTICAL (même ligne Y) DES CONJOINTS MÊME AVEC POSITIONS SAUVEGARDÉES
    // Si un utilisateur déplace une personne et rafraîchit, le conjoint doit obligatoirement s'aligner.
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of couples) {
        if (c.partner1Id !== c.partner2Id) {
          const p1Pos = posP.get(c.partner1Id);
          const p2Pos = posP.get(c.partner2Id);
          if (p1Pos && p2Pos && p1Pos.y !== p2Pos.y) {
            const avgY = (p1Pos.y + p2Pos.y) / 2;
            p1Pos.y = avgY;
            p2Pos.y = avgY;
            changed = true;
          }
        }
      }
    }

    // 2. Calculer la position des unions au milieu des conjoints ou du parent solo
    for (const c of couples) {
      const isSingle = c.partner1Id === c.partner2Id;
      if (isSingle) {
        const p1Pos = posP.get(c.partner1Id) ?? { x: 0, y: 0 };
        posU.set(c.id, {
          x: p1Pos.x + CARD_W / 2 - UNION_S / 2,
          y: p1Pos.y + CARD_H + 15,
        });
      } else {
        const p1Pos = posP.get(c.partner1Id) ?? { x: 0, y: 0 };
        const p2Pos = posP.get(c.partner2Id) ?? { x: 0, y: 0 };
        posU.set(c.id, {
          x: (p1Pos.x + p2Pos.x + CARD_W) / 2 - UNION_S / 2,
          y: (p1Pos.y + p2Pos.y + CARD_H) / 2 - UNION_S / 2,
        });
      }
    }
  } else {
    // ============================================================
    //  RECURSIVE UNION-CENTRIC SUBTREE LAYOUT (CONTOURS)
    // ============================================================
    const CHILD_GAP = 40;
    const V_GAP = 220;

    // 1. Mappings
    const coupleById = new Map<string, RawCouple>(couples.map(c => [c.id, c]));
    const couplesByPid = new Map<string, string[]>();
    const childToCouples = new Map<string, string[]>();

    for (const c of couples) {
      for (const pid of [c.partner1Id, c.partner2Id]) {
        if (!couplesByPid.has(pid)) couplesByPid.set(pid, []);
        if (!couplesByPid.get(pid)!.includes(c.id)) couplesByPid.get(pid)!.push(c.id);
      }
      for (const ch of c.children) {
        if (!childToCouples.has(ch.id)) childToCouples.set(ch.id, []);
        childToCouples.get(ch.id)!.push(c.id);
      }
    }

    // 2. BFS pour profondeur Y par personne et par couple
    const depth = new Map<string, number>();
    const queue: string[] = [];

    for (const p of people) {
      if (!childToCouples.has(p.id)) {
        depth.set(p.id, 0);
        queue.push(p.id);
      }
    }
    if (queue.length === 0 && people.length > 0) {
      depth.set(people[0].id, 0);
      queue.push(people[0].id);
    }

    let head = 0;
    while (head < queue.length) {
      const pid = queue[head++];
      const d = depth.get(pid)!;
      for (const cid of couplesByPid.get(pid) ?? []) {
        const c = coupleById.get(cid)!;
        for (const ch of c.children) {
          if (!depth.has(ch.id) || depth.get(ch.id)! < d + 1) {
            depth.set(ch.id, d + 1);
            queue.push(ch.id);
          }
        }
      }
    }
    for (const p of people) if (!depth.has(p.id)) depth.set(p.id, 0);

    // Harmoniser profondeur des conjoints pour alignement vertical strict (jusqu'à convergence)
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of couples) {
        if (c.partner1Id !== c.partner2Id) {
          const d1 = depth.get(c.partner1Id) ?? 0;
          const d2 = depth.get(c.partner2Id) ?? 0;
          if (d1 !== d2) {
            const mx = Math.max(d1, d2);
            depth.set(c.partner1Id, mx);
            depth.set(c.partner2Id, mx);
            changed = true;
          }
        }
      }
    }

    // 3. Calcul par Bounding Boxes (Blocs rigides indivisibles)
    type BBox = { minX: number, maxX: number };

    function getRequiredShift(leftB: BBox, rightB: BBox, gap: number): number {
      return leftB.maxX + gap - rightB.minX;
    }

    const coupleBBox = new Map<string, BBox>();
    const personBBox = new Map<string, BBox>();
    const childRelX = new Map<string, number>();
    const personCoupleRelX = new Map<string, number>();

    function calcPersonBBox(personId: string, visiting = new Set<string>()): BBox {
      if (personBBox.has(personId)) return personBBox.get(personId)!;
      const baseBBox = { minX: -CARD_W / 2, maxX: CARD_W / 2 };

      const pCouples = couplesByPid.get(personId) ?? [];
      if (pCouples.length === 0) {
        personBBox.set(personId, baseBBox);
        return baseBBox;
      }

      let mergedBBox: BBox | null = null;
      const tempRelX: number[] = [];

      for (let i = 0; i < pCouples.length; i++) {
        const cid = pCouples[i];
        if (visiting.has(cid)) {
          tempRelX.push(0);
          continue;
        }
        visiting.add(cid);
        const cp = calcCoupleBBox(cid, visiting);

        if (!mergedBBox) {
          mergedBBox = cp;
          tempRelX.push(0);
        } else {
          const shift = getRequiredShift(mergedBBox, cp, CHILD_GAP * 2);
          mergedBBox = { minX: mergedBBox.minX, maxX: cp.maxX + shift };
          tempRelX.push(shift);
        }
      }

      let centerShift = 0;
      if (tempRelX.length > 0) {
        centerShift = -(tempRelX[tempRelX.length - 1] / 2);
      }
      for (let i = 0; i < pCouples.length; i++) {
        personCoupleRelX.set(pCouples[i], tempRelX[i] + centerShift);
      }

      const finalBBox = {
        minX: Math.min(baseBBox.minX, (mergedBBox?.minX ?? 0) + centerShift),
        maxX: Math.max(baseBBox.maxX, (mergedBBox?.maxX ?? 0) + centerShift)
      };
      personBBox.set(personId, finalBBox);
      return finalBBox;
    }

    function calcCoupleBBox(coupleId: string, visiting = new Set<string>()): BBox {
      if (coupleBBox.has(coupleId)) return coupleBBox.get(coupleId)!;

      const c = coupleById.get(coupleId)!;
      const headerW = c.partner1Id === c.partner2Id ? CARD_W : CARD_W * 2 + SPOUSE_GAP;

      let bbox = { minX: -headerW / 2, maxX: headerW / 2 };

      if (!c.children || c.children.length === 0) {
        coupleBBox.set(coupleId, bbox);
        return bbox;
      }

      let mergedChildrenBBox: BBox | null = null;
      const tempChRelX: number[] = [];

      for (let i = 0; i < c.children.length; i++) {
        const ch = c.children[i];
        const chB = calcPersonBBox(ch.id, new Set(visiting));

        if (!mergedChildrenBBox) {
          mergedChildrenBBox = chB;
          tempChRelX.push(0);
        } else {
          const shift = getRequiredShift(mergedChildrenBBox, chB, CHILD_GAP);
          mergedChildrenBBox = { minX: mergedChildrenBBox.minX, maxX: chB.maxX + shift };
          tempChRelX.push(shift);
        }
      }

      let centerShift = 0;
      if (tempChRelX.length > 0) {
        centerShift = -(tempChRelX[tempChRelX.length - 1] / 2);
      }
      for (let i = 0; i < c.children.length; i++) {
        childRelX.set(`${coupleId}-${c.children[i].id}`, tempChRelX[i] + centerShift);
      }

      bbox = {
        minX: Math.min(bbox.minX, (mergedChildrenBBox?.minX ?? 0) + centerShift),
        maxX: Math.max(bbox.maxX, (mergedChildrenBBox?.maxX ?? 0) + centerShift)
      };
      coupleBBox.set(coupleId, bbox);
      return bbox;
    }

    for (const c of couples) calcCoupleBBox(c.id);

    // 4. Positionnement Top-Down
    const placedCouples = new Set<string>();

    function placeCoupleSubtree(coupleId: string, absX: number, parentX?: number) {
      if (placedCouples.has(coupleId)) return;
      placedCouples.add(coupleId);

      const c = coupleById.get(coupleId)!;
      const d1 = depth.get(c.partner1Id) ?? 0;
      const d2 = depth.get(c.partner2Id) ?? 0;
      const y = Math.max(d1, d2) * V_GAP;

      const centerX = absX;

      if (c.partner1Id === c.partner2Id) {
        posP.set(c.partner1Id, { x: centerX - CARD_W / 2, y });
        posU.set(c.id, { x: centerX - UNION_S / 2, y: y + CARD_H + 15 });
      } else {
        // Orientation Intelligente
        const p1HasParents = childToCouples.has(c.partner1Id) && childToCouples.get(c.partner1Id)!.length > 0;
        const p2HasParents = childToCouples.has(c.partner2Id) && childToCouples.get(c.partner2Id)!.length > 0;

        let p1OnRight = false;
        if (parentX !== undefined) {
          const bloodlineShouldBeOnRight = centerX < parentX;
          if (p1HasParents && !p2HasParents) p1OnRight = bloodlineShouldBeOnRight;
          else if (p2HasParents && !p1HasParents) p1OnRight = !bloodlineShouldBeOnRight;
          else p1OnRight = bloodlineShouldBeOnRight;
        }

        let p1X, p2X;
        if (p1OnRight) {
          p1X = centerX + SPOUSE_GAP / 2;
          p2X = centerX - SPOUSE_GAP / 2 - CARD_W;
        } else {
          p1X = centerX - SPOUSE_GAP / 2 - CARD_W;
          p2X = centerX + SPOUSE_GAP / 2;
        }

        posP.set(c.partner1Id, { x: p1X, y });
        posP.set(c.partner2Id, { x: p2X, y });
        posU.set(c.id, { x: centerX - UNION_S / 2, y: y + CARD_H / 2 - UNION_S / 2 });
      }

      for (const ch of c.children) {
        const relX = childRelX.get(`${coupleId}-${ch.id}`) ?? 0;
        const childAbsX = centerX + relX;

        const chD = depth.get(ch.id) ?? (Math.max(d1, d2) + 1);
        posP.set(ch.id, { x: childAbsX - CARD_W / 2, y: chD * V_GAP });

        const pCouples = couplesByPid.get(ch.id) ?? [];
        for (const chCid of pCouples) {
          const cRelX = personCoupleRelX.get(chCid) ?? 0;
          placeCoupleSubtree(chCid, childAbsX + cRelX, centerX);
        }
      }
    }

    // 5. Placement des Racines
    const rootCouples = couples.filter(c =>
      !childToCouples.has(c.partner1Id) && !childToCouples.has(c.partner2Id)
    );

    let mergedRootsBBox: BBox | null = null;

    for (const rc of rootCouples) {
      const bbox = coupleBBox.get(rc.id);
      if (!bbox) continue;

      let absX = 0;
      if (mergedRootsBBox) {
        absX = getRequiredShift(mergedRootsBBox, bbox, CHILD_GAP * 2);
        mergedRootsBBox = { minX: mergedRootsBBox.minX, maxX: bbox.maxX + absX };
      } else {
        mergedRootsBBox = { minX: bbox.minX, maxX: bbox.maxX };
      }
      placeCoupleSubtree(rc.id, absX);
    }

    // Autres couples résiduels
    for (const c of couples) {
      if (!placedCouples.has(c.id)) {
        const bbox = coupleBBox.get(c.id);
        if (!bbox) continue;
        let absX = 0;
        if (mergedRootsBBox) {
          absX = getRequiredShift(mergedRootsBBox, bbox, CHILD_GAP * 2);
          mergedRootsBBox = { minX: mergedRootsBBox.minX, maxX: bbox.maxX + absX };
        } else {
          mergedRootsBBox = { minX: bbox.minX, maxX: bbox.maxX };
        }
        placeCoupleSubtree(c.id, absX);
      }
    }

    // Personnes isolées sans union
    for (const p of people) {
      if (!posP.has(p.id)) {
        const d = depth.get(p.id) ?? 0;
        const bbox = { minX: -CARD_W / 2, maxX: CARD_W / 2 };
        let absX = 0;
        if (mergedRootsBBox) {
          absX = getRequiredShift(mergedRootsBBox, bbox, CHILD_GAP);
          mergedRootsBBox = { minX: mergedRootsBBox.minX, maxX: bbox.maxX + absX };
        } else {
          mergedRootsBBox = { minX: bbox.minX, maxX: bbox.maxX };
        }
        posP.set(p.id, { x: absX - CARD_W / 2, y: d * V_GAP });
      }
    }
  }

  // Final nodes and edges

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const GROUP_PAD = 8;

  // Single family bounding rectangle per couple + children
  for (const c of couples) {
    const familyMemberIds = new Set<string>();
    familyMemberIds.add(c.partner1Id);
    if (c.partner1Id !== c.partner2Id) familyMemberIds.add(c.partner2Id);
    for (const ch of c.children) familyMemberIds.add(ch.id);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, count = 0;
    for (const id of familyMemberIds) {
      const pos = posP.get(id);
      if (pos) {
        count++;
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + CARD_W);
        maxY = Math.max(maxY, pos.y + CARD_H);
      }
    }

    if (count > 0) {
      nodes.push({
        id: `group-${c.id}`,
        type: 'familyGroup',
        position: { x: minX - GROUP_PAD, y: minY - GROUP_PAD },
        style: { zIndex: -1 },
        selectable: false,
        focusable: false,
        draggable: false,
        data: {
          coupleId: c.id,
          width: (maxX - minX) + GROUP_PAD * 2,
          height: (maxY - minY) + GROUP_PAD * 2,
        },
      });
    }
  }

  for (const p of people) {
    nodes.push({
      id: p.id,
      type: 'person',
      position: posP.get(p.id) ?? { x: 0, y: 0 },
      data: { ...p },
    });
  }

  const spouseStyle = (isSep: boolean) => isSep
    ? { stroke: '#8c387b', strokeWidth: 2, strokeDasharray: '6 4' }
    : { stroke: '#5c2456', strokeWidth: 2.5 };

  function getCoupleChildColor(coupleId: string): string {
    let hash = 0;
    for (let i = 0; i < coupleId.length; i++) {
      hash = coupleId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 42%)`;
  }

  for (const c of couples) {
    const unionId = `union-${c.id}`;
    const uPos = posU.get(c.id) ?? { x: 0, y: 0 };
    const isSep = Boolean(c.isSeparated);
    const isSingle = c.partner1Id === c.partner2Id;

    nodes.push({
      id: unionId,
      type: 'union',
      position: uPos,
      data: {
        coupleId: c.id,
        partner1Id: c.partner1Id,
        partner2Id: c.partner2Id,
        isSeparated: isSep,
        isSingleParent: isSingle,
        children: c.children,
      },
    });

    if (isSingle) {
      edges.push({
        id: `e-${c.partner1Id}-${unionId}`,
        source: c.partner1Id, sourceHandle: 'bottom-source',
        target: unionId, targetHandle: 'union-top',
        type: 'straight', style: spouseStyle(isSep),
      });
    } else {
      const p1Pos = posP.get(c.partner1Id);
      const p2Pos = posP.get(c.partner2Id);
      const p1OnLeft = !p1Pos || !p2Pos || p1Pos.x <= p2Pos.x;

      edges.push({
        id: `e-${c.partner1Id}-${unionId}`,
        source: c.partner1Id, sourceHandle: p1OnLeft ? 'right-source' : 'left-source',
        target: unionId, targetHandle: p1OnLeft ? 'union-left' : 'union-right',
        type: 'straight', style: spouseStyle(isSep),
      });
      edges.push({
        id: `e-${c.partner2Id}-${unionId}`,
        source: c.partner2Id, sourceHandle: p1OnLeft ? 'left-source' : 'right-source',
        target: unionId, targetHandle: p1OnLeft ? 'union-right' : 'union-left',
        type: 'straight', style: spouseStyle(isSep),
      });
    }

    const coupleChildColor = getCoupleChildColor(c.id);
    const childStyle = { stroke: coupleChildColor, strokeWidth: 2.5 };

    for (const ch of c.children) {
      edges.push({
        id: `e-${unionId}-${ch.id}`,
        source: unionId, sourceHandle: 'union-bottom',
        target: ch.id, targetHandle: 'top-target',
        type: 'step', style: childStyle,
      });
    }
  }

  return { nodes, edges };
}
