import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export type LookupAddress = { address: string; family: number };
export type LookupFn = (hostname: string) => Promise<LookupAddress[]>;

const defaultLookup: LookupFn = (hostname) =>
  dnsLookup(hostname, { all: true, verbatim: true });

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

// [network, prefix length] in CIDR notation
const BLOCKED_IPV4_RANGES: [string, number][] = [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, incl. cloud metadata 169.254.169.254
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.88.99.0', 24], // 6to4 relay
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved, incl. broadcast
];

const parseIPv4 = (ip: string): number | null => {
  const parts = ip.split('.');

  if (parts.length !== 4) {
    return null;
  }

  let value = 0;

  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) {
      return null;
    }
    value = value * 256 + Number(part);
  }

  return value;
};

const isBlockedIPv4 = (ip: string): boolean => {
  const value = parseIPv4(ip);

  if (value === null) {
    return true;
  }

  return BLOCKED_IPV4_RANGES.some(([network, prefix]) => {
    const size = 2 ** (32 - prefix);
    const start = parseIPv4(network) as number;
    return value >= start && value < start + size;
  });
};

// Expands an IPv6 address (optionally with an embedded IPv4 tail) to 8 hextets
const parseIPv6 = (input: string): number[] | null => {
  let ip = input.toLowerCase();
  const zoneIndex = ip.indexOf('%');

  if (zoneIndex !== -1) {
    ip = ip.slice(0, zoneIndex);
  }

  const lastColon = ip.lastIndexOf(':');
  const tail = ip.slice(lastColon + 1);

  if (tail.includes('.')) {
    const v4 = parseIPv4(tail);

    if (v4 === null) {
      return null;
    }

    ip = `${ip.slice(0, lastColon + 1)}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }

  const halves = ip.split('::');

  if (halves.length > 2) {
    return null;
  }

  const toHextets = (part: string) =>
    part ? part.split(':').map((h) => Number.parseInt(h, 16)) : [];
  const head = toHextets(halves[0]);
  const rest = halves.length === 2 ? toHextets(halves[1]) : [];
  const missing = 8 - head.length - rest.length;

  if (halves.length === 1 ? head.length !== 8 : missing < 1) {
    return null;
  }

  const hextets = [
    ...head,
    ...Array(halves.length === 2 ? missing : 0).fill(0),
    ...rest,
  ];

  if (hextets.some((h) => Number.isNaN(h) || h < 0 || h > 0xffff)) {
    return null;
  }

  return hextets;
};

const hextetsToIPv4 = (high: number, low: number) =>
  [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.');

const isBlockedIPv6 = (ip: string): boolean => {
  const h = parseIPv6(ip);

  if (!h) {
    return true;
  }

  const firstFiveZero = h.slice(0, 5).every((x) => x === 0);

  // :: and ::1
  if (h.slice(0, 7).every((x) => x === 0) && h[7] <= 1) {
    return true;
  }

  // IPv4-mapped (::ffff:a.b.c.d) and deprecated IPv4-compatible (::a.b.c.d)
  if (firstFiveZero && (h[5] === 0xffff || h[5] === 0)) {
    return isBlockedIPv4(hextetsToIPv4(h[6], h[7]));
  }

  // NAT64 (64:ff9b::/96) embeds an IPv4 address
  if (h[0] === 0x64 && h[1] === 0xff9b && h.slice(2, 6).every((x) => x === 0)) {
    return isBlockedIPv4(hextetsToIPv4(h[6], h[7]));
  }

  // 6to4 (2002::/16) embeds an IPv4 address in hextets 1-2
  if (h[0] === 0x2002) {
    return isBlockedIPv4(hextetsToIPv4(h[1], h[2]));
  }

  return (
    (h[0] & 0xfe00) === 0xfc00 || // unique local fc00::/7 (incl. AWS fd00:ec2::254)
    (h[0] & 0xffc0) === 0xfe80 || // link-local fe80::/10
    (h[0] & 0xffc0) === 0xfec0 || // site-local fec0::/10 (deprecated)
    (h[0] & 0xff00) === 0xff00 || // multicast ff00::/8
    (h[0] === 0x2001 && h[1] === 0x0db8) || // documentation 2001:db8::/32
    (h[0] === 0x0100 && h.slice(1, 4).every((x) => x === 0)) // discard 100::/64
  );
};

/**
 * True when an IP address is loopback, private, link-local, cloud metadata or
 * otherwise not a public unicast address. Unparseable input counts as blocked.
 */
export const isBlockedIpAddress = (ip: string): boolean => {
  const address = ip.replace(/^\[|\]$/g, '');
  const version = isIP(address);

  if (version === 4) {
    return isBlockedIPv4(address);
  }

  if (version === 6) {
    return isBlockedIPv6(address);
  }

  return true;
};

const BLOCKED_HOSTNAME_REGEX = /(^|\.)(localhost|local|internal|localdomain)$/i;

/**
 * Parses a user-supplied URL and makes sure the server may fetch it: http(s)
 * only, no credentials, and a host that is public, both as written and after
 * DNS resolution.
 */
export const assertSafeUrl = async (
  input: string,
  lookup: LookupFn = defaultLookup,
): Promise<URL> => {
  let url: URL;

  try {
    url = new URL(String(input ?? '').trim());
  } catch {
    throw new UnsafeUrlError('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http and https URLs can be imported');
  }

  if (url.username || url.password) {
    throw new UnsafeUrlError('URLs with credentials cannot be imported');
  }

  // WHATWG URL normalises IPv4 shorthands (e.g. 2130706433, 0x7f.1) to dotted
  // form and wraps IPv6 literals in brackets
  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');

  if (!hostname || BLOCKED_HOSTNAME_REGEX.test(hostname)) {
    throw new UnsafeUrlError('This host cannot be imported from');
  }

  if (isIP(hostname)) {
    if (isBlockedIpAddress(hostname)) {
      throw new UnsafeUrlError('This host cannot be imported from');
    }

    return url;
  }

  let addresses: LookupAddress[];

  try {
    addresses = await lookup(hostname);
  } catch {
    throw new UnsafeUrlError(`Could not resolve ${hostname}`);
  }

  if (
    !addresses.length ||
    addresses.some(({ address }) => isBlockedIpAddress(address))
  ) {
    throw new UnsafeUrlError('This host cannot be imported from');
  }

  return url;
};

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 10 * 1024 * 1024;

const readLimitedText = async (response: Response, maxBytes: number) => {
  if (!response.body) {
    return '';
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    total += value.byteLength;

    if (total > maxBytes) {
      await reader.cancel();
      throw new Error('The page is too large to import');
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder('utf-8').decode(bytes);
};

/**
 * Fetches a page's HTML, validating the URL and every redirect target with
 * assertSafeUrl so a public URL cannot bounce the server onto an internal one.
 */
export const fetchPublicHtml = async (
  input: string,
  init: RequestInit = {},
  {
    lookup = defaultLookup,
    fetchFn = fetch,
  }: { lookup?: LookupFn; fetchFn?: typeof fetch } = {},
): Promise<string> => {
  let url = await assertSafeUrl(input, lookup);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetchFn(url, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      await response.body?.cancel();

      if (!location) {
        throw new Error(`Redirect without a location (${response.status})`);
      }

      url = await assertSafeUrl(new URL(location, url).toString(), lookup);
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`The page responded with ${response.status}`);
    }

    return readLimitedText(response, MAX_HTML_BYTES);
  }

  throw new Error('Too many redirects');
};
