import RecipeIngestButton from "@/components/reingest-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFullRecipeById } from "@/server-actions/recipes";
import { notFound } from "next/navigation";
import { titleCase } from "title-case";
import StepsOrSections from "./steps-or-sections";

const IndividualRecipe = async ({
  params,
}: {
  params: {
    uuid: string;
  };
}) => {
  const recipe = await getFullRecipeById(params.uuid);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        {recipe.primary_image?.includes("supabase") && (
          <img
            src={recipe.primary_image}
            width={400}
            height={400}
            alt={""}
            className="m-auto"
          />
        )}
        <div className="h-5" />
        <div className="flex justify-between">
          <h1 className="text-xl font-semibold">{titleCase(recipe.name)}</h1>
          <Button asChild variant={"outline"}>
            <a href={recipe.url}>Original Recipe</a>
          </Button>
        </div>
        <div>
          <div className="flex gap-1">
            {recipe.cuisine && <Badge>{recipe.cuisine}</Badge>}
            {recipe.category && <Badge>{recipe.category}</Badge>}
          </div>
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
          <StepsOrSections steps={recipe.steps} />
        </div>
      </div>
      <div className="mb-3">Missing information?</div>
      <RecipeIngestButton recipe={recipe} />
    </main>
  );
};

export default IndividualRecipe;
