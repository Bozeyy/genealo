'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCouple(partner1Id: string, partner2Id: string) {
  if (partner1Id === partner2Id) {
    return { success: false, error: 'Impossible de former un couple avec la même personne.' };
  }

  // Check if couple already exists
  const existing = await prisma.couple.findFirst({
    where: {
      OR: [
        { partner1Id, partner2Id },
        { partner1Id: partner2Id, partner2Id: partner1Id },
      ],
    },
  });

  if (existing) {
    return { success: false, error: 'Ce couple existe déjà.' };
  }

  await prisma.couple.create({
    data: {
      partner1Id,
      partner2Id,
    },
  });

  revalidatePath('/');
  return { success: true };
}

export async function deleteCouple(coupleId: string) {
  await prisma.couple.delete({
    where: { id: coupleId },
  });
  revalidatePath('/');
  return { success: true };
}

export async function toggleCoupleSeparated(coupleId: string, isSeparated: boolean) {
  await prisma.couple.update({
    where: { id: coupleId },
    data: { isSeparated },
  });
  revalidatePath('/');
  return { success: true };
}

export async function addChildToCouple(coupleId: string, childId: string) {
  await prisma.person.update({
    where: { id: childId },
    data: { parentCoupleId: coupleId },
  });

  revalidatePath('/');
  return { success: true };
}

export async function removeChildFromCouple(childId: string) {
  await prisma.person.update({
    where: { id: childId },
    data: { parentCoupleId: null },
  });

  revalidatePath('/');
  return { success: true };
}
