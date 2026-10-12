import { z } from 'zod';
import type { FullRecipe, RecipeCard } from '@/types/recipe';

const SCHEMA_ORG = 'https://schema.org';

const stringOrList = z.union([z.string(), z.array(z.string())]);

const howToStep = z.object({
  '@type': z.literal('HowToStep').optional(),
  name: z.string().optional(),
  text: z.string().min(1),
  position: z.number().optional(),
});

const howToSection = z.object({
  '@type': z.literal('HowToSection').optional(),
  name: z.string().min(1),
  itemListElement: z.array(z.union([z.string().min(1), howToStep])).min(1),
});

/**
 * The subset of a schema.org Recipe (https://schema.org/Recipe) that the
 * API accepts. Unknown properties are ignored.
 */
export const schemaOrgRecipeInput = z.object({
  '@context': z.unknown().optional(),
  '@type': z.union([
    z.literal('Recipe'),
    z
      .array(z.string())
      .refine((types) => types.includes('Recipe'), 'must include "Recipe"'),
  ]),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  image: z
    .union([z.string(), z.array(z.string()), z.object({ url: z.string() })])
    .optional(),
  url: z.string().optional(),
  isBasedOn: z.string().optional(),
  recipeCategory: stringOrList.optional(),
  recipeCuisine: stringOrList.optional(),
  keywords: stringOrList.optional(),
  recipeIngredient: z.array(z.string().min(1)).min(1),
  recipeInstructions: z.union([
    z.string().min(1),
    z.array(z.union([z.string().min(1), howToStep, howToSection])).min(1),
  ]),
});

export type SchemaOrgRecipeInput = z.infer<typeof schemaOrgRecipeInput>;

export const recipePageUrl = (origin: string, uuid: string) =>
  `${origin}/recipe/${uuid}`;

const splitList = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

type HowToSection = {
  '@type': 'HowToSection';
  name: string;
  itemListElement: unknown[];
};

const toInstructions = (steps: FullRecipe['steps']) => {
  const instructions: unknown[] = [];
  let currentSection = null as HowToSection | null;

  for (const step of steps) {
    const howToStep = {
      '@type': 'HowToStep',
      ...(step.label && step.label !== step.text ? { name: step.label } : {}),
      text: step.text || step.label,
    };

    if (!step.section) {
      currentSection = null;
      instructions.push(howToStep);
      continue;
    }

    if (currentSection?.name !== step.section) {
      currentSection = {
        '@type': 'HowToSection',
        name: step.section,
        itemListElement: [],
      };
      instructions.push(currentSection);
    }

    currentSection.itemListElement.push(howToStep);
  }

  return instructions;
};

/** Renders a stored recipe as schema.org Recipe JSON-LD. */
export const toSchemaOrgRecipe = (recipe: FullRecipe, origin: string) => {
  const url = recipePageUrl(origin, recipe.uuid);

  return {
    '@context': SCHEMA_ORG,
    '@type': 'Recipe',
    '@id': url,
    identifier: recipe.uuid,
    url,
    name: recipe.name,
    description: recipe.description,
    ...(recipe.primary_image ? { image: recipe.primary_image } : {}),
    ...(recipe.url ? { isBasedOn: recipe.url } : {}),
    recipeCategory: splitList(recipe.category),
    recipeCuisine: splitList(recipe.cuisine),
    keywords: recipe.keywords,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: toInstructions(recipe.steps),
  };
};

/** Renders search results as a schema.org ItemList of Recipe summaries. */
export const toSchemaOrgItemList = (recipes: RecipeCard[], origin: string) => ({
  '@context': SCHEMA_ORG,
  '@type': 'ItemList',
  numberOfItems: recipes.length,
  itemListElement: recipes.map((recipe, index) => {
    const url = recipePageUrl(origin, recipe.uuid);

    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Recipe',
        '@id': url,
        identifier: recipe.uuid,
        url,
        name: recipe.name,
        description: recipe.description,
      },
    };
  }),
});
