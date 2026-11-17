import { createHmac, timingSafeEqual } from 'node:crypto';
import type { User } from '@/types/user';

/**
 * Signed session tokens issued by this app after it has verified a Google
 * ID token. Format: `base64url(payload).base64url(HMAC-SHA256(payload))`.
 * Pure functions (no Next.js imports) so they can be unit tested.
 */

export const SESSION_COOKIE = 'recipe-session';

/** How long a session stays valid after sign-in. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Shortest secret accepted, so a placeholder value can't sign sessions. */
export const MIN_SECRET_LENGTH = 32;

const TOKEN_VERSION = 1;

type SessionPayload = {
  v: number;
  email: string;
  name: string;
  iat: number;
  exp: number;
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

const sign = (data: string, secret: string) =>
  createHmac('sha256', secret).update(data).digest('base64url');

/** Throws when the secret is missing or too short to be trusted. */
export const assertValidSecret = (secret: string | undefined): string => {
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be set to a random string of at least ${MIN_SECRET_LENGTH} characters`,
    );
  }

  return secret;
};

export const createSessionToken = (
  user: User,
  secret: string,
  issuedAt = nowSeconds(),
): string => {
  const payload: SessionPayload = {
    v: TOKEN_VERSION,
    email: user.email,
    name: user.name,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return `${encoded}.${sign(encoded, assertValidSecret(secret))}`;
};

const isSessionPayload = (value: unknown): value is SessionPayload => {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;

  return (
    p.v === TOKEN_VERSION &&
    typeof p.email === 'string' &&
    p.email.length > 0 &&
    typeof p.name === 'string' &&
    typeof p.iat === 'number' &&
    typeof p.exp === 'number'
  );
};

/**
 * Returns the user in a token this app signed, or null for anything that is
 * missing, malformed, tampered with or expired. Never throws for bad input.
 */
export const verifySessionToken = (
  token: string | undefined,
  secret: string,
  now = nowSeconds(),
): User | null => {
  if (!token || !secret) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expected = Buffer.from(sign(encoded, secret));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!isSessionPayload(payload) || payload.exp <= now) {
    return null;
  }

  return { email: payload.email, name: payload.name };
};
