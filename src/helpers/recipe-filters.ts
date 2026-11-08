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

/** URL slug for a category name ("Main Course" -> "main-course"). */
export const categorySlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/** Finds the category whose slug matches, or undefined. */
export const findCategoryBySlug = (categories: string[], slug: string) =>
  categories.find((c) => categorySlug(c) === slug);

/** True when a stored comma-separated category string contains `category` exactly (case-insensitive). */
export const hasCategory = (stored: string | null, category: string) => {
  if (!stored) return false;
  const target = category.trim().toLowerCase();
  return stored.split(',').some((part) => part.trim().toLowerCase() === target);
};
