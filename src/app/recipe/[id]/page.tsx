import { getFullRecipeById } from "@/server-actions/recipes";
import Image from "next/image";
import { notFound } from "next/navigation";
import { titleCase } from "title-case";

const IndividualRecipe = async ({
  params,
}: {
  params: {
    id: number;
  };
}) => {
  const recipe = await getFullRecipeById(Number(params.id));

  if (!recipe) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        {/* {recipe.primary_image && (
          <img src={recipe.primary_image} width={400} height={400} alt={""} />
        )} */}
        <div className="h-5" />
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
              <div>
                {index + 1}) {step}
              </div>
              <div className="h-5" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default IndividualRecipe;
