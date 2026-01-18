import type { RecipeCard } from "@/types/recipe";
import { titleCase } from "title-case";
import Link from "next/link";

const RecipeRow = ({ recipes }: { recipes: RecipeCard[] }) => {
  return (
    <div className="grid md:grid-cols-3 gap-4 lg:gap-10">
      {recipes.map((recipe) => (
        // @ts-expect-error viewTransition is supported in next 15+ but types might be missing
        <Link key={`recipe-${recipe.uuid}`} href={`/recipe/${recipe.uuid}`} viewTransition>
          <div className="bg-white p-4 rounded-md shadow-md h-full">
            {/* <img
              src={recipe.heroImage}
              alt={recipe.name}
              className="w-full h-48 object-cover rounded-md"
            /> */}
            <h2
              className="text-xl font-semibold mt-4 line-clamp-1"
              style={{ viewTransitionName: `recipe-title-${recipe.uuid}` }}
            >
              {titleCase(recipe.name)}
            </h2>
            <p className="line-clamp-3">{recipe.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RecipeRow;
