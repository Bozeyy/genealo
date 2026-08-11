'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/rateLimit';
import { checkAuth } from './authActions';

export async function createCouple(partner1Id: string, partner2Id: string) {
  const { allowed, retryAfterSeconds } = await checkRateLimit('createCouple', { limit: 20, windowMs: 60 * 1000 });
  if (!allowed) {
    return { success: false, error: `Trop de requêtes. Veuillez réessayer dans ${retryAfterSeconds}s.` };
  }
  if (!(await checkAuth())) return { success: false, error: 'Non autorisé' };

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
  const { allowed, retryAfterSeconds } = await checkRateLimit('deleteCouple', { limit: 20, windowMs: 60 * 1000 });
  if (!allowed) {
    return { success: false, error: `Trop de requêtes. Veuillez réessayer dans ${retryAfterSeconds}s.` };
  }
  if (!(await checkAuth())) return { success: false, error: 'Non autorisé' };

  await prisma.couple.delete({
    where: { id: coupleId },
  });
  revalidatePath('/');
  return { success: true };
}

export async function toggleCoupleSeparated(coupleId: string, isSeparated: boolean) {
  const { allowed, retryAfterSeconds } = await checkRateLimit('toggleCoupleSeparated', { limit: 30, windowMs: 60 * 1000 });
  if (!allowed) {
    return { success: false, error: `Trop de requêtes. Veuillez réessayer dans ${retryAfterSeconds}s.` };
  }
  if (!(await checkAuth())) return { success: false, error: 'Non autorisé' };

  await prisma.couple.update({
    where: { id: coupleId },
    data: { isSeparated },
  });
  revalidatePath('/');
  return { success: true };
}

export async function addChildToCouple(coupleId: string, childId: string) {
  const { allowed, retryAfterSeconds } = await checkRateLimit('addChildToCouple', { limit: 30, windowMs: 60 * 1000 });
  if (!allowed) {
    return { success: false, error: `Trop de requêtes. Veuillez réessayer dans ${retryAfterSeconds}s.` };
  }
  if (!(await checkAuth())) return { success: false, error: 'Non autorisé' };

  await prisma.person.update({
    where: { id: childId },
    data: { parentCoupleId: coupleId },
  });

  revalidatePath('/');
  return { success: true };
}

export async function addChildToPerson(parentPersonId: string, childId: string) {
  const { allowed, retryAfterSeconds } = await checkRateLimit('addChildToPerson', { limit: 30, windowMs: 60 * 1000 });
  if (!allowed) {
    return { success: false, error: `Trop de requêtes. Veuillez réessayer dans ${retryAfterSeconds}s.` };
  }
  if (!(await checkAuth())) return { success: false, error: 'Non autorisé' };

  if (parentPersonId === childId) {
    return { success: false, error: 'Une personne ne peut pas être son propre enfant.' };
  }

  // Find existing couple for this parent
  let couple = await prisma.couple.findFirst({
    where: {
      OR: [
        { partner1Id: parentPersonId },
        { partner2Id: parentPersonId },
      ],
    },
  });

  if (!couple) {
    // Create a single-parent union (partner1 = partner2)
    couple = await prisma.couple.create({
      data: {
        partner1Id: parentPersonId,
        partner2Id: parentPersonId,
      },
    });
  }

  await prisma.person.update({
    where: { id: childId },
    data: { parentCoupleId: couple.id },
  });

  revalidatePath('/');
  return { success: true };
}

export async function removeChildFromCouple(childId: string) {
  const { allowed, retryAfterSeconds } = await checkRateLimit('removeChildFromCouple', { limit: 30, windowMs: 60 * 1000 });
  if (!allowed) {
    return { success: false, error: `Trop de requêtes. Veuillez réessayer dans ${retryAfterSeconds}s.` };
  }
  if (!(await checkAuth())) return { success: false, error: 'Non autorisé' };

  await prisma.person.update({
    where: { id: childId },
    data: { parentCoupleId: null },
  });

  revalidatePath('/');
  return { success: true };
}
