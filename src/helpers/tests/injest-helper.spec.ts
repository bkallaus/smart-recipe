import { describe, expect, test, vi } from 'vitest';
import { findRecipeIngredients } from '../ingest-helper';

// Mock the server action to avoid importing server-only code
vi.mock('@/server-actions/gemini', () => ({
  askAI: vi.fn(),
}));

const BaseJson = {
  '@type': 'Recipe',
  recipeIngredient: ['Ingredient 1'],
  recipeInstructions: [
    {
      '@type': 'HowToStep',
      text: 'Instruction 1',
      name: 'Instruction 2',
    },
  ],
};

const JSONArray = {
  '@graph': [BaseJson],
};

const JSONObject = {
  '@graph': BaseJson,
};

const JSONGraphInArray = [
  {
    '@context': 'https://schema.org',
    ...JSONObject,
  },
];

describe('Injest Helper', () => {
  describe('findRecipeIngredients', () => {
    test('should return the correct value BaseJson', () => {
      const recipe = findRecipeIngredients(BaseJson);
      expect(recipe).not.toBeNull();

      expect(recipe.recipeIngredient).toBeDefined();
    });

    test('should return the correct value JSONArray', () => {
      const recipe = findRecipeIngredients(JSONArray);
      expect(recipe).not.toBeNull();

      expect(recipe.recipeIngredient).toBeDefined();
    });

    test('should return the correct value JSONObject', () => {
      const recipe = findRecipeIngredients(JSONObject);

      expect(recipe).not.toBeNull();
      expect(recipe.recipeIngredient).toBeDefined();
    });

    test('should return the correct value JSONGraphInArray', () => {
      const recipe = findRecipeIngredients(JSONGraphInArray);

      expect(recipe).not.toBeNull();
      expect(recipe.recipeIngredient).toBeDefined();
    });
  });
});
