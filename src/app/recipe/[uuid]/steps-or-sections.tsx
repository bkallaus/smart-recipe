import type { Steps } from "@/types/recipe";

const Primary = "Primary";

const StepsOrSections = ({ steps }: { steps: Steps[] }) => {
  const reducedSteps = steps.reduce((acc, step) => {
    if (step.section) {
      if (!acc[step.section]) {
        acc[step.section] = [];
      }

      acc[step.section].push(step);
    } else {
      if (!acc[Primary]) {
        acc[Primary] = [];
      }
      acc[Primary].push(step);
    }

    return acc;
  }, {} as { [key: string]: Steps[] });

  return (
    <div className="space-y-12">
      {Object.entries(reducedSteps).map(([section, steps]) => (
        <div key={section} className="space-y-8">
          {section !== Primary && (
            <h3 className="text-xl font-bold text-[hsl(var(--on-surface))] uppercase tracking-wider">
              {section}
            </h3>
          )}
          <div className="space-y-10">
            {steps.map((step, index) => (
              <div key={`step-${index}`} className="group">
                <div className="flex gap-6">
                  <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--primary-container))] text-[hsl(var(--primary))] font-bold text-lg">
                    {index + 1}
                  </span>
                  <div className="space-y-2 pt-1">
                    {step.label !== step.text && step.label && (
                      <h4 className="text-lg font-bold text-[hsl(var(--on-surface))]">
                        {step.label}
                      </h4>
                    )}
                    <p className="text-lg text-[hsl(var(--on-surface))] leading-relaxed">
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
