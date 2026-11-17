import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';
import type { User } from '@/types/user';

// Deliberately not 'use server': these helpers run inside server components
// and server actions only and must not be callable as public endpoints.

/**
 * The signed-in user from the app's signed session cookie, or null when the
 * cookie is missing, invalid or expired. Never throws for a bad cookie.
 * Cached per request because the header and the page both ask for it.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    // Fail closed: without the secret no session can be trusted.
    console.error(
      'SESSION_SECRET is not set; treating every visitor as signed out',
    );
    return null;
  }

  return verifySessionToken(token, secret);
});

export const hasAccess = async (): Promise<boolean> => !!(await getUser());

/** For server actions: the signed-in user, or throws when signed out. */
export const requireUser = async (): Promise<User> => {
  const user = await getUser();

  if (!user) {
    throw new Error('You must be signed in to do that');
  }

  return user;
};
