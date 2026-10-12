import { describe, expect, test, vi } from 'vitest';
import {
  formatMinutes,
  normalizeAuthor,
  normalizeYield,
  parseDurationMinutes,
} from '../recipe-metadata';
import { convertJsonLdToIngest } from '../ingest-helper';

// Mock the server action to avoid importing server-only code
vi.mock('@/server-actions/gemini', () => ({
  askAI: vi.fn(),
}));

describe('parseDurationMinutes', () => {
  test('reads ISO 8601 durations', () => {
    expect(parseDurationMinutes('PT15M')).toBe(15);
    expect(parseDurationMinutes('PT1H30M')).toBe(90);
    expect(parseDurationMinutes('P0DT2H0M')).toBe(120);
    expect(parseDurationMinutes('P1D')).toBe(1440);
    expect(parseDurationMinutes('PT90S')).toBe(2);
  });

  test('treats plain numbers as minutes', () => {
    expect(parseDurationMinutes(25)).toBe(25);
    expect(parseDurationMinutes('25')).toBe(25);
  });

  test('returns null for unknown or zero durations', () => {
    expect(parseDurationMinutes(undefined)).toBeNull();
    expect(parseDurationMinutes('')).toBeNull();
    expect(parseDurationMinutes('PT0M')).toBeNull();
    expect(parseDurationMinutes('about an hour')).toBeNull();
    expect(parseDurationMinutes(0)).toBeNull();
  });
});

describe('normalizeYield', () => {
  test('prefers a descriptive yield over a bare number', () => {
    expect(normalizeYield(['4', '4 servings'])).toBe('4 servings');
    expect(normalizeYield(6)).toBe('6');
    expect(normalizeYield(undefined)).toBe('');
  });
});

describe('normalizeAuthor', () => {
  test('reads people, strings and lists', () => {
    expect(normalizeAuthor({ '@type': 'Person', name: 'Jane' })).toBe('Jane');
    expect(normalizeAuthor('Sam')).toBe('Sam');
    expect(normalizeAuthor([{ name: 'A' }, { name: 'B' }])).toBe('A, B');
    expect(normalizeAuthor(undefined)).toBe('');
  });
});

describe('formatMinutes', () => {
  test('formats hours and minutes', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(60)).toBe('1 hr');
    expect(formatMinutes(95)).toBe('1 hr 35 min');
  });
});

describe('convertJsonLdToIngest metadata', () => {
  test('reads times, yield and author from JSON-LD', async () => {
    const recipe = await convertJsonLdToIngest(
      {
        '@type': 'Recipe',
        name: 'Stew',
        recipeIngredient: ['1 lb beef'],
        prepTime: 'PT20M',
        cookTime: 'PT2H',
        recipeYield: ['6', '6 bowls'],
        author: [{ '@type': 'Person', name: 'Chef Lee' }],
      },
      'https://example.com/stew',
    );

    expect(recipe).toMatchObject({
      prepMinutes: 20,
      cookMinutes: 120,
      totalMinutes: 140,
      servings: '6 bowls',
      author: 'Chef Lee',
    });
  });
});
