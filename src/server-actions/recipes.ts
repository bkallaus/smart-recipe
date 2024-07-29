'use server';
import type { FullRecipe, Recipe } from '@/types/recipe';
import { getClient } from './pg-client';

export const getRecentRecipes = async (limit = 15): Promise<Recipe[]> => {
  const client = await getClient();

  const result = await client.query(
    'SELECT id, name, description FROM recipe order by id desc LIMIT $1',
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
    'SELECT id, name, description FROM recipe WHERE name ILIKE $1 limit 30',
    [`%${search}%`],
  );

  return result.rows;
};

export const getFullRecipeById = async (
  id: number,
): Promise<FullRecipe | null> => {
  const client = await getClient();

  const result = await client.query('SELECT * FROM recipe WHERE id = $1', [id]);
  const ingredients = await client.query(
    'SELECT * FROM ingredient WHERE recipe_id = $1 ORDER BY sort',
    [id],
  );
  const steps = await client.query(
    'SELECT * FROM steps WHERE recipe_id = $1 ORDER BY sort',
    [id],
  );

  if (!result?.rows.length) {
    return null;
  }

  return {
    ...result.rows[0],
    ingredients: ingredients.rows.map((row) => row.label),
    steps: steps.rows.map((row) => row.label),
  };
};

export const insertRecipe = async (recipe: IngestRecipe) => {
  const client = await getClient();
  let recipeId: number;

  try {
    await client.query('BEGIN');

    const recipeResult = await client.query(
      'INSERT INTO recipe (name, description, url, primary_image) VALUES ($1, $2, $3, $4) RETURNING id',
      [recipe.name, recipe.description, recipe.url, recipe.heroImage],
    );

    recipeId = recipeResult.rows[0].id;

    const ingredientsInsert = recipe.ingredients.map((ingredient, index) => {
      return client.query(
        'INSERT INTO ingredient (recipe_id, label, sort) VALUES ($1, $2, $3)',
        [recipeId, ingredient, index],
      );
    });

    const instructionsInsert = recipe.steps.map((step, index) => {
      return client.query(
        'INSERT INTO steps (recipe_id, label, sort) VALUES ($1, $2, $3)',
        [recipeId, step, index],
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
