import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import FamilyCanvas from '@/components/FamilyCanvas';
import type { PersonNodeData } from '@/components/PersonNode';
import { buildFamilyGraph, RawCouple } from '@/lib/familyLayout';
import { checkAuth } from '@/actions/authActions';

export const metadata: Metadata = {
  title: 'Genealo — Arbre Généalogique',
  description: 'Créez et visualisez votre arbre généalogique de manière interactive.',
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  let people: any[] = [];
  let couples: any[] = [];

  try {
    [people, couples] = await Promise.all([
      prisma.person.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.couple.findMany({
        include: {
          children: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);
  } catch (error) {
    console.error('DB error:', error);
  }

  const peopleList: PersonNodeData[] = people.map(p => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    birthDate: p.birthDate?.toISOString() ?? null,
    deathDate: p.deathDate?.toISOString() ?? null,
    photoUrl: p.photoUrl,
    parentCoupleId: p.parentCoupleId,
    positionX: p.positionX,
    positionY: p.positionY,
  }));

  const rawCouples: RawCouple[] = couples.map(c => ({
    id: c.id,
    partner1Id: c.partner1Id,
    partner2Id: c.partner2Id,
    isSeparated: c.isSeparated,
    children: c.children,
  }));


  const isAuthenticated = await checkAuth();
  const { nodes, edges } = buildFamilyGraph(peopleList, rawCouples);

  return (
    <FamilyCanvas
      initialNodes={nodes}
      initialEdges={edges}
      people={peopleList}
      rawCouples={rawCouples}
      isAuthenticated={isAuthenticated}
    />
  );
}
