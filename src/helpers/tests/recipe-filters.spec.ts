import { describe, expect, test } from 'vitest';
import {
  containsPattern,
  hasFilterValue,
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

describe('hasFilterValue', () => {
  test('matches one entry of a comma-separated value, ignoring case', () => {
    expect(hasFilterValue('Dessert, Snack', 'snack')).toBe(true);
    expect(hasFilterValue('Main Course', ' main course ')).toBe(true);
  });

  test('does not match partial entries', () => {
    expect(hasFilterValue('Pies, Tarts', 'Pie')).toBe(false);
  });

  test('handles null and empty input', () => {
    expect(hasFilterValue(null, 'Dessert')).toBe(false);
    expect(hasFilterValue('Dessert', '  ')).toBe(false);
  });
});
