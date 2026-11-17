'use server';
import { containsPattern } from '@/helpers/recipe-filters';
import { db } from '@/lib/db';
import { isUuid } from '@/lib/uuid';
import { recipeSchema } from '@/lib/validations/recipe';
import type { IngestRecipe } from '@/types/ingest';
import type { FullRecipe, RecipeCard } from '@/types/recipe';
import { getUser, hasAccess, requireUser } from './verify-credentials';

// Every export here is a public server action endpoint, so each one checks
// the session itself. Reads return empty results when signed out; writes throw.

const assertRecipeId = (id: unknown): number => {
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Invalid recipe id');
  }

  return id;
};

// Deliberately available signed out: the signed-out home page lists these.
export const getRecentRecipes = async (limit = 15): Promise<RecipeCard[]> => {
  const safeLimit = Math.min(Math.max(Math.trunc(Number(limit)) || 15, 1), 50);

  const recipes = await db
    .selectFrom('recipe')
    .select(['uuid', 'name', 'description'])
    .orderBy('id', 'desc')
    .limit(safeLimit)
    .execute();

  return recipes.map((r) => ({
    ...r,
    description: r.description ?? '',
  }));
};

export const searchRecipes = async (search: string): Promise<RecipeCard[]> => {
  const term = typeof search === 'string' ? search.trim() : '';

  if (!term || !(await hasAccess())) {
    return [];
  }

  const recipes = await db
    .selectFrom('recipe')
    .select(['uuid', 'name', 'description'])
    .where('name', 'ilike', containsPattern(term))
    .orderBy('name', 'asc')
    .orderBy('id', 'asc')
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

  if (!user || !isUuid(uuid)) {
    return null;
  }

  const recipe = await db
    .selectFrom('recipe as r')
    .selectAll('r')
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('users as u')
            .innerJoin('user_recipe as ur', 'u.id', 'ur.user_id')
            .whereRef('ur.recipe_id', '=', 'r.id')
            .where('u.email', '=', user.email),
        )
        .as('is_favorite'),
    )
    .where('r.uuid', '=', uuid)
    .executeTakeFirst();

  if (!recipe) {
    return null;
  }

  const recipeId = Number(recipe.id);

  const [ingredients, steps] = await Promise.all([
    db
      .selectFrom('ingredient')
      .select('label')
      .where('recipe_id', '=', recipeId)
      .orderBy('sort')
      .execute(),
    db
      .selectFrom('steps')
      .select(['label', 'section', 'text', 'sort'])
      .where('recipe_id', '=', recipeId)
      .orderBy('sort', 'asc')
      .execute(),
  ]);

  return {
    ...recipe,
    id: recipeId,
    name: recipe.name,
    description: recipe.description ?? '',
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

/**
 * Saves an ingested recipe. Called server-side by the ingest actions in
 * src/app/query.ts; still guarded because exports here are public endpoints.
 */
export const insertRecipe = async (recipe: IngestRecipe, uuid?: string) => {
  await requireUser();

  if (uuid !== undefined && !isUuid(uuid)) {
    throw new Error('Invalid recipe uuid');
  }

  const recipeId = await db.transaction().execute(async (trx) => {
    const inserted = await trx
      .insertInto('recipe')
      .values({
        name: recipe.name,
        description: recipe.description,
        url: recipe.url,
        cuisine: recipe.cuisine,
        category: recipe.category,
        keywords: recipe.keywords,
        ...(uuid ? { uuid } : {}),
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    const id = Number(inserted.id);

    if (recipe.ingredients.length > 0) {
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

    const stepsToInsert = recipe.steps
      .filter((instruction) => instruction.label || instruction.text)
      .map((instruction, index) => ({
        recipe_id: id,
        label: instruction.label ?? instruction.text ?? '',
        text: instruction.text ?? '',
        sort: index,
        section: instruction.section,
      }));

    if (stepsToInsert.length > 0) {
      await trx.insertInto('steps').values(stepsToInsert).execute();
    }

    return inserted.id;
  });

  return db
    .selectFrom('recipe')
    .selectAll()
    .where('id', '=', recipeId)
    .executeTakeFirst();
};

export const deleteRecipe = async (id: number) => {
  await requireUser();

  await db
    .deleteFrom('recipe')
    .where('id', '=', assertRecipeId(id).toString())
    .execute();
};

/** Logs a failed ingest. Called server-side by src/app/query.ts. */
export const insertIntoFailedIngest = async (url: string, error?: string) => {
  await requireUser();

  await db
    .insertInto('failed_ingest')
    .values({ url: String(url), error: error ? String(error) : null })
    .execute();
};

export const editRecipe = async (recipe: FullRecipe, id: number) => {
  await requireUser();
  const recipeId = assertRecipeId(id);

  // The form validates in the browser, but this endpoint can be called
  // directly, so validate again here. Unknown keys are stripped.
  const parsed = recipeSchema.safeParse(recipe);

  if (!parsed.success) {
    throw new Error(
      `Invalid recipe: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }

  const data = parsed.data;
  const ingredients = data.ingredients
    .map((ingredient) => ingredient.trim())
    .filter(Boolean);

  if (!ingredients.length) {
    throw new Error('Invalid recipe: at least one ingredient is required');
  }

  await db.transaction().execute(async (trx) => {
    const updated = await trx
      .updateTable('recipe')
      .set({
        name: data.name,
        description: data.description,
        url: data.url,
        cuisine: data.cuisine,
        category: data.category,
        keywords: data.keywords,
      })
      .where('id', '=', recipeId.toString())
      .executeTakeFirst();

    if (!updated.numUpdatedRows) {
      throw new Error('Recipe not found');
    }

    await trx
      .deleteFrom('ingredient')
      .where('recipe_id', '=', recipeId)
      .execute();

    await trx
      .insertInto('ingredient')
      .values(
        ingredients.map((label, index) => ({
          recipe_id: recipeId,
          label,
          sort: index,
        })),
      )
      .execute();

    await trx.deleteFrom('steps').where('recipe_id', '=', recipeId).execute();

    await trx
      .insertInto('steps')
      .values(
        data.steps.map((step, index) => ({
          recipe_id: recipeId,
          label: step.label,
          text: step.text,
          sort: index,
          section: step.section?.trim() || null,
        })),
      )
      .execute();
  });
};
