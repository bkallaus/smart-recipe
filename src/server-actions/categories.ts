'use server';
import { cache } from 'react';
import {
  containsPattern,
  findCategoryBySlug,
  hasCategory,
  splitFilterValues,
} from '@/helpers/recipe-filters';
import { db } from '@/lib/db';
import type { RecipeCard } from '@/types/recipe';

export const getRecipeCategories = cache(async (): Promise<string[]> => {
  const rows = await db
    .selectFrom('recipe')
    .select('category')
    .where('category', 'is not', null)
    .execute();

  return splitFilterValues(rows.map((r) => r.category));
});

export type CategoryRecipes = {
  category: string;
  recipes: RecipeCard[];
};

/** Returns null when no category matches the slug. */
export const getCategoryRecipes = async (
  slug: string,
): Promise<CategoryRecipes | null> => {
  const category = findCategoryBySlug(await getRecipeCategories(), slug);

  if (!category) {
    return null;
  }

  const rows = await db
    .selectFrom('recipe')
    .select(['uuid', 'name', 'description', 'category'])
    .where('category', 'ilike', containsPattern(category))
    .orderBy('name')
    .execute();

  // ILIKE is a substring match ("Cake" hits "Cheesecake"); keep exact values only.
  const recipes = rows
    .filter((r) => hasCategory(r.category, category))
    .map(({ uuid, name, description }) => ({
      uuid,
      name,
      description: description ?? '',
    }));

  return { category, recipes };
};
