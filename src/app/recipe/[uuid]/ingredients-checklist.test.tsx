import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import IngredientsChecklist from './ingredients-checklist';

describe('IngredientsChecklist', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('strikes through an ingredient when clicked without rendering checkboxes', () => {
    const ingredients = ['2 cups flour', '1 tsp salt'];
    render(<IngredientsChecklist ingredients={ingredients} />);

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    const flourButton = screen.getByRole('button', { name: '2 cups flour' });
    const saltButton = screen.getByRole('button', { name: '1 tsp salt' });

    expect(flourButton.getAttribute('aria-pressed')).toBe('false');
    expect(saltButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(flourButton);
    expect(flourButton.getAttribute('aria-pressed')).toBe('true');
    expect(saltButton.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('2 cups flour').className).toContain(
      'line-through',
    );
    expect(screen.getByText('1 tsp salt').className).not.toContain(
      'line-through',
    );

    fireEvent.click(flourButton);
    expect(flourButton.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('2 cups flour').className).not.toContain(
      'line-through',
    );
  });

  it('does not persist done state across remounts or web storage', () => {
    const ingredients = ['1 tbsp olive oil'];
    const { unmount } = render(
      <IngredientsChecklist ingredients={ingredients} />,
    );

    const button = screen.getByRole('button', { name: '1 tbsp olive oil' });
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    unmount();
    render(<IngredientsChecklist ingredients={ingredients} />);

    expect(
      screen
        .getByRole('button', { name: '1 tbsp olive oil' })
        .getAttribute('aria-pressed'),
    ).toBe('false');
  });
});
