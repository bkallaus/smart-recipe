import RecipeRow from "@/components/recipe-row";
import { getAllFavoriteRecipes } from "@/server-actions/favorite-recipes";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const FavoritePage = async () => {
  const favoriteRecipes = await getAllFavoriteRecipes();

  return (
    <main className="flex min-h-screen flex-col items-center p-12 md:p-24">
      <div className="w-full max-w-6xl text-center">
        <h1 className="text-4xl font-semibold mb-8">Favorite Recipes</h1>

        {favoriteRecipes.length > 0 ? (
          <RecipeRow recipes={favoriteRecipes} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg shadow-sm border border-gray-100 mt-8">
            <Heart className="h-16 w-16 text-gray-200 mb-6" />
            <h2 className="text-2xl font-medium text-gray-900 mb-2">No favorite recipes yet</h2>
            <p className="text-gray-500 max-w-md text-center mb-8">
              You haven't added any recipes to your favorites. Explore existing recipes and add them to your collection!
            </p>
            <Button asChild>
              <Link href="/">
                Find Recipes
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default FavoritePage;
