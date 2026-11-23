import { z } from 'zod';

// These are sanity caps, not editorial limits. Imported recipes routinely carry
// long descriptions (the import prompt prepends yield/prep/cook times) and long
// scraped steps, and the edit form must accept anything the app itself stored.
export const RECIPE_LIMITS = {
  name: 500,
  description: 20_000,
  shortField: 500,
  keywords: 5_000,
  url: 2_048,
  ingredient: 2_000,
  stepLabel: 5_000,
  stepText: 20_000,
  stepSection: 500,
} as const;

export const stepSchema = z
  .object({
    label: z.string().trim().max(RECIPE_LIMITS.stepLabel),
    text: z.string().trim().max(RECIPE_LIMITS.stepText),
    section: z.string().trim().max(RECIPE_LIMITS.stepSection).optional(),
    sort: z.number(),
  })
  // The recipe page renders `text || label`, so a step only needs one of them.
  .refine((step) => step.label.length > 0 || step.text.length > 0, {
    message: 'Add a heading or instructions for this step',
    path: ['text'],
  });

export const recipeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Recipe name is required')
    .max(RECIPE_LIMITS.name),
  description: z.string().trim().max(RECIPE_LIMITS.description),
  category: z.string().trim().max(RECIPE_LIMITS.shortField),
  cuisine: z.string().trim().max(RECIPE_LIMITS.shortField),
  keywords: z.string().trim().max(RECIPE_LIMITS.keywords),
  url: z
    .string()
    .trim()
    .max(RECIPE_LIMITS.url)
    .pipe(z.union([z.literal(''), z.url('Invalid URL')])),
  ingredients: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Ingredient cannot be blank')
        .max(RECIPE_LIMITS.ingredient),
    )
    .min(1, 'At least one ingredient is required'),
  steps: z.array(stepSchema).min(1, 'At least one step is required'),
});

export type RecipeSchema = z.infer<typeof recipeSchema>;

/**
 * Form-side shape. react-hook-form's useFieldArray only tracks arrays of
 * objects, so ingredients are edited as `{ value }` rows and converted back to
 * the `string[]` the server action expects with `toRecipeSchema`.
 */
export const recipeFormSchema = recipeSchema.extend({
  ingredients: z
    .array(z.object({ value: recipeSchema.shape.ingredients.element }))
    .min(1, 'At least one ingredient is required'),
});

export type RecipeFormInput = z.input<typeof recipeFormSchema>;
export type RecipeFormValues = z.output<typeof recipeFormSchema>;

export const toRecipeFormInput = (recipe: RecipeSchema): RecipeFormInput => ({
  ...recipe,
  ingredients: recipe.ingredients.map((value) => ({ value })),
  steps: recipe.steps.map((step) => ({ ...step, section: step.section ?? '' })),
});

/** Converts submitted form values back, renumbering steps in their on-screen order. */
export const toRecipeSchema = (values: RecipeFormValues): RecipeSchema => ({
  ...values,
  ingredients: values.ingredients.map((ingredient) => ingredient.value),
  steps: values.steps.map((step, index) => ({
    ...step,
    section: step.section || undefined,
    sort: index,
  })),
});
