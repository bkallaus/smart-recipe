import { getFullRecipeById } from "@/server-actions/recipes";

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
          <h1>{recipe.name}</h1>
          <p>{recipe.description}</p>
          <h2>Ingredients</h2>
          {recipe.ingredients.map((ingredient, index) => (
            <div key={`ingredient-${index}`}>{ingredient}</div>
          ))}
          <h2>Instructions</h2>
          {recipe.steps.map((step, index) => (
            <div key={`step-${index}`}>{step}</div>
          ))}
        </div>
      ) : (
        <p>Recipe not found</p>
      )}
    </main>
  );
};

export default IndividualRecipe;
