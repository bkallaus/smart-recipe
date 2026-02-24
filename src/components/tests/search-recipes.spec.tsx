import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SearchRecipes from '../search-recipes';
import * as recipesActions from '@/server-actions/recipes';

// Mock server actions
vi.mock('@/server-actions/recipes', () => ({
  searchRecipes: vi.fn(),
}));

// Mock use-debounce to return value immediately
vi.mock('use-debounce', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mocking
  useDebounce: (value: any) => [value],
}));

// Mock RecipeRow to avoid Next.js Link issues
vi.mock('../recipe-row', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mocking
  default: ({ recipes }: { recipes: any[] }) => (
    <div data-testid="recipe-row">
      {recipes.map((r) => (
        <div key={r.uuid}>{r.name}</div>
      ))}
    </div>
  ),
}));

describe('SearchRecipes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

  it('renders the search input', () => {
    render(<SearchRecipes />);
    expect(screen.getByPlaceholderText('Search for recipes')).not.toBeNull();
  });

  it('calls searchRecipes when input changes', async () => {
    const mockRecipes = [
      { uuid: '1', name: 'Pasta', description: 'Delicious pasta' },
    ];
    // biome-ignore lint/suspicious/noExplicitAny: Mocking
    (recipesActions.searchRecipes as any).mockResolvedValue(mockRecipes);

    render(<SearchRecipes />);

    const input = screen.getByPlaceholderText('Search for recipes');
    fireEvent.change(input, { target: { value: 'Pasta' } });

    await waitFor(() => {
      expect(recipesActions.searchRecipes).toHaveBeenCalledWith('Pasta');
    });

    const element = await screen.findByText('Pasta');
    expect(element).not.toBeNull();
  });

  it('clears the search input and results when clear button is clicked', async () => {
    const mockRecipes = [
      { uuid: '1', name: 'Pasta', description: 'Delicious pasta' },
    ];
    // biome-ignore lint/suspicious/noExplicitAny: Mocking
    (recipesActions.searchRecipes as any).mockResolvedValue(mockRecipes);

    render(<SearchRecipes />);

    const input = screen.getByPlaceholderText('Search for recipes') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Pasta' } });

    // Wait for result to appear
    const result = await screen.findByText('Pasta');
    expect(result).not.toBeNull();

    // Wait for clear button to appear
    const clearButton = await screen.findByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
    expect(screen.queryByText('Pasta')).toBeNull();
  });
});
