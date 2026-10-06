import { describe, expect, test, vi } from 'vitest';
import { extractMicrodataRecipe, getRecipeSectionHtml } from '../recipe-html';

// Mock the server action to avoid importing server-only code
vi.mock('@/server-actions/gemini', () => ({
  askAI: vi.fn(),
}));

const url = 'https://example.com/monster-cookies';

const MicrodataPage = `<html><head><title>Monster Cookies | Blog</title></head><body>
  <article>
    <p>A long story about cookies...</p>
    <div itemscope itemtype="http://schema.org/Recipe">
      <h2 itemprop="name">Healthy Classic Monster Cookies</h2>
      <img itemprop="image" src="https://example.com/cookies.jpg" />
      <p itemprop="description">Soft and chewy.</p>
      <ul>
        <li itemprop="ingredients">1 &frac12; cups old-fashioned oats</li>
        <li itemprop="ingredients">½ cup creamy peanut butter</li>
      </ul>
      <div itemprop="nutrition" itemscope itemtype="http://schema.org/NutritionInformation">
        <span itemprop="name">Nutrition</span>
      </div>
      <ol itemprop="recipeInstructions">
        <li>Mix the oats and peanut butter.</li>
        <li>Bake at 325&deg;F for 10 minutes.</li>
      </ol>
    </div>
  </article>
  <section class="comments"><p>Great recipe!</p></section>
</body></html>`;

describe('extractMicrodataRecipe', () => {
  test('reads a schema.org/Recipe microdata card', () => {
    const recipe = extractMicrodataRecipe(MicrodataPage, url);

    expect(recipe).toEqual({
      name: 'Healthy Classic Monster Cookies',
      description: 'Soft and chewy.',
      category: '',
      cuisine: '',
      keywords: '',
      heroImage: 'https://example.com/cookies.jpg',
      ingredients: [
        '1 ½ cups old-fashioned oats',
        '½ cup creamy peanut butter',
      ],
      steps: [
        {
          label: 'Mix the oats and peanut butter.',
          text: 'Mix the oats and peanut butter.',
        },
        {
          label: 'Bake at 325°F for 10 minutes.',
          text: 'Bake at 325°F for 10 minutes.',
        },
      ],
      url,
    });
  });

  test('reads one step per recipeInstructions element', () => {
    const recipe = extractMicrodataRecipe(
      `<div itemscope itemtype="https://schema.org/Recipe">
        <span itemprop="recipeIngredient">1 egg</span>
        <p itemprop="recipeInstructions">Crack the egg.</p>
        <p itemprop="recipeInstructions">Fry it.</p>
      </div>`,
      url,
      'https://example.com/og.jpg',
    );

    expect(recipe?.steps.map((step) => step.text)).toEqual([
      'Crack the egg.',
      'Fry it.',
    ]);
    expect(recipe?.heroImage).toBe('https://example.com/og.jpg');
  });

  test('returns null without recipe microdata or ingredients', () => {
    expect(extractMicrodataRecipe('<p>No recipe here</p>', url)).toBeNull();
    expect(
      extractMicrodataRecipe(
        '<div itemscope itemtype="http://schema.org/Recipe"><h2 itemprop="name">Empty</h2></div>',
        url,
      ),
    ).toBeNull();
  });
});

describe('getRecipeSectionHtml', () => {
  test('returns only the recipe card', () => {
    const section = getRecipeSectionHtml(MicrodataPage);

    expect(section).toContain('Healthy Classic Monster Cookies');
    expect(section).not.toContain('A long story about cookies');
    expect(section).not.toContain('Great recipe!');
  });

  test('finds recipe plugin cards without microdata', () => {
    const card = `<div class="tasty-recipes">${'Ingredients and steps. '.repeat(20)}</div>`;
    const section = getRecipeSectionHtml(
      `<body><p>Story</p>${card}<p>Comments</p></body>`,
    );

    expect(section).toContain('tasty-recipes');
    expect(section).not.toContain('Story');
  });

  test('returns the whole page when there is no recipe card', () => {
    const html = '<body><p>Just a blog post</p></body>';

    expect(getRecipeSectionHtml(html)).toBe(html);
  });
});
