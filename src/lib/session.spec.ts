// @vitest-environment node
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  assertValidSecret,
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from './session';

const SECRET = 'a'.repeat(32);
const OTHER_SECRET = 'b'.repeat(32);
const USER = { email: 'cook@example.com', name: 'Cook' };
const NOW = 1_700_000_000;

const forge = (payload: object, secret: string) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
};

describe('session tokens', () => {
  it('round-trips a signed user', () => {
    const token = createSessionToken(USER, SECRET, NOW);
    expect(verifySessionToken(token, SECRET, NOW + 60)).toEqual(USER);
  });

  it('rejects a token signed with another secret', () => {
    const token = createSessionToken(USER, OTHER_SECRET, NOW);
    expect(verifySessionToken(token, SECRET, NOW)).toBeNull();
  });

  it('rejects a payload that was edited after signing', () => {
    const token = createSessionToken(USER, SECRET, NOW);
    const [, sig] = token.split('.');
    const tampered = Buffer.from(
      JSON.stringify({
        v: 1,
        email: 'admin@example.com',
        name: 'Admin',
        iat: NOW,
        exp: NOW + SESSION_MAX_AGE_SECONDS,
      }),
    ).toString('base64url');

    expect(verifySessionToken(`${tampered}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = createSessionToken(USER, SECRET, NOW);
    expect(
      verifySessionToken(token, SECRET, NOW + SESSION_MAX_AGE_SECONDS),
    ).toBeNull();
    expect(
      verifySessionToken(token, SECRET, NOW + SESSION_MAX_AGE_SECONDS - 1),
    ).toEqual(USER);
  });

  it.each([
    undefined,
    '',
    'not-a-token',
    'a.b.c',
    '.',
    // An unsigned Google-style JWT, like the old forgeable cookie
    'eyJhbGciOiJub25lIn0.eyJlbWFpbCI6InhAeS56In0.',
  ])('treats %j as signed out without throwing', (token) => {
    expect(verifySessionToken(token, SECRET, NOW)).toBeNull();
  });

  it('rejects a correctly signed payload with the wrong shape', () => {
    expect(
      verifySessionToken(forge({ email: 'x' }, SECRET), SECRET),
    ).toBeNull();
    expect(
      verifySessionToken(
        forge({ v: 1, email: '', name: 'x', iat: NOW, exp: NOW + 10 }, SECRET),
        SECRET,
        NOW,
      ),
    ).toBeNull();
  });

  it('rejects a correctly signed payload that is not JSON', () => {
    const encoded = Buffer.from('not json').toString('base64url');
    const sig = createHmac('sha256', SECRET)
      .update(encoded)
      .digest('base64url');
    expect(verifySessionToken(`${encoded}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it('returns null rather than verifying with an empty secret', () => {
    const token = createSessionToken(USER, SECRET, NOW);
    expect(verifySessionToken(token, '', NOW)).toBeNull();
  });

  it('refuses to sign with a missing or short secret', () => {
    expect(() => createSessionToken(USER, '', NOW)).toThrow(/SESSION_SECRET/);
    expect(() => createSessionToken(USER, 'short', NOW)).toThrow(
      /SESSION_SECRET/,
    );
    expect(() => assertValidSecret(undefined)).toThrow(/SESSION_SECRET/);
    expect(assertValidSecret(SECRET)).toBe(SECRET);
  });
});
