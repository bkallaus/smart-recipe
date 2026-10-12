import 'server-only';
import { containsPattern } from '@/helpers/recipe-filters';
import { db } from '@/lib/db';
import type { RecipeCard } from '@/types/recipe';

export const listRecipes = async ({
  query,
  limit,
  offset,
}: {
  query?: string;
  limit: number;
  offset: number;
}): Promise<RecipeCard[]> => {
  let select = db
    .selectFrom('recipe')
    .select(['uuid', 'name', 'description'])
    .orderBy('id', 'desc')
    .limit(limit)
    .offset(offset);

  if (query) {
    select = select.where('name', 'ilike', containsPattern(query));
  }

  const recipes = await select.execute();

  return recipes.map((r) => ({ ...r, description: r.description ?? '' }));
};
