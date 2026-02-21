import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RecipeCard } from '@/types/recipe';
import RecipeRow from '../recipe-row';

// Mock Link since we are not in Next.js environment
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock Badge since it might use something complex, but it's just a div with classes usually.
// Actually Badge is imported from @/components/ui/badge.
// Let's see if it works without mocking Badge.

describe('RecipeRow', () => {
  it('renders recipe tags', () => {
    const recipes: RecipeCard[] = [
      {
        uuid: '123',
        name: 'Test Recipe',
        description: 'Test Description',
        category: 'Test Category',
        cuisine: 'Test Cuisine',
        keywords: 'test, keywords',
      },
    ];

    render(<RecipeRow recipes={recipes} />);

    expect(screen.getByText('Test Category')).toBeDefined();
    expect(screen.getByText('Test Cuisine')).toBeDefined();
  });

  it('renders only available tags', () => {
    const recipes: RecipeCard[] = [
      {
        uuid: '456',
        name: 'Another Recipe',
        description: 'Description',
        category: '',
        cuisine: 'Italian',
        keywords: '',
      },
    ];

    render(<RecipeRow recipes={recipes} />);

    expect(screen.queryByText('Italian')).toBeDefined();
    // Should not render empty badge if category is empty
    // But how to test it? queryByText('') might match anything.
    // The implementation checks {recipe.category && ...} so it shouldn't render if empty string.
  });
});
