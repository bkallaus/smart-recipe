import { getRequestApiKey, isValidApiKey, parseApiKeys } from './api-key';

/** Error body following RFC 9457 (Problem Details for HTTP APIs). */
export const problem = (
  status: number,
  title: string,
  detail?: string,
  extra?: Record<string, unknown>,
  headers?: HeadersInit,
) =>
  Response.json(
    { type: 'about:blank', title, status, detail, ...extra },
    {
      status,
      headers: { 'Content-Type': 'application/problem+json', ...headers },
    },
  );

/** Returns an error response when the request lacks a valid API key. */
export const checkApiKey = (request: Request): Response | null => {
  const validKeys = parseApiKeys(process.env.RECIPE_API_KEYS);

  if (!validKeys.length) {
    return problem(
      503,
      'API disabled',
      'No API keys are configured on this server.',
    );
  }

  if (!isValidApiKey(getRequestApiKey(request.headers), validKeys)) {
    return problem(
      401,
      'Unauthorized',
      'Send a valid API key as "Authorization: Bearer <key>" or "X-API-Key: <key>".',
      undefined,
      { 'WWW-Authenticate': 'Bearer realm="smart-recipe"' },
    );
  }

  return null;
};
