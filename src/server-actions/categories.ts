'use server';
import {
  containsPattern,
  hasCategory,
  splitFilterValues,
} from '@/helpers/recipe-filters';
import { db } from '@/lib/db';
import type { RecipeCard } from '@/types/recipe';

export const getRecipeCategories = async (): Promise<string[]> => {
  const rows = await db
    .selectFrom('recipe')
    .select('category')
    .where('category', 'is not', null)
    .execute();

  return splitFilterValues(rows.map((r) => r.category));
};

export const getRecipesInCategory = async (
  category: string,
): Promise<RecipeCard[]> => {
  // ILIKE narrows rows in the database; hasCategory then matches whole
  // comma-separated parts so "Main" does not match "Main Course".
  const rows = await db
    .selectFrom('recipe')
    .select(['uuid', 'name', 'description', 'category'])
    .where('category', 'ilike', containsPattern(category))
    .orderBy('id', 'desc')
    .execute();

  return rows
    .filter((r) => hasCategory(r.category, category))
    .map((r) => ({
      uuid: r.uuid,
      name: r.name,
      description: r.description ?? '',
    }));
};
