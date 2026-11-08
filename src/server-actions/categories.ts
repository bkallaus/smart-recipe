'use server';
import {
  containsPattern,
  hasFilterValue,
  splitFilterValues,
} from '@/helpers/recipe-filters';
import { slugify } from '@/helpers/slugify';
import { db } from '@/lib/db';
import type { RecipeCard, RecipeCategory } from '@/types/recipe';

/** Lists every distinct recipe category, sorted by name, with a URL slug. */
export const getRecipeCategories = async (): Promise<RecipeCategory[]> => {
  const rows = await db
    .selectFrom('recipe')
    .select('category')
    .where('category', 'is not', null)
    .execute();

  const categories: RecipeCategory[] = [];
  const seenSlugs = new Set<string>();

  for (const name of splitFilterValues(rows.map((r) => r.category))) {
    const slug = slugify(name);
    // Names with no URL-safe characters, or that collide with an earlier
    // name's slug, can't be linked to unambiguously.
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);
    categories.push({ name, slug });
  }

  return categories;
};

/**
 * Resolves a category slug and returns the recipes in it, or null when no
 * category matches the slug.
 */
export const getCategoryRecipes = async (
  slug: string,
): Promise<{ category: RecipeCategory; recipes: RecipeCard[] } | null> => {
  const categories = await getRecipeCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return null;
  }

  // ILIKE narrows the rows in SQL; hasFilterValue then keeps only exact
  // entries so "Pie" doesn't pull in recipes categorised as "Pies".
  const rows = await db
    .selectFrom('recipe')
    .select(['uuid', 'name', 'description', 'category'])
    .where('category', 'ilike', containsPattern(category.name))
    .orderBy('name', 'asc')
    .execute();

  const recipes: RecipeCard[] = [];
  for (const r of rows) {
    if (hasFilterValue(r.category, category.name)) {
      recipes.push({
        uuid: r.uuid,
        name: r.name,
        description: r.description ?? '',
      });
    }
  }

  return { category, recipes };
};
