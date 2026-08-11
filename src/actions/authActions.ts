'use server';

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const COOKIE_NAME = 'genealo_auth';
const COOKIE_VALUE = 'authenticated';
const DEFAULT_PIN = '3141';

export async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(COOKIE_NAME);
  return authCookie?.value === COOKIE_VALUE;
}

export async function login(pin: string): Promise<{ success: boolean; error?: string }> {
  try {
    let config = await prisma.securityConfig.findUnique({
      where: { id: 'global' },
    });

    if (!config) {
      // Initialize the default PIN if not exists
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(DEFAULT_PIN, salt);
      config = await prisma.securityConfig.create({
        data: {
          id: 'global',
          pinHash: hash,
        },
      });
    }

    const isMatch = await bcrypt.compare(pin, config.pinHash);

    if (isMatch) {
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, COOKIE_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      return { success: true };
    } else {
      return { success: false, error: 'Code PIN incorrect.' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Une erreur est survenue.' };
  }
}

export async function logout(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return { success: true };
}
