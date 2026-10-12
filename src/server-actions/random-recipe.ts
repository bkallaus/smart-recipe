'use server';
import { sql } from 'kysely';
import { containsPattern, splitFilterValues } from '@/helpers/recipe-filters';
import { db } from '@/lib/db';
import type {
  RandomRecipeFilterOptions,
  RandomRecipeFilters,
  RecipeCard,
} from '@/types/recipe';
import { getUser } from './verify-credentials';

export const getRandomRecipeFilterOptions =
  async (): Promise<RandomRecipeFilterOptions> => {
    const rows = await db
      .selectFrom('recipe')
      .select(['category', 'cuisine'])
      .where((eb) =>
        eb.or([eb('category', 'is not', null), eb('cuisine', 'is not', null)]),
      )
      .execute();

    return {
      categories: splitFilterValues(rows.map((r) => r.category)),
      cuisines: splitFilterValues(rows.map((r) => r.cuisine)),
    };
  };

/**
 * Picks a random recipe matching the filters. When `excludeUuid` is given
 * (the previous pick), another match is preferred so "pick again" changes
 * the result whenever more than one recipe matches.
 */
export const pickRandomRecipe = async (
  filters: RandomRecipeFilters,
  excludeUuid?: string,
): Promise<RecipeCard | null> => {
  const category = filters.category?.trim();
  const cuisine = filters.cuisine?.trim();
  const ingredient = filters.ingredient?.trim();

  let query = db
    .selectFrom('recipe as r')
    .select(['r.uuid', 'r.name', 'r.description']);

  if (category) {
    query = query.where('r.category', 'ilike', containsPattern(category));
  }

  if (cuisine) {
    query = query.where('r.cuisine', 'ilike', containsPattern(cuisine));
  }

  if (ingredient) {
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('ingredient as i')
          .select('i.id')
          .whereRef('i.recipe_id', '=', 'r.id')
          .where('i.label', 'ilike', containsPattern(ingredient)),
      ),
    );
  }

  if (filters.favoritesOnly) {
    const user = await getUser();

    if (!user?.email) {
      return null;
    }

    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('user_recipe as ur')
          .innerJoin('users as u', 'ur.user_id', 'u.id')
          .select('ur.recipe_id')
          .whereRef('ur.recipe_id', '=', 'r.id')
          .where('u.email', '=', user.email),
      ),
    );
  }

  const recipes = await query.orderBy(sql`random()`).limit(2).execute();

  const pick = recipes.find((r) => r.uuid !== excludeUuid) ?? recipes[0];

  if (!pick) {
    return null;
  }

  return { ...pick, description: pick.description ?? '' };
};
