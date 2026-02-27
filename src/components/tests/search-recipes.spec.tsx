import * as matchers from '@testing-library/jest-dom/matchers';
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchRecipes from '../search-recipes';

expect.extend(matchers);

// Mock server actions
vi.mock('@/server-actions/recipes', () => ({
  searchRecipes: vi.fn().mockResolvedValue([]),
}));

// Mock use-debounce
vi.mock('use-debounce', () => ({
  useDebounce: (value: any) => [value],
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid='icon-x' />,
}));

describe('SearchRecipes', () => {
  afterEach(() => {
    cleanup();
  });

  it('should focus input when clear button is clicked', async () => {
    render(<SearchRecipes />);

    // There might be duplicate inputs due to how react-testing-library interacts with the component
    // or how the component is structured. Using getAllByLabelText and taking the first one.
    const inputs = screen.getAllByLabelText('Search recipes');
    const input = inputs[0];

    // Type something to show the clear button
    fireEvent.change(input, { target: { value: 'pasta' } });

    // Find clear button
    const clearButton = await screen.findByLabelText('Clear search');

    // Click clear button
    fireEvent.click(clearButton);

    // Input should be cleared
    expect(input).toHaveValue('');

    // Input should be focused
    expect(document.activeElement).toBe(input);
  });

  it('should clear input when Escape key is pressed', async () => {
    render(<SearchRecipes />);

    const inputs = screen.getAllByLabelText('Search recipes');
    const input = inputs[0];

    // Type something
    fireEvent.change(input, { target: { value: 'pizza' } });

    // Press Escape
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    // Input should be cleared
    expect(input).toHaveValue('');
  });
});
