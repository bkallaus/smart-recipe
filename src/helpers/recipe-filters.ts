/**
 * Turns stored category/cuisine strings (which may hold several
 * comma-separated values, e.g. "Dessert, Snack") into a sorted list of
 * unique options, deduplicated case-insensitively.
 */
export const splitFilterValues = (values: (string | null)[]): string[] => {
  const unique = new Map<string, string>();

  for (const value of values) {
    if (!value) continue;

    for (const part of value.split(',')) {
      const trimmed = part.trim();
      const key = trimmed.toLowerCase();
      if (trimmed && !unique.has(key)) {
        unique.set(key, trimmed);
      }
    }
  }

  return [...unique.values()].toSorted((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
};

const LIKE_SPECIAL_CHARS = /[\\%_]/g;

/** Builds an ILIKE pattern that matches `value` literally anywhere in a column. */
export const containsPattern = (value: string) =>
  `%${value.replace(LIKE_SPECIAL_CHARS, '\\$&')}%`;

/**
 * True when a stored category/cuisine string (possibly comma-separated)
 * contains `value` as one whole entry, compared case-insensitively.
 * Unlike `containsPattern`, "Pie" does not match "Pies".
 */
export const hasFilterValue = (stored: string | null, value: string) => {
  const key = value.trim().toLowerCase();
  if (!stored || !key) return false;

  return stored.split(',').some((part) => part.trim().toLowerCase() === key);
};
