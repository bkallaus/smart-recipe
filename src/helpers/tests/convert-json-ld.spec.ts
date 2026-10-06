import { describe, expect, test, vi } from 'vitest';
import {
  convertJsonLdToIngest,
  findRecipeIngredients,
  htmlToRecipeText,
} from '../ingest-helper';

// Mock the server action to avoid importing server-only code
vi.mock('@/server-actions/gemini', () => ({
  askAI: vi.fn(),
}));

const url = 'https://example.com/recipe';

describe('convertJsonLdToIngest', () => {
  test('returns null when the page has no recipe', async () => {
    expect(await convertJsonLdToIngest(undefined, url)).toBeNull();
    expect(
      await convertJsonLdToIngest([{ '@type': 'WebPage', name: 'Blog' }], url),
    ).toBeNull();
  });

  test('accepts the legacy ingredients property on a Recipe', async () => {
    const recipe = await convertJsonLdToIngest(
      {
        '@type': ['Recipe'],
        name: 'Monster Cookies',
        ingredients: ['1 cup oats', '1/2 cup peanut butter'],
        recipeInstructions: 'Mix everything.\nBake at 350°F.',
      },
      url,
    );

    expect(recipe?.ingredients).toEqual(['1 cup oats', '1/2 cup peanut butter']);
    expect(recipe?.steps.map((step) => step.text)).toEqual([
      'Mix everything.',
      'Bake at 350°F.',
    ]);
  });

  test('ignores ingredients on non-recipe objects', () => {
    expect(
      findRecipeIngredients({ '@type': 'Product', ingredients: 'water' }),
    ).toBeNull();
  });

  test('handles instructions given as plain strings in page order', async () => {
    const recipe = await convertJsonLdToIngest(
      {
        '@type': 'Recipe',
        name: 'Cookies',
        recipeIngredient: '1 cup flour',
        recipeInstructions: ['First', 'Second', 'Third'],
      },
      url,
    );

    expect(recipe?.ingredients).toEqual(['1 cup flour']);
    expect(recipe?.steps.map((step) => step.text)).toEqual([
      'First',
      'Second',
      'Third',
    ]);
  });

  test('handles a recipe without instructions', async () => {
    const recipe = await convertJsonLdToIngest(
      { '@type': 'Recipe', name: 'Cookies', recipeIngredient: ['1 egg'] },
      url,
    );

    expect(recipe?.steps).toEqual([]);
  });
});

describe('htmlToRecipeText', () => {
  test('keeps visible text and drops scripts, styles and markup', () => {
    const html = `<html><head><title>Ignored</title></head><body>
      <script>var tracking = true;</script>
      <style>.a { color: red; }</style>
      <header>Site Nav</header>
      <h2>Monster Cookies</h2>
      <ul><li>1 &frac12; cups oats</li><li>Peanut butter &amp; honey</li></ul>
      <p>Bake at 350&#176;F.</p>
    </body></html>`;

    expect(htmlToRecipeText(html)).toBe(
      'Site Nav\nMonster Cookies\n1 ½ cups oats\nPeanut butter & honey\nBake at 350°F.',
    );
  });
});
