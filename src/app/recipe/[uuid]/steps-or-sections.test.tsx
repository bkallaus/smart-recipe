import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Steps } from '@/types/recipe';
import StepsOrSections, { groupStepsBySection } from './steps-or-sections';

const step = (text: string, section?: string, sort = 0): Steps => ({
  label: text,
  text,
  section,
  sort,
});

describe('groupStepsBySection', () => {
  it('keeps first-appearance order even for integer-like section names', () => {
    const groups = groupStepsBySection([
      step('make dough', 'Dough'),
      step('first topping', '1'),
      step('knead', 'Dough'),
      step('second topping', '2'),
    ]);
    expect(groups.map((g) => g.section)).toEqual(['Dough', '1', '2']);
    expect(groups[0].steps.map((s) => s.text)).toEqual(['make dough', 'knead']);
  });

  it('does not merge a section named "Primary" with un-sectioned steps', () => {
    const groups = groupStepsBySection([
      step('preheat'),
      step('primary work', 'Primary'),
      step('serve', ''),
    ]);
    expect(groups).toEqual([
      { section: null, steps: [step('preheat'), step('serve', '')] },
      { section: 'Primary', steps: [step('primary work', 'Primary')] },
    ]);
  });

  it('returns no groups for no steps', () => {
    expect(groupStepsBySection([])).toEqual([]);
  });
});

describe('StepsOrSections', () => {
  afterEach(cleanup);

  it('renders a heading for a section named "Primary" but none for un-sectioned steps', () => {
    render(
      <StepsOrSections
        steps={[step('preheat'), step('primary work', 'Primary')]}
      />,
    );
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(['Primary']);
  });
});
