import { createHash, timingSafeEqual } from 'node:crypto';

/** Reads the comma-separated list of accepted keys from RECIPE_API_KEYS. */
export const parseApiKeys = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

const BEARER_REGEX = /^Bearer\s+(.+)$/i;

/** Pulls the key from `Authorization: Bearer <key>` or `X-API-Key: <key>`. */
export const getRequestApiKey = (headers: Headers): string | null => {
  const authorization = headers.get('authorization');
  const bearer = authorization?.match(BEARER_REGEX)?.[1]?.trim();

  return bearer || headers.get('x-api-key')?.trim() || null;
};

const digest = (value: string) => createHash('sha256').update(value).digest();

/** Compares hashes so the check takes the same time whatever the key. */
export const isValidApiKey = (
  candidate: string | null,
  validKeys: string[],
): boolean => {
  if (!candidate) {
    return false;
  }

  const candidateDigest = digest(candidate);
  let valid = false;

  for (const key of validKeys) {
    if (timingSafeEqual(candidateDigest, digest(key))) {
      valid = true;
    }
  }

  return valid;
};
