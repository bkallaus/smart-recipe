import { describe, expect, test, vi } from 'vitest';
import {
  assertSafeUrl,
  fetchPublicHtml,
  isBlockedIpAddress,
  type LookupFn,
} from '../safe-url';

const resolvesTo =
  (...addresses: string[]): LookupFn =>
  async () =>
    addresses.map((address) => ({
      address,
      family: address.includes(':') ? 6 : 4,
    }));

const publicLookup = resolvesTo('93.184.215.14');

describe('isBlockedIpAddress', () => {
  test.each([
    '127.0.0.1',
    '127.255.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.100.100.200',
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '[::1]',
    'fe80::1',
    'fc00::1',
    'fd00:ec2::254',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:a9fe:a9fe',
    '64:ff9b::a9fe:a9fe',
    '2002:7f00:1::',
    'ff02::1',
    'not-an-ip',
  ])('blocks %s', (ip) => {
    expect(isBlockedIpAddress(ip)).toBe(true);
  });

  test.each([
    '93.184.215.14',
    '8.8.8.8',
    '172.32.0.1',
    '2606:4700:4700::1111',
    '::ffff:8.8.8.8',
  ])('allows %s', (ip) => {
    expect(isBlockedIpAddress(ip)).toBe(false);
  });
});

describe('assertSafeUrl', () => {
  test('accepts public http and https URLs', async () => {
    await expect(
      assertSafeUrl('https://example.com/recipe', publicLookup),
    ).resolves.toBeInstanceOf(URL);
    await expect(
      assertSafeUrl('http://example.com/recipe', publicLookup),
    ).resolves.toBeInstanceOf(URL);
  });

  test.each([
    'not a url',
    'ftp://example.com/recipe',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://user:pass@example.com/',
  ])('rejects %s', async (url) => {
    await expect(assertSafeUrl(url, publicLookup)).rejects.toThrow();
  });

  test.each([
    'http://localhost:3000/',
    'http://api.localhost/',
    'http://127.0.0.1/',
    'http://2130706433/',
    'http://0x7f.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[fd00:ec2::254]/',
    'http://metadata.google.internal/',
  ])('rejects internal host %s', async (url) => {
    const lookup = vi.fn(publicLookup);

    await expect(assertSafeUrl(url, lookup)).rejects.toThrow(
      'cannot be imported from',
    );
    expect(lookup).not.toHaveBeenCalled();
  });

  test('rejects hostnames that resolve to private addresses', async () => {
    await expect(
      assertSafeUrl('https://evil.example/', resolvesTo('10.0.0.5')),
    ).rejects.toThrow('cannot be imported from');
    await expect(
      assertSafeUrl(
        'https://evil.example/',
        resolvesTo('93.184.215.14', '::1'),
      ),
    ).rejects.toThrow('cannot be imported from');
  });

  test('rejects hostnames that do not resolve', async () => {
    await expect(
      assertSafeUrl('https://nope.example/', async () => {
        throw new Error('ENOTFOUND');
      }),
    ).rejects.toThrow('Could not resolve');
  });
});

describe('fetchPublicHtml', () => {
  test('returns the page HTML', async () => {
    const fetchFn = vi.fn(
      async () => new Response('<html>ok</html>', { status: 200 }),
    );

    await expect(
      fetchPublicHtml(
        'https://example.com/',
        {},
        { lookup: publicLookup, fetchFn },
      ),
    ).resolves.toBe('<html>ok</html>');
    expect(fetchFn).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ redirect: 'manual' }),
    );
  });

  test('follows redirects to public hosts', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 301,
          headers: { location: '/recipes/cookies' },
        }),
      )
      .mockResolvedValueOnce(new Response('<html>cookies</html>'));

    await expect(
      fetchPublicHtml(
        'https://example.com/',
        {},
        { lookup: publicLookup, fetchFn },
      ),
    ).resolves.toBe('<html>cookies</html>');
    expect(String(fetchFn.mock.calls[1][0])).toBe(
      'https://example.com/recipes/cookies',
    );
  });

  test('refuses redirects to internal hosts', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'http://169.254.169.254/latest/meta-data/' },
      }),
    );

    await expect(
      fetchPublicHtml(
        'https://example.com/',
        {},
        { lookup: publicLookup, fetchFn },
      ),
    ).rejects.toThrow('cannot be imported from');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('fails on error responses', async () => {
    const fetchFn = vi.fn(async () => new Response('nope', { status: 403 }));

    await expect(
      fetchPublicHtml(
        'https://example.com/',
        {},
        { lookup: publicLookup, fetchFn },
      ),
    ).rejects.toThrow('403');
  });
});
