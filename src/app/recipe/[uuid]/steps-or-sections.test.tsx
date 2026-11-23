import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Steps } from '@/types/recipe';
import StepsOrSections from './steps-or-sections';

describe('StepsOrSections', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('strikes through steps independently across sections without rendering checkboxes', () => {
    const steps: Steps[] = [
      {
        label: 'Prep',
        text: 'Preheat oven to 400F',
        section: 'Crust',
        sort: 1,
      },
      {
        label: 'Mix',
        text: 'Combine flour and butter',
        section: 'Crust',
        sort: 2,
      },
      { label: 'Sauce', text: 'Simmer tomatoes', section: 'Filling', sort: 3 },
    ];

    render(<StepsOrSections steps={steps} />);

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(
      buttons.every((btn) => btn.getAttribute('aria-pressed') === 'false'),
    ).toBe(true);

    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Preheat oven to 400F').className).toContain(
      'line-through',
    );
    expect(screen.getByText('Prep').className).toContain('line-through');
    expect(screen.getByText('Simmer tomatoes').className).not.toContain(
      'line-through',
    );

    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Preheat oven to 400F').className).not.toContain(
      'line-through',
    );
  });

  it('does not save done steps across remounts or web storage', () => {
    const steps: Steps[] = [{ label: '', text: 'Boil water', sort: 1 }];
    const { unmount } = render(<StepsOrSections steps={steps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    unmount();
    render(<StepsOrSections steps={steps} />);

    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe(
      'false',
    );
  });
});
