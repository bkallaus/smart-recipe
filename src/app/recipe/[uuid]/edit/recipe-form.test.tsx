import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FullRecipe } from '@/types/recipe';

const { editRecipeMock, pushMock, refreshMock, toastMock } = vi.hoisted(() => ({
  editRecipeMock: vi.fn(async () => {}),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock('@/server-actions/recipes', () => ({ editRecipe: editRecipeMock }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

import RecipeForm from './recipe-form';

const recipe: FullRecipe = {
  id: 7,
  uuid: 'abc-123',
  name: 'Pancakes',
  description: 'Fluffy.',
  category: 'Breakfast',
  cuisine: 'American',
  keywords: 'pancake',
  url: '',
  is_favorite: false,
  ingredients: ['flour', 'milk', 'eggs', 'butter'],
  steps: [
    { label: 'Mix', text: 'Mix everything', section: undefined, sort: 4 },
    { label: 'Cook', text: 'Cook on a griddle', section: 'Pan', sort: 9 },
  ],
};

const ingredientValues = () =>
  screen
    .getAllByLabelText(/^Ingredient \d+$/)
    .map((input) => (input as HTMLInputElement).value);

const removeIngredient = (position: number) =>
  fireEvent.click(
    screen.getByRole('button', { name: `Remove ingredient ${position}` }),
  );

describe('RecipeForm ingredients', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('removes the first ingredient and keeps the rest in place', () => {
    render(<RecipeForm recipe={recipe} />);
    removeIngredient(1);
    expect(ingredientValues()).toEqual(['milk', 'eggs', 'butter']);
  });

  it('removes a middle ingredient and keeps the rest in place', () => {
    render(<RecipeForm recipe={recipe} />);
    removeIngredient(2);
    expect(ingredientValues()).toEqual(['flour', 'eggs', 'butter']);
  });

  it('removes the last ingredient', () => {
    render(<RecipeForm recipe={recipe} />);
    removeIngredient(4);
    expect(ingredientValues()).toEqual(['flour', 'milk', 'eggs']);
  });

  it('keeps edited text attached to the right row after removal', () => {
    render(<RecipeForm recipe={recipe} />);
    fireEvent.change(screen.getByLabelText('Ingredient 3'), {
      target: { value: '2 eggs' },
    });
    removeIngredient(1);
    removeIngredient(1);
    expect(ingredientValues()).toEqual(['2 eggs', 'butter']);
  });
});

describe('RecipeForm submit', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('submits trimmed string ingredients and re-numbered steps', async () => {
    render(<RecipeForm recipe={recipe} />);
    removeIngredient(2);
    fireEvent.change(screen.getByLabelText('Ingredient 1'), {
      target: { value: '  2 cups flour  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(editRecipeMock).toHaveBeenCalledTimes(1));
    const [submitted, id] = editRecipeMock.mock.calls[0] as unknown as [
      FullRecipe,
      number,
    ];
    expect(id).toBe(7);
    expect(submitted.ingredients).toEqual(['2 cups flour', 'eggs', 'butter']);
    expect(submitted.steps.map((s) => s.sort)).toEqual([0, 1]);
    expect(submitted.steps[1].section).toBe('Pan');
    expect(submitted.steps[0].section).toBeUndefined();
    expect(pushMock).toHaveBeenCalledWith('/recipe/abc-123');
  });

  it('blocks a blank ingredient', async () => {
    render(<RecipeForm recipe={recipe} />);
    fireEvent.change(screen.getByLabelText('Ingredient 2'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Ingredient cannot be blank')).toBeTruthy();
    expect(editRecipeMock).not.toHaveBeenCalled();
  });

  it('accepts long imported descriptions and steps', async () => {
    render(
      <RecipeForm
        recipe={{
          ...recipe,
          description: 'Yield: 4. Prep: 10 min. '.repeat(100),
          steps: [{ label: 'Step', text: 'x'.repeat(3000), sort: 0 }],
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(editRecipeMock).toHaveBeenCalledTimes(1));
  });

  it('links Cancel back to the recipe', () => {
    render(<RecipeForm recipe={recipe} />);
    expect(
      screen.getByRole('link', { name: 'Cancel' }).getAttribute('href'),
    ).toBe('/recipe/abc-123');
  });
});
