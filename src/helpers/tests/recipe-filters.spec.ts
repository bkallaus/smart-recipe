import { describe, expect, test } from 'vitest';
import {
  containsPattern,
  findCategoryBySlug,
  hasCategory,
  splitFilterValues,
} from '../recipe-filters';

describe('splitFilterValues', () => {
  test('splits comma-separated values and trims them', () => {
    expect(splitFilterValues(['Dessert, Snack', 'Main Course'])).toEqual([
      'Dessert',
      'Main Course',
      'Snack',
    ]);
  });

  test('dedupes case-insensitively, keeping the first spelling', () => {
    expect(
      splitFilterValues(['Italian', 'italian', 'ITALIAN, Mexican']),
    ).toEqual(['Italian', 'Mexican']);
  });

  test('ignores null and empty values', () => {
    expect(splitFilterValues([null, '', ' , ', 'Thai'])).toEqual(['Thai']);
  });
});

describe('containsPattern', () => {
  test('wraps the value in wildcards', () => {
    expect(containsPattern('garlic')).toBe('%garlic%');
  });

  test('escapes LIKE wildcards in the value', () => {
    expect(containsPattern('100%_a\\b')).toBe('%100\\%\\_a\\\\b%');
  });
});

describe('hasCategory', () => {
  test('matches one part of a comma-separated value', () => {
    expect(hasCategory('Dessert, Snack', 'snack')).toBe(true);
  });

  test('matches whole parts only', () => {
    expect(hasCategory('Main Course', 'Main')).toBe(false);
  });

  test('is false for null values', () => {
    expect(hasCategory(null, 'Dessert')).toBe(false);
  });
});

describe('findCategoryBySlug', () => {
  test('resolves a category from its slug', () => {
    expect(findCategoryBySlug(['Dessert', 'Main Course'], 'main-course')).toBe(
      'Main Course',
    );
  });

  test('returns null for an unknown slug', () => {
    expect(findCategoryBySlug(['Dessert'], 'soup')).toBeNull();
  });
});
