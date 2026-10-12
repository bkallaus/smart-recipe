import { describe, expect, test } from 'vitest';
import { getRequestApiKey, isValidApiKey, parseApiKeys } from '../api-key';

describe('parseApiKeys', () => {
  test('splits and trims the env value', () => {
    expect(parseApiKeys(' a , b,,c ')).toEqual(['a', 'b', 'c']);
    expect(parseApiKeys(undefined)).toEqual([]);
  });
});

describe('getRequestApiKey', () => {
  test('reads a bearer token', () => {
    expect(
      getRequestApiKey(new Headers({ Authorization: 'Bearer secret' })),
    ).toBe('secret');
  });

  test('falls back to X-API-Key', () => {
    expect(getRequestApiKey(new Headers({ 'X-API-Key': 'secret' }))).toBe(
      'secret',
    );
  });

  test('returns null without a key', () => {
    expect(getRequestApiKey(new Headers({ Authorization: 'Basic x' }))).toBe(
      null,
    );
  });
});

describe('isValidApiKey', () => {
  test('matches any configured key', () => {
    expect(isValidApiKey('two', ['one', 'two'])).toBe(true);
    expect(isValidApiKey('three', ['one', 'two'])).toBe(false);
    expect(isValidApiKey(null, ['one'])).toBe(false);
    expect(isValidApiKey('one', [])).toBe(false);
  });
});
