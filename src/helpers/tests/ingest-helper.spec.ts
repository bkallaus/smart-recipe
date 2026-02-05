import { describe, expect, test, vi } from 'vitest';
import { findRecipeIngredients, smartIngest } from '../ingest-helper';
import { askAI } from '@/server-actions/gemini';

// Mock the server action to avoid importing server-only code
vi.mock('@/server-actions/gemini', () => ({
  askAI: vi.fn().mockResolvedValue('{}'),
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

  describe('smartIngest', () => {
    test('should construct prompt correctly for HTML string', async () => {
      const html = '<html><body><h1>Recipe</h1></body></html>';
      await smartIngest(html);

      expect(askAI).toHaveBeenCalledWith(expect.stringContaining('HTML website content'));
      expect(askAI).toHaveBeenCalledWith(expect.stringContaining(html));
    });

    test('should construct prompt correctly for JSON object', async () => {
      const json = { name: 'Recipe' };
      await smartIngest(json);

      expect(askAI).toHaveBeenCalledWith(expect.stringContaining('jsonld recipe data'));
      expect(askAI).toHaveBeenCalledWith(expect.stringContaining('"name":"Recipe"'));
    });
  });
});
