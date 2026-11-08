import { slugify } from './slugify';

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
 * True when a stored (possibly comma-separated) category value includes
 * `category` as one of its parts, compared case-insensitively.
 */
export const hasCategory = (stored: string | null, category: string) => {
  if (!stored) return false;

  const target = category.trim().toLowerCase();

  return stored.split(',').some((part) => part.trim().toLowerCase() === target);
};

/** Pairs each category with its URL slug, dropping categories with no usable slug. */
export const toCategorySlugs = (categories: string[]) =>
  categories
    .map((name) => ({ name, slug: slugify(name) }))
    .filter((entry) => entry.slug.length > 0);

/** Resolves a category from its URL slug, or null when no category matches. */
export const findCategoryBySlug = (categories: string[], slug: string) =>
  toCategorySlugs(categories).find((entry) => entry.slug === slug)?.name ??
  null;
