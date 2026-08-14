'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { enforceRateLimit, checkRateLimit } from '@/lib/rateLimit';
import { checkAuth } from './authActions';

export async function createPerson(formData: FormData) {
  await enforceRateLimit('createPerson', { limit: 15, windowMs: 60 * 1000 });
  if (!(await checkAuth())) throw new Error('Non autorisé');

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const birthDateStr = formData.get('birthDate') as string;
  const deathDateStr = formData.get('deathDate') as string;
  const photoUrl = formData.get('photoUrl') as string;

  if (!firstName) throw new Error('Le prénom est requis');

  const positionX = 100 + Math.random() * 400;
  const positionY = 100 + Math.random() * 300;

  await prisma.person.create({
    data: {
      firstName,
      lastName: lastName || null,
      birthDate: birthDateStr ? new Date(birthDateStr) : null,
      deathDate: deathDateStr ? new Date(deathDateStr) : null,
      photoUrl: photoUrl || null,
      positionX,
      positionY,
    },
  });

  revalidatePath('/');
  return { success: true };
}

export async function updatePerson(id: string, formData: FormData) {
  await enforceRateLimit('updatePerson', { limit: 30, windowMs: 60 * 1000 });
  if (!(await checkAuth())) throw new Error('Non autorisé');

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const birthDateStr = formData.get('birthDate') as string;
  const deathDateStr = formData.get('deathDate') as string;
  const photoUrl = formData.get('photoUrl') as string;

  await prisma.person.update({
    where: { id },
    data: {
      firstName,
      lastName: lastName || null,
      birthDate: birthDateStr ? new Date(birthDateStr) : null,
      deathDate: deathDateStr ? new Date(deathDateStr) : null,
      photoUrl: photoUrl || null,
    },
  });

  revalidatePath('/');
  return { success: true };
}

export async function updatePersonPosition(id: string, x: number, y: number) {
  const { allowed } = await checkRateLimit('updatePersonPosition', { limit: 150, windowMs: 60 * 1000 });
  if (!allowed || !(await checkAuth())) return;

  try {
    await prisma.person.update({
      where: { id },
      data: { positionX: x, positionY: y },
    });
  } catch (error) {
    // Ignore error if person was deleted while drag timer was active
  }
}

export async function deletePerson(id: string) {
  await enforceRateLimit('deletePerson', { limit: 15, windowMs: 60 * 1000 });
  if (!(await checkAuth())) throw new Error('Non autorisé');

  await prisma.person.delete({ where: { id } });
  revalidatePath('/');
  return { success: true };
}

export async function saveAllPositions(positions: { id: string; x: number; y: number }[]) {
  const { allowed } = await checkRateLimit('updatePersonPosition', { limit: 150, windowMs: 60 * 1000 });
  if (!allowed || !(await checkAuth())) return;

  try {
    await prisma.$transaction(
      positions.map(p =>
        prisma.person.update({
          where: { id: p.id },
          data: { positionX: p.x, positionY: p.y },
        })
      )
    );
    revalidatePath('/');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des positions:', error);
  }
}

export async function resetAllPositions() {
  await enforceRateLimit('updatePerson', { limit: 15, windowMs: 60 * 1000 });
  if (!(await checkAuth())) throw new Error('Non autorisé');

  const people = await prisma.person.findMany({ select: { id: true }, orderBy: { createdAt: 'asc' } });
  const cols = Math.max(1, Math.ceil(Math.sqrt(people.length)));

  await prisma.$transaction(
    people.map((p, i) => {
      const x = (i % cols) * 200;
      const y = Math.floor(i / cols) * 200;
      return prisma.person.update({
        where: { id: p.id },
        data: { positionX: x, positionY: y },
      });
    })
  );

  revalidatePath('/');
  return { success: true };
}

