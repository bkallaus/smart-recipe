import 'server-only';
import { db } from '@/lib/db';
import type { IngestRecipe } from '@/types/ingest';

export const findRecipeSource = async (uuid: string) =>
  db
    .selectFrom('recipe')
    .select(['id', 'url'])
    .where('uuid', '=', uuid)
    .executeTakeFirst();

/**
 * Replaces a recipe's scraped content in one transaction, keeping its id,
 * uuid, url and favorites, so links and other users' favorites survive a
 * rescan. Nothing changes if any statement fails.
 */
export const replaceRecipeContent = async (
  id: string,
  recipe: IngestRecipe,
) => {
  const recipeId = Number(id);

  await db.transaction().execute(async (trx) => {
    const updated = await trx
      .updateTable('recipe')
      .set({
        name: recipe.name,
        description: recipe.description,
        cuisine: recipe.cuisine,
        category: recipe.category,
        keywords: recipe.keywords,
      })
      .where('id', '=', id)
      .executeTakeFirst();

    if (!updated.numUpdatedRows) {
      throw new Error('Recipe not found');
    }

    await trx
      .deleteFrom('ingredient')
      .where('recipe_id', '=', recipeId)
      .execute();
    await trx.deleteFrom('steps').where('recipe_id', '=', recipeId).execute();

    if (recipe.ingredients.length) {
      await trx
        .insertInto('ingredient')
        .values(
          recipe.ingredients.map((label, index) => ({
            recipe_id: recipeId,
            label,
            sort: index,
          })),
        )
        .execute();
    }

    const steps = recipe.steps
      .filter((step) => step.label || step.text)
      .map((step, index) => ({
        recipe_id: recipeId,
        label: step.label || step.text || '',
        text: step.text ?? '',
        sort: index,
        section: step.section ?? null,
      }));

    if (steps.length) {
      await trx.insertInto('steps').values(steps).execute();
    }
  });
};
