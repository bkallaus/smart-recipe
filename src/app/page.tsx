import CategoryGrid from "@/components/category-grid";
import PasteRecipe from "@/components/paste-recipe";
import RecipeRow from "@/components/recipe-row";
import SearchRecipes from "@/components/search-recipes";
import SignedOutHome from "@/components/signed-out-home";
import { getRecipeCategories } from "@/server-actions/categories";
import { getRecentRecipes } from "@/server-actions/recipes";
import { hasAccess } from "@/server-actions/verify-credentials";

const Home = async () => {
  if (!(await hasAccess())) {
    return <SignedOutHome />;
  }

  const [recentRecipes, categories] = await Promise.all([
    getRecentRecipes(6),
    getRecipeCategories(),
  ]);

  return (
    <main className="flex min-h-screen flex-col bg-[hsl(var(--surface))]">
      <SearchRecipes />

      {/* Recent Recipes Section */}
      <section className="bg-[hsl(var(--surface))] py-14 md:py-20">
        <div className="px-8 md:px-12 lg:pl-16 lg:pr-8">
          <div className="mb-10">
            <h2
              className="text-2xl md:text-3xl font-semibold text-[hsl(var(--on-surface))]"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              Recent Recipes
            </h2>
            <p className="text-[hsl(var(--on-surface-variant))] mt-2 text-sm">
              Freshly added to your kitchen
            </p>
          </div>
          <RecipeRow recipes={recentRecipes} />
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-[hsl(var(--surface-container))] py-14 md:py-20">
        <div className="px-8 md:px-12 lg:pl-16 lg:pr-8">
          <div className="mb-10">
            <h2
              className="text-2xl md:text-3xl font-semibold text-[hsl(var(--on-surface))]"
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              Categories
            </h2>
            <p className="text-[hsl(var(--on-surface-variant))] mt-2 text-sm">
              Browse your kitchen by course and occasion
            </p>
          </div>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* Paste Recipe Section */}
      <PasteRecipe />
    </main>
  );
};

export default Home;
