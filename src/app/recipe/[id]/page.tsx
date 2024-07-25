import { getFullRecipeById } from "@/server-actions/recipes";
import { titleCase } from "title-case";

const IndividualRecipe = async ({
  params,
}: {
  params: {
    id: number;
  };
}) => {
  const recipe = await getFullRecipeById(Number(params.id));

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {recipe ? (
        <div>
          <div className="flex justify-between">
            <h1 className="text-xl font-semibold">{titleCase(recipe.name)}</h1>
            <a href={recipe.url}>External Link</a>
          </div>
          <div>
            <p>{recipe.description}</p>
            <div className="h-5" />
            <h2 className="text-lg font-medium">Ingredients</h2>
            {recipe.ingredients.map((ingredient, index) => (
              <div key={`ingredient-${index}`}>{ingredient}</div>
            ))}
          </div>
          <div className="h-5" />
          <div>
            <h2 className="text-lg font-medium">Instructions</h2>
            {recipe.steps.map((step, index) => (
              <div key={`step-${index}`}>
                {index + 1}) {step}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>Recipe not found</p>
      )}
    </main>
  );
};

export default IndividualRecipe;
