"use client";
import { searchRecipes } from "@/server-actions/recipes";
import type { RecipeCard } from "@/types/recipe";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import RecipeRow from "./recipe-row";

const SearchRecipes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [recentRecipes, setRecentRecipes] = useState<RecipeCard[]>([]);

  const [value] = useDebounce(searchTerm, 1000);

  const searchForRecipes = async (search: string) => {
    const recipes = await searchRecipes(search);

    return recipes;
  };

  useEffect(() => {
    if (value) {
      searchForRecipes(value).then((recipes) => {
        setRecentRecipes(recipes);
      });
    }
  }, [value]);

  return (
    <div>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Search through existing recipes
              </h1>
            </div>
            <input
              type="text"
              placeholder="Search for recipes"
              className="form-search rounded-lg w-full p-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>
      <RecipeRow recipes={recentRecipes} />
    </div>
  );
};

export default SearchRecipes;
