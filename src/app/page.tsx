import RecipeRow from "@/components/recipe-row";
import SearchRecipes from "@/components/search-recipes";
import { getFavoriteRecipes } from "@/server-actions/favorite-recipes";
import { getRecentRecipes } from "@/server-actions/recipes";
import Link from "next/link";

const Home = async () => {
  const recentRecipes = await getRecentRecipes(6);
  const favoriteRecipes = await getFavoriteRecipes(6);

  return (
    <main className="flex min-h-screen flex-col bg-[hsl(var(--surface))]">
      <SearchRecipes />

      {/* Favorites Section */}
      {favoriteRecipes.length > 0 && (
        <section className="bg-[hsl(var(--surface-container-low))] py-14 md:py-20">
          <div className="px-8 md:px-12 lg:pl-16 lg:pr-8">
            <div className="mb-10">
              <Link href="/favorite" className="group inline-block">
                <h2
                  className="text-2xl md:text-3xl font-semibold text-[hsl(var(--primary))] group-hover:opacity-80 transition-opacity duration-200"
                  style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
                >
                  Favorite Recipes
                </h2>
                <div className="h-0.5 w-0 group-hover:w-full bg-[hsl(var(--primary)/0.4)] transition-all duration-300 mt-1 rounded-full" />
              </Link>
              <p className="text-[hsl(var(--on-surface-variant))] mt-2 text-sm">
                Your curated collection
              </p>
            </div>
            <RecipeRow recipes={favoriteRecipes} />
          </div>
        </section>
      )}

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
    </main>
  );
};

export default Home;
