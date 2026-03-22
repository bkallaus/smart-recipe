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
    <main className="min-h-screen bg-[hsl(var(--surface))] px-6 md:px-12 lg:pl-16 lg:pr-8 py-10 lg:py-16">
      <div className="max-w-3xl">
        {/* Hero image */}
        {recipe.primary_image?.includes("supabase") && (
          <img
            src={recipe.primary_image}
            width={600}
            height={400}
            alt={""}
            className="w-full max-h-72 object-cover rounded-xl mb-8"
            style={{ boxShadow: "0 12px 32px hsl(var(--on-surface) / 0.08)" }}
          />
        )}

        {/* Title row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-6">
          <h1
            className="text-3xl md:text-4xl font-bold text-[hsl(var(--on-surface))] leading-snug"
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              viewTransitionName: `recipe-title-${recipe.uuid}`,
            }}
          >
            {titleCase(recipe.name)}
          </h1>
          <div className="flex gap-2 shrink-0">
            <FavoriteButton uuid={recipe.uuid} isFavorite={recipe.is_favorite} />
            <Button asChild variant={"outline"} className="rounded-full text-sm">
              <a href={recipe.url}>Original Recipe</a>
            </Button>
            <WakeLockButton />
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-4">
          {recipe.cuisine && (
            <Badge className="bg-[hsl(var(--secondary-container))] text-[hsl(var(--on-secondary-container))] border-0 rounded-full">
              {recipe.cuisine}
            </Badge>
          )}
          {recipe.category && (
            <Badge className="bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary))] border-0 rounded-full">
              {recipe.category}
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-[hsl(var(--on-surface-variant))] leading-relaxed mb-8 text-base">
          {recipe.description}
        </p>

        {/* Ingredients */}
        <div className="mb-6">
          <Paper>
            <h2
              className="text-lg font-semibold text-[hsl(var(--primary))] mb-4"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              Ingredients
            </h2>
            {recipe.ingredients.map((ingredient, index) => (
              <Fragment key={`ingredient-${index}`}>
                <div className="text-sm text-[hsl(var(--on-surface))]">{ingredient}</div>
                <div className="h-3" />
              </Fragment>
            ))}
          </Paper>
        </div>

        {/* Instructions */}
        <Paper>
          <h2
            className="text-lg font-semibold text-[hsl(var(--primary))] mb-4"
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Instructions
          </h2>
          <StepsOrSections steps={recipe.steps} />
        </Paper>

        {/* Footer actions */}
        <div className="mt-10 pt-8 border-t border-[hsl(var(--outline-variant)/0.2)]">
          <p className="text-sm text-[hsl(var(--on-surface-variant))] mb-4">
            Missing information?
          </p>
          <div className="flex gap-3">
            <RecipeIngestButton recipe={recipe} />
            <SmartReIngestButton recipe={recipe} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default IndividualRecipe;
