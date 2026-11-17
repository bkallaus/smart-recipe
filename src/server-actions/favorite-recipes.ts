'use server';
import { db } from '@/lib/db';
import { upsertUserRow } from '@/lib/users';
import { isUuid } from '@/lib/uuid';
import type { RecipeCard } from '@/types/recipe';
import { getUser, requireUser } from './verify-credentials';

/**
 * Adds the recipe to the signed-in user's favorites, or removes it when it is
 * already there. Returns the new favorite state, or null when no recipe has
 * that uuid. Safe to call twice concurrently: adding never conflicts.
 */
export const toggleFavoriteRecipe = async (
  uuid: string,
): Promise<boolean | null> => {
  const user = await requireUser();

  if (!isUuid(uuid)) {
    return null;
  }

  const [recipe, userId] = await Promise.all([
    db
      .selectFrom('recipe')
      .select('id')
      .where('uuid', '=', uuid)
      .executeTakeFirst(),
    // Sign-in creates the row; upserting here also covers a row that has
    // since been removed, so the insert below never sees a NULL user_id.
    upsertUserRow(user),
  ]);

  if (!recipe) {
    return null;
  }

  const removed = await db
    .deleteFrom('user_recipe')
    .where('recipe_id', '=', recipe.id)
    .where('user_id', '=', userId)
    .executeTakeFirst();

  if (Number(removed.numDeletedRows) > 0) {
    return false;
  }

  await db
    .insertInto('user_recipe')
    .values({ recipe_id: recipe.id, user_id: userId })
    .onConflict((oc) => oc.columns(['user_id', 'recipe_id']).doNothing())
    .execute();

  return true;
};

export const getAllFavoriteRecipes = async (): Promise<RecipeCard[]> => {
  const user = await getUser();

  if (!user) {
    return [];
  }

  const recipes = await db
    .selectFrom('recipe as r')
    .innerJoin('user_recipe as ur', 'r.id', 'ur.recipe_id')
    .innerJoin('users as u', 'ur.user_id', 'u.id')
    .select(['r.uuid', 'r.name', 'r.description'])
    .where('u.email', '=', user.email)
    .orderBy('r.name', 'asc')
    .execute();

  return recipes.map((r) => ({
    ...r,
    description: r.description ?? '',
  }));
};
