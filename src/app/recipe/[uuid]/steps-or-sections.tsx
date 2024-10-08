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
    <div>
      {Object.entries(reducedSteps).map(([section, steps]) => (
        <div key={section}>
          <h3>{section === Primary ? "" : section}</h3>
          {steps.map((step, index) => (
            <div key={`step-${index}`}>
              <div>
                {index + 1}){" "}
                {step.label === step.text
                  ? step.label
                  : [step.label, step.text].filter(Boolean).join("-")}
              </div>
              <div className="h-5" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default StepsOrSections;
