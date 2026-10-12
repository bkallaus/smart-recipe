const ISO_DURATION_REGEX =
  /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;

const toPositiveMinutes = (minutes: number): number | null =>
  Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null;

/**
 * Converts a schema.org duration (ISO 8601, e.g. "PT1H30M") to minutes.
 * Plain numbers are treated as minutes. Unknown or zero durations are null.
 */
export const parseDurationMinutes = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return toPositiveMinutes(value);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (/^\d+$/.test(trimmed)) {
    return toPositiveMinutes(Number(trimmed));
  }

  const match = ISO_DURATION_REGEX.exec(trimmed);

  if (!match) {
    return null;
  }

  const [, days, hours, minutes, seconds] = match.map((part) =>
    part ? Number(part) : 0,
  );

  return toPositiveMinutes(days * 1440 + hours * 60 + minutes + seconds / 60);
};

/**
 * Picks a readable yield from schema.org recipeYield, which sites give as a
 * number, a string or a list such as ["4", "4 servings"].
 */
export const normalizeYield = (value: unknown): string => {
  const values = (Array.isArray(value) ? value : [value])
    .filter((v) => typeof v === 'string' || typeof v === 'number')
    .map((v) => String(v).trim())
    .filter(Boolean);

  return values.find((v) => /\D/.test(v)) ?? values[0] ?? '';
};

type Author = string | { name?: string };

/** Reads author names from a schema.org Person/Organization or a list of them */
export const normalizeAuthor = (value: unknown): string => {
  const authors = (Array.isArray(value) ? value : [value]) as Author[];

  return authors
    .map((author) =>
      typeof author === 'string' ? author : (author?.name ?? ''),
    )
    .map((name) => name.trim())
    .filter(Boolean)
    .join(', ');
};

/** Falls back to prep + cook when the source has no total time */
export const getTotalMinutes = (
  total: number | null,
  prep: number | null,
  cook: number | null,
): number | null => total ?? (prep && cook ? prep + cook : null);

/** Formats minutes for display, e.g. 90 → "1 hr 30 min" */
export const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!hours) {
    return `${rest} min`;
  }

  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
};
