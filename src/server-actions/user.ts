'use server';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';
import { GOOGLE_CLIENT_ID } from '@/lib/google-client-id';
import {
  assertValidSecret,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/session';
import { upsertUserRow } from '@/lib/users';

const client = new OAuth2Client();

export type SignInResult = { ok: true } | { ok: false; error: string };

const verifyGoogleCredential = async (credential: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified === false) {
      return null;
    }

    return { email: payload.email, name: payload.name ?? payload.email };
  } catch {
    return null;
  }
};

/**
 * Verifies a Google ID token, makes sure the user has a row, and starts a
 * session signed by this app. Expected failures are returned rather than
 * thrown because Next.js hides thrown messages from the client in production.
 */
export const signIn = async (credential: string): Promise<SignInResult> => {
  let secret: string;
  try {
    secret = assertValidSecret(process.env.SESSION_SECRET);
  } catch (error) {
    console.error(error);
    return { ok: false, error: 'Sign-in is not configured on this server.' };
  }

  if (typeof credential !== 'string' || !credential) {
    return { ok: false, error: 'Google did not return a credential.' };
  }

  const user = await verifyGoogleCredential(credential);

  if (!user) {
    return { ok: false, error: 'Google sign-in could not be verified.' };
  }

  try {
    await upsertUserRow(user);
  } catch (error) {
    console.error('failed to save user on sign-in:', error);
    return {
      ok: false,
      error: 'Could not save your account. Please try again.',
    };
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(user, secret), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true };
};
