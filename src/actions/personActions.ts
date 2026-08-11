'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPerson(formData: FormData) {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const birthDateStr = formData.get('birthDate') as string;
  const deathDateStr = formData.get('deathDate') as string;
  const photoUrl = formData.get('photoUrl') as string;

  if (!firstName) throw new Error('Le prénom est requis');

  // Place new person at a slightly random position so they don't stack
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
  await prisma.person.update({
    where: { id },
    data: { positionX: x, positionY: y },
  });
  // No revalidatePath here — position updates are client-side only
}

export async function deletePerson(id: string) {
  await prisma.person.delete({ where: { id } });
  revalidatePath('/');
  return { success: true };
}
