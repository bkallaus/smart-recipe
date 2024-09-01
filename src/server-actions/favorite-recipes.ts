'use server';
import type { RecipeCard } from '@/types/recipe';
import { getClient } from './pg-client';
import { getUser } from './verify-credentials';

const addAsFavorite = async (uuid: string, email: string) => {
  const client = await getClient();

  await client.query(
    'INSERT INTO user_recipe (recipe_id, user_id) VALUES ((select id from recipe where uuid = $1), (select id from users where email = $2))',
    [uuid, email],
  );
};

const removeAsFavorite = async (recipeId: number, userId: number) => {
  const client = await getClient();

  await client.query(
    'DELETE FROM user_recipe WHERE recipe_id = $1 AND user_id = $2',
    [recipeId, userId],
  );
};

export const toggleFavoriteRecipe = async (uuid: string) => {
  const client = await getClient();
  const user = await getUser();

  if (!user?.email) {
    return;
  }

  const result = await client.query(
    'SELECT user_id, recipe_id FROM user_recipe WHERE recipe_id = (select id from recipe where uuid = $1) AND user_id = (select id from users where email = $2)',
    [uuid, user.email],
  );

  const item = result.rows?.[0];
  const userId = item?.user_id;
  const recipeId = item?.recipe_id;

  if (userId) {
    await removeAsFavorite(recipeId, userId);
  } else {
    await addAsFavorite(uuid, user?.email);
  }
};

export const getAllFavoriteRecipes = async (): Promise<RecipeCard[]> => {
  const client = await getClient();
  const user = await getUser();

  if (!user?.email) {
    return [];
  }

  const result = await client.query(
    `
        select r.uuid, r.name, r.description
        from recipe r
        join user_recipe ur on r.id = ur.recipe_id
        join users u on ur.user_id = u.id
        where u.email = $1
      
      `,
    [user.email],
  );

  return result.rows;
};

export const getFavoriteRecipes = async (
  limit?: number,
): Promise<RecipeCard[]> => {
  const client = await getClient();
  const user = await getUser();

  if (!user?.email) {
    return [];
  }

  const result = await client.query(
    `
        select r.uuid, r.name, r.description
        from recipe r
        join user_recipe ur on r.id = ur.recipe_id
        join users u on ur.user_id = u.id
        where u.email = $1
        order by r.id desc
        limit $2
      
      `,
    [user.email, limit ?? 9],
  );

  return result.rows;
};
