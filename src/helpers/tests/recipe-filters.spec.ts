import { describe, expect, test } from 'vitest';
import {
  categorySlug,
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

describe('category helpers', () => {
  test('categorySlug builds url-safe slugs', () => {
    expect(categorySlug(' Main  Course! ')).toBe('main-course');
  });

  test('findCategoryBySlug returns the matching category or undefined', () => {
    expect(findCategoryBySlug(['Dessert', 'Main Course'], 'main-course')).toBe(
      'Main Course',
    );
    expect(findCategoryBySlug(['Dessert'], 'nope')).toBeUndefined();
  });

  test('hasCategory matches whole comma-separated values only', () => {
    expect(hasCategory('Dessert, Snack', 'snack')).toBe(true);
    expect(hasCategory('Cheesecake', 'Cake')).toBe(false);
    expect(hasCategory(null, 'Cake')).toBe(false);
  });
});
