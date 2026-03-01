import RecipeRow from "@/components/recipe-row";
import { getAllFavoriteRecipes } from "@/server-actions/favorite-recipes";

const FavoritePage = async () => {
  let favoriteRecipes: Awaited<ReturnType<typeof getAllFavoriteRecipes>> = [];
  try {
    favoriteRecipes = await getAllFavoriteRecipes();
  } catch (error) {
    console.warn("Failed to fetch favorite recipes:", error);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">Favorite Recipes</h1>
        <div className="h-5" />
        <RecipeRow recipes={favoriteRecipes} />
      </div>
    </main>
  );
};

export default FavoritePage;
