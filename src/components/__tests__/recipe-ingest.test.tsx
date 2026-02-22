import * as matchers from '@testing-library/jest-dom/matchers';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as query from '@/app/query';
import RecipeIngest from '../recipe-ingest';

expect.extend(matchers);

// Mock useRouter
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock useToast
const toastMock = vi.fn();
vi.mock('../ui/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

// Mock ingestRecipe
vi.mock('@/app/query', () => ({
  ingestRecipe: vi.fn(),
}));

// Mock insertIntoFailedIngest
vi.mock('@/server-actions/recipes', () => ({
  insertIntoFailedIngest: vi.fn(),
}));

describe('RecipeIngest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders input and button, button is disabled initially', () => {
    render(<RecipeIngest />);
    expect(screen.getByPlaceholderText('Enter recipe URL')).toBeInTheDocument();
    const button = screen.getByText('Smart Ingest Recipe');
    expect(button).toBeInTheDocument();
    expect(button.closest('button')).toBeDisabled();
  });

  it('shows validation error and keeps button disabled if URL is invalid (no https)', async () => {
    render(<RecipeIngest />);
    const input = screen.getByPlaceholderText('Enter recipe URL');
    const button = screen.getByText('Smart Ingest Recipe').closest('button');

    fireEvent.change(input, { target: { value: 'invalid-url' } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a valid URL starting with http',
    );
    expect(button).toBeDisabled();
  });

  it('enables button when valid URL is entered', async () => {
    render(<RecipeIngest />);
    const input = screen.getByPlaceholderText('Enter recipe URL');
    const button = screen.getByText('Smart Ingest Recipe').closest('button');

    fireEvent.change(input, { target: { value: 'https://example.com' } });

    expect(button).not.toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls ingestRecipe and navigates on success', async () => {
    const mockRecipeId = '123';
    vi.mocked(query.ingestRecipe).mockResolvedValue(mockRecipeId);

    render(<RecipeIngest />);
    const input = screen.getByPlaceholderText('Enter recipe URL');
    const button = screen.getByText('Smart Ingest Recipe').closest('button');

    fireEvent.change(input, {
      target: { value: 'https://example.com/recipe' },
    });

    fireEvent.click(button!);

    await waitFor(() => {
      expect(query.ingestRecipe).toHaveBeenCalledWith(
        'https://example.com/recipe',
      );
      expect(pushMock).toHaveBeenCalledWith(`/recipe/${mockRecipeId}`);
    });
  });
});
