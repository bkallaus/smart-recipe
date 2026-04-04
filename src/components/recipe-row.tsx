import type { RecipeCard } from "@/types/recipe";
import { titleCase } from "title-case";
import Link from "next/link";

const RecipeRow = ({ recipes }: { recipes: RecipeCard[] }) => {
  return (
    <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
      {recipes.map((recipe) => (
        // @ts-expect-error viewTransition is supported in next 15+ but types might be missing
        <Link key={`recipe-${recipe.uuid}`} href={`/recipe/${recipe.uuid}`} viewTransition>
          <div
            className="bg-[hsl(var(--surface-container-lowest))] p-6 rounded-xl h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-ambient-md"
            style={{ boxShadow: "0 8px 24px hsl(var(--on-surface) / 0.05)" }}
          >
            <h2
              className="text-xl font-semibold mt-1 mb-3 line-clamp-1 text-[hsl(var(--on-surface))]"
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                viewTransitionName: `recipe-title-${recipe.uuid}`,
              }}
            >
              {titleCase(recipe.name)}
            </h2>
            <p className="line-clamp-3 text-sm leading-relaxed text-[hsl(var(--on-surface-variant))]">
              {recipe.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RecipeRow;
