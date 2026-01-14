import RecipeRow from "@/components/recipe-row";
import { getFavoriteRecipes } from "@/server-actions/favorite-recipes";
import { getRecentRecipes } from "@/server-actions/recipes";

const Home = async () => {
  const recentRecipes = await getRecentRecipes(6);
  const favoriteRecipes = await getFavoriteRecipes(6);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div>
        <div className="p-12 md:p-24  text-center">
          <div className="h-5" />
          {recentRecipes.length && (
            <>
              <a href="/favorite">
                <h2 className="text-2xl font-semibold mt-8 hover:underline">
                  Favorite Recipes
                </h2>
              </a>
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
