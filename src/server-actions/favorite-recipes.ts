'use server';
import { db } from '@/lib/db';
import type { RecipeCard } from '@/types/recipe';
import { getUser } from './verify-credentials';

const addAsFavorite = async (uuid: string, email: string) => {
  await db
    .insertInto('user_recipe')
    .values((eb) => ({
      recipe_id: eb.selectFrom('recipe').select('id').where('uuid', '=', uuid),
      user_id: eb.selectFrom('users').select('id').where('email', '=', email),
    }))
    .execute();
};

const removeAsFavorite = async (recipeId: number, userId: number) => {
  await db
    .deleteFrom('user_recipe')
    .where('recipe_id', '=', recipeId.toString())
    .where('user_id', '=', userId.toString())
    .execute();
};

export const toggleFavoriteRecipe = async (uuid: string) => {
  const user = await getUser();

  if (!user?.email) {
    return;
  }

  const item = await db
    .selectFrom('user_recipe')
    .select(['user_id', 'recipe_id'])
    .where('recipe_id', '=', (eb) =>
      eb.selectFrom('recipe').select('id').where('uuid', '=', uuid),
    )
    .where('user_id', '=', (eb) =>
      eb.selectFrom('users').select('id').where('email', '=', user.email),
    )
    .executeTakeFirst();

  if (item) {
    await removeAsFavorite(Number(item.recipe_id), Number(item.user_id));
  } else {
    await addAsFavorite(uuid, user.email);
  }
};

export const getAllFavoriteRecipes = async (): Promise<RecipeCard[]> => {
  const user = await getUser();

  if (!user?.email) {
    return [];
  }

  const recipes = await db
    .selectFrom('recipe as r')
    .innerJoin('user_recipe as ur', 'r.id', 'ur.recipe_id')
    .innerJoin('users as u', 'ur.user_id', 'u.id')
    .select(['r.uuid', 'r.name', 'r.description'])
    .where('u.email', '=', user.email)
    .execute();

  return recipes.map((r) => ({
    ...r,
    description: r.description ?? '',
  }));
};

export const getFavoriteRecipes = async (
  limit?: number,
): Promise<RecipeCard[]> => {
  const user = await getUser();

  if (!user?.email) {
    return [];
  }

  const recipes = await db
    .selectFrom('recipe as r')
    .innerJoin('user_recipe as ur', 'r.id', 'ur.recipe_id')
    .innerJoin('users as u', 'ur.user_id', 'u.id')
    .select(['r.uuid', 'r.name', 'r.description'])
    .where('u.email', '=', user.email)
    .orderBy('r.id', 'desc')
    .limit(limit ?? 9)
    .execute();

  return recipes.map((r) => ({
    ...r,
    description: r.description ?? '',
  }));
};
