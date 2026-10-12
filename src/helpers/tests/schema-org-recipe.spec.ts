import { describe, expect, test } from 'vitest';
import type { FullRecipe } from '@/types/recipe';
import {
  schemaOrgRecipeInput,
  toSchemaOrgItemList,
  toSchemaOrgRecipe,
} from '../schema-org-recipe';

const origin = 'https://recipes.example';

const recipe: FullRecipe = {
  id: 1,
  uuid: '6f1c2c1e-1111-4222-8333-444455556666',
  name: 'Pie',
  description: 'A pie',
  primary_image: 'https://img.example/pie.jpg',
  category: 'Dessert, Snack',
  cuisine: '',
  keywords: 'pie',
  url: 'https://source.example/pie',
  is_favorite: false,
  ingredients: ['flour', 'apples'],
  steps: [
    { label: 'Make crust', text: 'Mix flour.', section: 'Crust', sort: 0 },
    { label: 'Roll it.', text: 'Roll it.', section: 'Crust', sort: 1 },
    { label: 'Bake.', text: 'Bake.', sort: 2 },
  ],
};

describe('toSchemaOrgRecipe', () => {
  test('renders JSON-LD with sections grouped', () => {
    const jsonLd = toSchemaOrgRecipe(recipe, origin);

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      url: `${origin}/recipe/${recipe.uuid}`,
      identifier: recipe.uuid,
      isBasedOn: 'https://source.example/pie',
      image: 'https://img.example/pie.jpg',
      recipeCategory: ['Dessert', 'Snack'],
      recipeCuisine: [],
      recipeIngredient: ['flour', 'apples'],
    });
    expect(jsonLd.recipeInstructions).toEqual([
      {
        '@type': 'HowToSection',
        name: 'Crust',
        itemListElement: [
          { '@type': 'HowToStep', name: 'Make crust', text: 'Mix flour.' },
          { '@type': 'HowToStep', text: 'Roll it.' },
        ],
      },
      { '@type': 'HowToStep', text: 'Bake.' },
    ]);
  });
});

describe('toSchemaOrgItemList', () => {
  test('numbers list items from 1', () => {
    const list = toSchemaOrgItemList(
      [{ uuid: 'a', name: 'A', description: '' }],
      origin,
    );

    expect(list.itemListElement[0]).toMatchObject({
      position: 1,
      item: { '@type': 'Recipe', url: `${origin}/recipe/a` },
    });
  });
});

describe('schemaOrgRecipeInput', () => {
  test('accepts a minimal recipe', () => {
    const result = schemaOrgRecipeInput.safeParse({
      '@type': ['Recipe'],
      name: 'Toast',
      recipeIngredient: ['bread'],
      recipeInstructions: 'Toast the bread.',
    });

    expect(result.success).toBe(true);
  });

  test('rejects a recipe without ingredients', () => {
    const result = schemaOrgRecipeInput.safeParse({
      '@type': 'Recipe',
      name: 'Toast',
      recipeIngredient: [],
      recipeInstructions: 'Toast the bread.',
    });

    expect(result.success).toBe(false);
  });

  test('rejects other types', () => {
    const result = schemaOrgRecipeInput.safeParse({
      '@type': 'Article',
      name: 'Toast',
      recipeIngredient: ['bread'],
      recipeInstructions: 'Toast the bread.',
    });

    expect(result.success).toBe(false);
  });
});
