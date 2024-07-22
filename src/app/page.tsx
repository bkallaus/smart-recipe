import { getRecentRecipes } from "@/server-actions/recipes";
import RecipeRow from "@/components/recipe-row";
import RecipeIngest from "@/components/recipe-ingest";

const Home = async () => {
  const recentRecipes = await getRecentRecipes(9);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="text-center">
        <h2>Search for Recipe</h2>
        <div>or</div>
        <div>
          <RecipeIngest />
        </div>
        <RecipeRow recipes={recentRecipes} />
      </div>
    </main>
  );
};

export default Home;
