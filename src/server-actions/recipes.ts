'use server';
import type { FullRecipe, RecipeCard } from '@/types/recipe';
import type { IngestRecipe } from '@/types/ingest';
import { getClient } from './pg-client';
import { getUser } from './verify-credentials';

export const getRecentRecipes = async (limit = 15): Promise<RecipeCard[]> => {
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

export const searchRecipes = async (search: string): Promise<RecipeCard[]> => {
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

    // Convert arrays to comma-separated strings for database compatibility
    const cuisine = recipe.cuisine.join(', ');
    const category = recipe.category.join(', ');
    const keywords = recipe.keywords.join(', ');

    // TODO: Add support for saving prepTime, cookTime, totalTime, recipeYield to the database
    // The fields are available in the 'recipe' object:
    // recipe.prepTime
    // recipe.cookTime
    // recipe.totalTime
    // recipe.recipeYield

    if (uuid) {
      const recipeResult = await client.query(
        'INSERT INTO recipe (name, description, url, primary_image, cuisine, category, keywords, uuid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [
          recipe.name,
          recipe.description,
          recipe.url,
          recipe.heroImage,
          cuisine,
          category,
          keywords,
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
          cuisine,
          category,
          keywords,
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

    const instructionsInsert = recipe.steps
      .filter((instruction) => instruction.label || instruction.text)
      .map((instruction, index) => {
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

export const editRecipe = async (recipe: FullRecipe, id: number) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE recipe SET name = $1, description = $2, url = $3, primary_image = $4, cuisine = $5, category = $6, keywords = $7 WHERE id = $8',
      [
        recipe.name,
        recipe.description,
        recipe.url,
        recipe.primary_image,
        recipe.cuisine,
        recipe.category,
        recipe.keywords,
        id,
      ],
    );

    if (recipe.ingredients.length) {
      await client.query('DELETE FROM ingredient WHERE recipe_id = $1', [id]);

      const ingredientsInsert = recipe.ingredients.map((ingredient, index) => {
        return client.query(
          'INSERT INTO ingredient (recipe_id, label, sort) VALUES ($1, $2, $3)',
          [id, ingredient, index],
        );
      });
      await Promise.all(ingredientsInsert);
    }

    if (recipe.steps.length) {
      await client.query('DELETE FROM steps WHERE recipe_id = $1', [id]);
      const stepsInsert = recipe.steps.map((step, index) => {
        return client.query(
          'INSERT INTO steps (recipe_id, label, text, sort, section) VALUES ($1, $2, $3, $4, $5)',
          [id, step.label, step.text, index, step.section],
        );
      });

      await Promise.all(stepsInsert);
    }
  } catch (e) {
    await client.query('ROLLBACK');

    throw new Error('Error updating recipe');
  } finally {
    await client.query('COMMIT');
  }
};
