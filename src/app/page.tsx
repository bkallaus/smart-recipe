import RecipeRow from "@/components/recipe-row";
import SearchRecipes from "@/components/search-recipes";
import { getFavoriteRecipes } from "@/server-actions/favorite-recipes";
import { getRecentRecipes } from "@/server-actions/recipes";
import Link from "next/link";

const Home = async () => {
  let recentRecipes: Awaited<ReturnType<typeof getRecentRecipes>> = [];
  let favoriteRecipes: Awaited<ReturnType<typeof getFavoriteRecipes>> = [];

  try {
    recentRecipes = await getRecentRecipes(6);
  } catch (error) {
    console.warn("Failed to fetch recent recipes in page:", error);
  }

  try {
    favoriteRecipes = await getFavoriteRecipes(6);
  } catch (error) {
    console.warn("Failed to fetch favorite recipes in page:", error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div>
        <SearchRecipes />
        <div className="p-12 md:p-24  text-center">
          <div className="h-5" />
          {recentRecipes.length && (
            <>
              <Link href="/favorite">
                <h2 className="text-2xl font-semibold mt-8 hover:underline">
                  Favorite Recipes
                </h2>
              </Link>
              <RecipeRow recipes={favoriteRecipes} />
            </>
          )}
          <div className="h-8" />
          <h2 className="text-2xl font-semibold mt-8">Recent Recipes</h2>
          <RecipeRow recipes={recentRecipes} />
        </div>
      </div>
    </main>
  );
};

export default Home;
