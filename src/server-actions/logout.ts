'use server';
import { cookies } from 'next/headers';

export const logout = async () => {
  const cookieStore = await cookies();

  // Overwrite the auth cookie with an expired one. Attributes mirror the
  // ones set in google-sign-in.tsx so the browser replaces the same cookie.
  cookieStore.set('recipe-token', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: true,
  });
};
