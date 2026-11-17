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
  const groups = groupStepsBySection(steps);

  return (
    <div className='space-y-12'>
      {groups.map(({ section, steps: groupSteps }, groupIndex) => (
        <div
          key={section === null ? 'unsectioned' : `section-${groupIndex}`}
          className='space-y-8'
        >
          {section !== null ? (
            <h3 className='text-xl font-bold text-[hsl(var(--on-surface))] uppercase tracking-wider'>
              {section}
            </h3>
          ) : null}
          <div className='space-y-10'>
            {groupSteps.map((step, index) => (
              <div key={`step-${index}`} className='group'>
                <div className='flex gap-6'>
                  <span className='shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--primary-container))] text-[hsl(var(--primary))] font-bold text-lg'>
                    {index + 1}
                  </span>
                  <div className='space-y-2 pt-1'>
                    {step.label !== step.text && step.label ? (
                      <h4 className='text-lg font-bold text-[hsl(var(--on-surface))]'>
                        {step.label}
                      </h4>
                    ) : null}
                    <p className='text-lg text-[hsl(var(--on-surface))] leading-relaxed'>
                      {step.text || step.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepsOrSections;
