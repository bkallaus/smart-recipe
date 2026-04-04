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
    <main className="min-h-screen bg-[hsl(var(--surface))] px-6 md:px-12 lg:pl-32 lg:pr-12 py-10 lg:py-24">
      <div className="max-w-4xl space-y-16">
        {/* Hero image */}
        {recipe.primary_image?.includes("supabase") && (
          <div className="relative group">
            <img
              src={recipe.primary_image}
              width={800}
              height={500}
              alt={recipe.name}
              className="w-full max-h-[500px] object-cover rounded-2xl shadow-ambient"
            />
          </div>
        )}

        {/* Title row */}
        <div className="space-y-6">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-[hsl(var(--on-surface))] leading-[1.1]"
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              viewTransitionName: `recipe-title-${recipe.uuid}`,
            }}
          >
            {titleCase(recipe.name)}
          </h1>

          <div className="flex flex-wrap gap-4 items-center">
            <FavoriteButton uuid={recipe.uuid} isFavorite={recipe.is_favorite} />
            <Button asChild variant="secondary" className="rounded-full bg-[hsl(var(--surface-container-highest))] border-0 text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))]">
              <a href={recipe.url} target="_blank" rel="noopener noreferrer">Original Recipe</a>
            </Button>
            <WakeLockButton />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3 mt-4">
            {recipe.cuisine && (
              <Badge className="bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))] border-0 rounded-full px-4 py-1.5 text-sm font-medium">
                {recipe.cuisine}
              </Badge>
            )}
            {recipe.category && (
              <Badge className="bg-[hsl(var(--secondary-container))] text-[hsl(var(--on-secondary-container))] border-0 rounded-full px-4 py-1.5 text-sm font-medium">
                {recipe.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="max-w-2xl">
          <p className="text-xl md:text-2xl text-[hsl(var(--on-surface-variant))] leading-relaxed italic">
            {recipe.description}
          </p>
        </div>

        {/* Ingredients */}
        <section>
          <Paper>
            <h2
              className="text-2xl md:text-3xl font-bold text-[hsl(var(--primary))] mb-8"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              Ingredients
            </h2>
            <div className="space-y-6">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={`ingredient-${index}`} className="flex items-start gap-4 text-lg text-[hsl(var(--on-surface))]">
                  <span className="shrink-0 w-2 h-2 mt-2.5 rounded-full bg-[hsl(var(--secondary))] opacity-60" />
                  <span>{ingredient}</span>
                </div>
              ))}
            </div>
          </Paper>
        </section>

        {/* Instructions */}
        <section>
          <Paper>
            <h2
              className="text-2xl md:text-3xl font-bold text-[hsl(var(--primary))] mb-8"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              Instructions
            </h2>
            <StepsOrSections steps={recipe.steps} />
          </Paper>
        </section>

        {/* Footer actions */}
        <footer className="pt-16 mt-24 border-t border-[hsl(var(--outline-variant)/0.2)]">
          <div className="bg-[hsl(var(--surface-container-low))] p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-xl font-semibold">Missing information?</h3>
              <p className="text-[hsl(var(--on-surface-variant))]">You can re-ingest the recipe to get more details.</p>
            </div>
            <div className="flex gap-4">
              <SmartReIngestButton recipe={recipe} />
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default IndividualRecipe;
