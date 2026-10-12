import { describe, expect, test } from 'vitest';
import { containsPattern, splitFilterValues } from '../recipe-filters';

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
