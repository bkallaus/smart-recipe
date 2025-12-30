import RecipeIngestButton from "@/components/reingest-button";
import SmartReIngestButton from "@/components/smart-reingest-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFullRecipeById } from "@/server-actions/recipes";
import { notFound } from "next/navigation";
import { titleCase } from "title-case";
import StepsOrSections from "./steps-or-sections";
import { Paper } from "@/components/paper";
import { Fragment } from "react";
import FavoriteButton from "./favorite-button";
import { WakeLockButton } from "@/components/wake-lock";

const IndividualRecipe = async ({
  params,
}: {
  params: Promise<{
    uuid: string;
  }>;
}) => {
  const { uuid } = await params;
  const recipe = await getFullRecipeById(uuid);

  if (!recipe) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-3 lg:p-24 ">
      <div>
        {recipe.primary_image?.includes("supabase") && (
          <img
            src={recipe.primary_image}
            width={400}
            height={400}
            alt={""}
            className="m-auto rounded-lg"
          />
        )}
        <div className="h-5" />
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <h1 className="text-xl font-semibold">{titleCase(recipe.name)}</h1>
          <FavoriteButton uuid={recipe.uuid} isFavorite={recipe.is_favorite} />
          <Button asChild variant={"outline"}>
            <a href={recipe.url}>Original Recipe</a>
          </Button>
          <WakeLockButton />
        </div>
        <div className="h-5" />
        <div>
          <div className="flex gap-1">
            {recipe.cuisine && <Badge>{recipe.cuisine}</Badge>}
            {recipe.category && <Badge>{recipe.category}</Badge>}
          </div>
          <p>{recipe.description}</p>
          <div className="h-5" />
          <Paper>
            <h2 className="text-lg font-medium">Ingredients</h2>
            {recipe.ingredients.map((ingredient, index) => (
              <Fragment key={`ingredient-${index}`}>
                <div>{ingredient}</div>
                <div className="h-3" />
              </Fragment>
            ))}
          </Paper>
        </div>
        <div className="h-5" />
        <Paper>
          <h2 className="text-lg font-medium">Instructions</h2>
          <StepsOrSections steps={recipe.steps} />
        </Paper>
      </div>
      <div className="mb-3">Missing information?</div>
      <div className="flex gap-3">
        <RecipeIngestButton recipe={recipe} />
        <SmartReIngestButton recipe={recipe} />
      </div>
    </main>
  );
};

export default IndividualRecipe;
