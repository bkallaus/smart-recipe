'use server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/session';

export const logout = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  // Clear the old, unsigned Google token cookie left by earlier versions.
  cookieStore.delete('recipe-token');
};
