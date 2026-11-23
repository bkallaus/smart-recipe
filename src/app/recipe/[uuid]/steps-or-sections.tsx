'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Steps } from '@/types/recipe';

export type StepGroup = {
  /** `null` for steps that have no section heading. */
  section: string | null;
  steps: Steps[];
};

/**
 * Groups steps by section in order of first appearance. A Map keeps insertion
 * order for every key (a plain object hoists integer-like keys such as "1"),
 * and `null` cannot collide with a real section name.
 */
export const groupStepsBySection = (steps: Steps[]): StepGroup[] => {
  const groups = new Map<string | null, Steps[]>();
  for (const step of steps) {
    const key = step.section ? step.section : null;
    const group = groups.get(key);
    if (group) {
      group.push(step);
    } else {
      groups.set(key, [step]);
    }
  }
  return Array.from(groups, ([section, groupSteps]) => ({
    section,
    steps: groupSteps,
  }));
};

const StepsOrSections = ({ steps }: { steps: Steps[] }) => {
  const [doneSteps, setDoneSteps] = useState<Set<string>>(() => new Set());
  const groups = useMemo(() => groupStepsBySection(steps), [steps]);

  const toggleStep = (stepKey: string) => {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepKey)) {
        next.delete(stepKey);
      } else {
        next.add(stepKey);
      }
      return next;
    });
  };

  return (
    <div className='space-y-12'>
      {groups.map(({ section, steps: groupSteps }, groupIndex) => {
        const groupKey =
          section === null ? 'unsectioned' : `section-${groupIndex}`;
        return (
          <div key={groupKey} className='space-y-8'>
            {section !== null ? (
              <h3 className='text-xl font-bold text-[hsl(var(--on-surface))] uppercase tracking-wider'>
                {section}
              </h3>
            ) : null}
            <div className='space-y-10'>
              {groupSteps.map((step, index) => {
                const stepKey = `${groupKey}-${index}`;
                const isDone = doneSteps.has(stepKey);
                return (
                  <button
                    key={stepKey}
                    type='button'
                    aria-pressed={isDone}
                    onClick={() => toggleStep(stepKey)}
                    className='group flex w-full gap-6 text-left cursor-pointer select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2'
                  >
                    <span
                      className={cn(
                        'shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--primary-container))] text-[hsl(var(--primary))] font-bold text-lg transition-opacity',
                        isDone && 'opacity-50',
                      )}
                    >
                      {index + 1}
                    </span>
                    <div
                      className={cn(
                        'space-y-2 pt-1 min-w-0 flex-1 transition-opacity',
                        isDone && 'opacity-60',
                      )}
                    >
                      {step.label !== step.text && step.label ? (
                        <h4
                          className={cn(
                            'text-lg font-bold text-[hsl(var(--on-surface))] transition-colors',
                            isDone &&
                              'line-through text-[hsl(var(--on-surface-variant))]',
                          )}
                        >
                          {step.label}
                        </h4>
                      ) : null}
                      <p
                        className={cn(
                          'text-lg text-[hsl(var(--on-surface))] leading-relaxed transition-colors',
                          isDone &&
                            'line-through text-[hsl(var(--on-surface-variant))]',
                        )}
                      >
                        {step.text || step.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepsOrSections;
