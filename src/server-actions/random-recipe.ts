'use server';
import { sql } from 'kysely';
import { containsPattern, splitFilterValues } from '@/helpers/recipe-filters';
import { db } from '@/lib/db';
import type {
  RandomRecipeFilterOptions,
  RandomRecipeFilters,
  RecipeCard,
} from '@/types/recipe';
import { getUser, hasAccess } from './verify-credentials';

/**
 * True when the comma-separated column holds `value` as one whole entry,
 * case-insensitively, matching `hasFilterValue` so "Pie" skips "Pies".
 */
const hasEntry = (column: 'r.category' | 'r.cuisine', value: string) =>
  sql<boolean>`exists (
    select 1 from unnest(string_to_array(${sql.ref(column)}, ',')) as entry
    where lower(btrim(entry)) = lower(${value})
  )`;

export const getRandomRecipeFilterOptions =
  async (): Promise<RandomRecipeFilterOptions> => {
    if (!(await hasAccess())) {
      return { categories: [], cuisines: [] };
    }

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

const asTrimmed = (value: unknown) =>
  typeof value === 'string' ? value.trim() : undefined;

/**
 * Picks a random recipe matching the filters. When `excludeUuid` is given
 * (the previous pick), another match is preferred so "pick again" changes
 * the result whenever more than one recipe matches.
 */
export const pickRandomRecipe = async (
  filters: RandomRecipeFilters,
  excludeUuid?: string,
): Promise<RecipeCard | null> => {
  const user = await getUser();

  if (!user || !filters || typeof filters !== 'object') {
    return null;
  }

  const category = asTrimmed(filters.category);
  const cuisine = asTrimmed(filters.cuisine);
  const ingredient = asTrimmed(filters.ingredient);

  let query = db
    .selectFrom('recipe as r')
    .select(['r.uuid', 'r.name', 'r.description']);

  if (category) {
    // ILIKE is a cheap pre-filter; hasEntry keeps only whole entries.
    query = query
      .where('r.category', 'ilike', containsPattern(category))
      .where(hasEntry('r.category', category));
  }

  if (cuisine) {
    query = query
      .where('r.cuisine', 'ilike', containsPattern(cuisine))
      .where(hasEntry('r.cuisine', cuisine));
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

  if (filters.favoritesOnly === true) {
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
