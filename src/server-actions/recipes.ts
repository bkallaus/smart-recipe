'use server';
import { db } from '@/lib/db';
import type { IngestRecipe } from '@/types/ingest';
import type { FullRecipe, RecipeCard } from '@/types/recipe';
import { getUser } from './verify-credentials';

export const getRecentRecipes = async (limit = 15): Promise<RecipeCard[]> => {
  const recipes = await db
    .selectFrom('recipe')
    .select(['uuid', 'name', 'description'])
    .orderBy('id', 'desc')
    .limit(limit)
    .execute();

  return recipes.map((r) => ({
    ...r,
    description: r.description ?? '',
  }));
};

export const getRecipeById = async (id: number) => {
  return await db
    .selectFrom('recipe')
    .selectAll()
    .where('id', '=', id.toString())
    .executeTakeFirst();
};

export const searchRecipes = async (search: string): Promise<RecipeCard[]> => {
  const recipes = await db
    .selectFrom('recipe')
    .select(['uuid', 'name', 'description'])
    .where('name', 'ilike', `%${search}%`)
    .limit(30)
    .execute();

  return recipes.map((r) => ({
    ...r,
    description: r.description ?? '',
  }));
};

export const getFullRecipeById = async (
  uuid: string,
): Promise<FullRecipe | null> => {
  const user = await getUser();

  const recipe = await db
    .selectFrom('recipe as r')
    .selectAll('r')
    .select((eb) =>
      eb
        .case()
        .when(
          eb.exists(
            eb
              .selectFrom('users as u')
              .innerJoin('user_recipe as ur', 'u.id', 'ur.user_id')
              .whereRef('ur.recipe_id', '=', 'r.id')
              .where('u.email', '=', user?.email ?? ''),
          ),
        )
        .then(true)
        .else(false)
        .end()
        .as('is_favorite'),
    )
    .where('r.uuid', '=', uuid)
    .executeTakeFirst();

  if (!recipe) {
    return null;
  }

  const recipeId = recipe.id;

  const ingredients = await db
    .selectFrom('ingredient')
    .selectAll()
    .where('recipe_id', '=', Number(recipeId))
    .orderBy('sort')
    .execute();

  const steps = await db
    .selectFrom('steps')
    .select(['label', 'section', 'text', 'sort'])
    .where('recipe_id', '=', Number(recipeId))
    .orderBy('sort', 'asc')
    .execute();

  return {
    ...recipe,
    id: Number(recipe.id),
    name: recipe.name,
    description: recipe.description ?? '',
    primary_image: recipe.primary_image ?? '',
    keywords: recipe.keywords ?? '',
    category: recipe.category ?? '',
    cuisine: recipe.cuisine ?? '',
    url: recipe.url ?? '',
    is_favorite: !!recipe.is_favorite,
    ingredients: ingredients.map((row) => row.label),
    steps: steps.map((s) => ({
      ...s,
      text: s.text ?? '',
      section: s.section ?? undefined,
    })),
  };
};

export const insertRecipe = async (recipe: IngestRecipe, uuid?: string) => {
  const result = await db.transaction().execute(async (trx) => {
    let recipeId: string; // Kysely returns string for Int8

    if (uuid) {
      const inserted = await trx
        .insertInto('recipe')
        .values({
          name: recipe.name,
          description: recipe.description,
          url: recipe.url,
          primary_image: recipe.heroImage,
          cuisine: recipe.cuisine,
          category: recipe.category,
          keywords: recipe.keywords,
          uuid,
        })
        .returning('id')
        .executeTakeFirstOrThrow();
      recipeId = inserted.id;
    } else {
      const inserted = await trx
        .insertInto('recipe')
        .values({
          name: recipe.name,
          description: recipe.description,
          url: recipe.url,
          primary_image: recipe.heroImage,
          cuisine: recipe.cuisine,
          category: recipe.category,
          keywords: recipe.keywords,
        })
        .returning('id')
        .executeTakeFirstOrThrow();
      recipeId = inserted.id;
    }

    if (recipe.ingredients.length > 0) {
      await trx
        .insertInto('ingredient')
        .values(
          recipe.ingredients.map((ingredient, index) => ({
            recipe_id: Number(recipeId),
            label: ingredient,
            sort: index,
          })),
        )
        .execute();
    }

    const stepsToInsert = recipe.steps
      .filter((instruction) => instruction.label || instruction.text)
      .map((instruction, index) => ({
        recipe_id: Number(recipeId),
        label: instruction.label ?? instruction.text ?? '',
        text: instruction.text ?? '',
        sort: index,
        section: instruction.section,
      }));

    if (stepsToInsert.length > 0) {
      await trx.insertInto('steps').values(stepsToInsert).execute();
    }

    return recipeId;
  });

  return getRecipeById(Number(result));
};

export const deleteRecipe = async (id: number) => {
  await db
    .deleteFrom('recipe')
    .where('id', '=', id.toString())
    .execute();
};

export const insertIntoFailedIngest = async (url: string) => {
  await db.insertInto('failed_ingest').values({ url }).execute();
};

export const editRecipe = async (recipe: FullRecipe, id: number) => {
  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('recipe')
      .set({
        name: recipe.name,
        description: recipe.description,
        url: recipe.url,
        primary_image: recipe.primary_image,
        cuisine: recipe.cuisine,
        category: recipe.category,
        keywords: recipe.keywords,
      })
      .where('id', '=', id.toString())
      .execute();

    if (recipe.ingredients.length) {
      await trx
        .deleteFrom('ingredient')
        .where('recipe_id', '=', id)
        .execute();

      await trx
        .insertInto('ingredient')
        .values(
          recipe.ingredients.map((ingredient, index) => ({
            recipe_id: id,
            label: ingredient,
            sort: index,
          })),
        )
        .execute();
    }

    if (recipe.steps.length) {
      await trx.deleteFrom('steps').where('recipe_id', '=', id).execute();

      const stepsInsert = recipe.steps.map((step, index) => ({
        recipe_id: id,
        label: step.label,
        text: step.text,
        sort: index,
        section: step.section,
      }));

      await trx.insertInto('steps').values(stepsInsert).execute();
    }
  });
};
