'use server';
import type { FullRecipe, Recipe } from '@/types/recipe';
import type { IngestRecipe } from '@/types/ingest';
import { getClient } from './pg-client';
import { getUser } from './verify-credentials';

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

export const getAllFavoriteRecipes = async (): Promise<Recipe[]> => {
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

export const getFavoriteRecipes = async (limit?: number): Promise<Recipe[]> => {
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
      limit $2
    
    `,
    [user.email, limit ?? 9],
  );

  return result.rows;
};

export const getRecentRecipes = async (limit = 15): Promise<Recipe[]> => {
  const client = await getClient();

  const result = await client.query(
    'SELECT uuid, name, description FROM recipe order by id desc LIMIT $1',
    [limit],
  );

  return result.rows;
};

export const getRecipeById = async (id: number) => {
  const client = await getClient();

  const result = await client.query('SELECT * FROM recipe WHERE id = $1', [id]);

  return result.rows[0];
};

export const searchRecipes = async (search: string): Promise<Recipe[]> => {
  const client = await getClient();

  const result = await client.query(
    'SELECT uuid, name, description FROM recipe WHERE name ILIKE $1 limit 30',
    [`%${search}%`],
  );

  return result.rows;
};

export const getFullRecipeById = async (
  uuid: string,
): Promise<FullRecipe | null> => {
  const client = await getClient();
  const user = await getUser();

  const result = await client.query(
    `SELECT r.*, u.email is not null as is_favorite
    from recipe r
    left join user_recipe ur on r.id = ur.recipe_id
    left join users u on ur.user_id = u.id and u.email = $2
    where r.uuid = $1
    `,
    [uuid, user?.email],
  );

  const recipeId = result.rows[0].id;
  const ingredients = await client.query(
    'SELECT * FROM ingredient WHERE recipe_id = $1 ORDER BY sort',
    [recipeId],
  );
  const steps = await client.query(
    'SELECT label, section, text, sort FROM steps WHERE recipe_id = $1 ORDER BY sort asc',
    [recipeId],
  );

  if (!result?.rows.length) {
    return null;
  }

  return {
    ...result.rows[0],
    ingredients: ingredients.rows.map((row) => row.label),
    steps: steps.rows,
  };
};

export const insertRecipe = async (recipe: IngestRecipe, uuid?: string) => {
  const client = await getClient();
  let recipeId: number;

  try {
    await client.query('BEGIN');

    if (uuid) {
      const recipeResult = await client.query(
        'INSERT INTO recipe (name, description, url, primary_image, cuisine, category, keywords, uuid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [
          recipe.name,
          recipe.description,
          recipe.url,
          recipe.heroImage,
          recipe.cuisine,
          recipe.category,
          recipe.keywords,
          uuid,
        ],
      );

      recipeId = recipeResult.rows[0].id;
    } else {
      const recipeResult = await client.query(
        'INSERT INTO recipe (name, description, url, primary_image, cuisine, category, keywords) VALUES ($1, $2, $3, $4, $5, $6, $7 ) RETURNING id',
        [
          recipe.name,
          recipe.description,
          recipe.url,
          recipe.heroImage,
          recipe.cuisine,
          recipe.category,
          recipe.keywords,
        ],
      );
      recipeId = recipeResult.rows[0].id;
    }

    const ingredientsInsert = recipe.ingredients.map((ingredient, index) => {
      return client.query(
        'INSERT INTO ingredient (recipe_id, label, sort) VALUES ($1, $2, $3)',
        [recipeId, ingredient, index],
      );
    });

    console.log(recipe.steps);
    const instructionsInsert = recipe.steps.map((instruction, index) => {
      return client.query(
        'INSERT INTO steps (recipe_id, label, text, sort, section) VALUES ($1, $2, $3, $4, $5)',
        [
          recipeId,
          instruction.label ? instruction.label : instruction.text,
          instruction.text ?? '',
          index,
          instruction.section,
        ],
      );
    });

    await Promise.all([...ingredientsInsert, ...instructionsInsert]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');

    throw new Error('Error inserting recipe');
  }

  return getRecipeById(recipeId);
};

export const deleteRecipe = async (id: number) => {
  const client = await getClient();

  await client.query('DELETE FROM recipe WHERE id = $1', [id]);
};

export const insertIntoFailedIngest = async (url: string) => {
  const client = await getClient();

  await client.query('INSERT INTO failed_ingest (url) VALUES ($1)', [url]);
};
