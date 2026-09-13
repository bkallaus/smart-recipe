import { beforeEach, describe, expect, test, vi } from 'vitest';
import { askAI } from '@/server-actions/gemini';
import { parseRecipeText } from '../ingest-helper';

// Mock the server action to avoid importing server-only code
vi.mock('@/server-actions/gemini', () => ({
  askAI: vi.fn(),
}));

const mockedAskAI = vi.mocked(askAI);

const RecipeResponse = {
  category: 'Dessert',
  cuisine: 'American',
  keywords: 'cookies, chocolate',
  name: 'Chocolate Chip Cookies',
  description: 'Yield: 24 cookies | Prep: 10 mins | Cook: 12 mins',
  heroImage: '',
  ingredients: ['1 cup flour', '1 cup chocolate chips'],
  steps: [{ label: 'Mix', text: 'Mix everything together.' }],
  url: '',
};

const PastedText = `Chocolate Chip Cookies

Ingredients
1 cup flour
1 cup chocolate chips

Steps
1. Mix everything together.`;

describe('parseRecipeText', () => {
  beforeEach(() => {
    mockedAskAI.mockReset();
  });

  test('should send the pasted text to the AI', async () => {
    mockedAskAI.mockResolvedValue(JSON.stringify(RecipeResponse));

    await parseRecipeText(PastedText);

    expect(mockedAskAI).toHaveBeenCalledTimes(1);
    expect(mockedAskAI.mock.calls[0][0]).toContain(PastedText);
  });

  test('should return the parsed recipe', async () => {
    mockedAskAI.mockResolvedValue(JSON.stringify(RecipeResponse));

    const recipe = await parseRecipeText(PastedText);

    expect(recipe).toEqual(RecipeResponse);
  });

  test('should strip markdown code fences from the response', async () => {
    mockedAskAI.mockResolvedValue(
      `\`\`\`json\n${JSON.stringify(RecipeResponse)}\n\`\`\``,
    );

    const recipe = await parseRecipeText(PastedText);

    expect(recipe).toEqual(RecipeResponse);
  });

  test('should return null when the response is not valid JSON', async () => {
    mockedAskAI.mockResolvedValue('I could not find a recipe in that text.');

    const recipe = await parseRecipeText(PastedText);

    expect(recipe).toBeNull();
  });

  test('should return null when the AI call fails', async () => {
    mockedAskAI.mockRejectedValue(new Error('boom'));

    const recipe = await parseRecipeText(PastedText);

    expect(recipe).toBeNull();
  });
});
