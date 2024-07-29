import RecipeIngest from "@/components/recipe-ingest";
import RecipeRow from "@/components/recipe-row";
import SearchRecipes from "@/components/search-recipes";
import { getRecentRecipes } from "@/server-actions/recipes";
import { hasAccess } from "@/server-actions/verify-credentials";

const Home = async () => {
  const recentRecipes = await getRecentRecipes(9);

  if (!(await hasAccess())) {
    return (
      <main>
        <div className="m-auto text-xl font-bold text-center">
          Please Login to Access Site
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold">Welcome to Smart Recipes</h1>
        <div className="h-5" />
        <RecipeIngest />
        <SearchRecipes />
        <div className="h-5" />
        <h2 className="text-2xl font-semibold mt-8">Recent Recipes</h2>
        <RecipeRow recipes={recentRecipes} />
      </div>
    </main>
  );
};

export default Home;
