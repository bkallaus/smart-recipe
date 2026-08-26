import RecipeRow from "@/components/recipe-row";
import { getRecentRecipes } from "@/server-actions/recipes";

const SignedOutHome = async () => {
  const recentRecipes = await getRecentRecipes(3);

  return (
    <main className="flex-1">
      {/* Login notice */}
      <div className="mx-8 md:mx-16 mt-6 px-5 py-4 bg-[hsl(var(--primary-container)/0.3)] rounded-xl text-[hsl(var(--on-surface))] text-sm">
        To view recipes and add new ones, please sign in.
      </div>

      {/* Hero */}
      <section className="w-full py-16 md:py-28 lg:py-36 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--surface-container-lowest))_0%,_transparent_60%)]" />
        <div className="px-8 md:px-12 lg:pl-16 lg:pr-8 relative z-10">
          <h1
            className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl text-[hsl(var(--on-primary))] leading-tight"
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Import Any Recipe
            <br />
            <span className="italic font-normal opacity-90">with AI</span>
          </h1>
          <p className="mt-4 text-[hsl(var(--on-primary)/0.75)] text-lg max-w-sm">
            Instantly import and organize recipes from anywhere.
          </p>
        </div>
      </section>

      {/* Recent Recipes */}
      <section className="bg-[hsl(var(--surface-container-low))] py-14 md:py-20">
        <div className="px-8 md:px-12 lg:pl-16 lg:pr-8">
          <div className="mb-10">
            <h2
              className="text-2xl md:text-3xl font-semibold text-[hsl(var(--on-surface))]"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              Recent Recipes
            </h2>
            <p className="text-[hsl(var(--on-surface-variant))] mt-2 text-sm">
              Discover recipes imported and enhanced by AI.
            </p>
          </div>
          <RecipeRow recipes={recentRecipes} />
        </div>
      </section>
    </main>
  );
};

export default SignedOutHome;
