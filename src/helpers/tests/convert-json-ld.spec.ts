import { describe, expect, test, vi } from 'vitest';
import {
  convertJsonLdToIngest,
  findRecipeIngredients,
  htmlToRecipeText,
  withRecipeName,
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

  test('drops out-of-range numeric entities instead of throwing', () => {
    expect(
      htmlToRecipeText('<p>a&#x110000;b&#99999999;c&#0;d&#xD800;e&#233;</p>'),
    ).toBe('abcdeé');
  });
});

describe('convertJsonLdToIngest step and section handling', () => {
  test('reads plain strings inside a HowToSection', async () => {
    const recipe = await convertJsonLdToIngest(
      {
        '@type': 'Recipe',
        name: 'Pie',
        recipeIngredient: ['1 crust'],
        recipeInstructions: [
          {
            '@type': 'HowToSection',
            name: 'Crust',
            itemListElement: [
              'Roll it out.',
              { '@type': 'HowToStep', text: 'Chill it.' },
            ],
          },
        ],
      },
      url,
    );

    expect(recipe?.steps).toEqual([
      { label: 'Roll it out.', text: 'Roll it out.', section: 'Crust' },
      { label: 'Chill it.', text: 'Chill it.', section: 'Crust' },
    ]);
  });

  test('uses the text as label for steps without a name', async () => {
    const recipe = await convertJsonLdToIngest(
      {
        '@type': 'Recipe',
        name: 'Toast',
        recipeIngredient: ['bread'],
        recipeInstructions: [
          { '@type': 'HowToStep', text: 'Toast the bread.' },
          { '@type': 'HowToStep' },
        ],
      },
      url,
    );

    expect(recipe?.steps).toEqual([
      { label: 'Toast the bread.', text: 'Toast the bread.', section: undefined },
    ]);
  });

  test('accepts a single section object with a single step object', async () => {
    const recipe = await convertJsonLdToIngest(
      {
        '@type': 'Recipe',
        name: 'Soup',
        recipeIngredient: ['water'],
        recipeInstructions: {
          '@type': 'HowToSection',
          name: 'Main',
          itemListElement: {
            '@type': 'HowToStep',
            name: 'Boil',
            text: 'Boil water.',
          },
        },
      },
      url,
    );

    expect(recipe?.steps).toEqual([
      { label: 'Boil', text: 'Boil water.', section: 'Main' },
    ]);
  });

  test('joins list-valued taxonomy and keeps an empty name for the caller', async () => {
    const recipe = await convertJsonLdToIngest(
      {
        '@type': 'Recipe',
        recipeCategory: ['Dessert', 'Snack'],
        recipeIngredient: ['1 egg', ''],
      },
      url,
    );

    expect(recipe?.name).toBe('');
    expect(recipe?.category).toBe('Dessert, Snack');
    expect(recipe?.ingredients).toEqual(['1 egg']);
  });
});

describe('withRecipeName', () => {
  const base = {
    name: '',
    description: '',
    category: '',
    cuisine: '',
    keywords: '',
    ingredients: ['1 egg'],
    steps: [],
    url,
  };

  test('keeps the recipe name when present', () => {
    expect(withRecipeName({ ...base, name: 'Eggs' }, 'Page').name).toBe('Eggs');
  });

  test('falls back to the first non-empty page title', () => {
    expect(withRecipeName(base, undefined, '  ', 'Page Title').name).toBe(
      'Page Title',
    );
  });

  test('fails clearly when there is no name at all', () => {
    expect(() => withRecipeName(base, undefined, '')).toThrow(
      'The recipe has no name and the page has no title',
    );
  });
});
