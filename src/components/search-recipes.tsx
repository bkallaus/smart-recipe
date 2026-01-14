"use client";
import { searchRecipes } from "@/server-actions/recipes";
import type { RecipeCard } from "@/types/recipe";
import { useEffect, useState, useTransition } from "react";
import { useDebounce } from "use-debounce";
import RecipeRow from "./recipe-row";

const SearchRecipes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [recentRecipes, setRecentRecipes] = useState<RecipeCard[]>([]);
  const [isPending, startTransition] = useTransition();

  const [value] = useDebounce(searchTerm, 1000);

  const searchForRecipes = async (search: string) => {
    const recipes = await searchRecipes(search);

    return recipes;
  };

  useEffect(() => {
    if (value) {
      startTransition(async () => {
        const recipes = await searchForRecipes(value);
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
            <div className="flex flex-col w-full relative">
              <input
                type="text"
                placeholder="Search for recipes"
                className="form-search rounded-lg w-full p-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isPending && (
                <div className="absolute right-4 top-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="p-12 md:p-24 text-center">
        {isPending ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <span className="ml-2 text-lg">Searching...</span>
          </div>
        ) : (
          <RecipeRow recipes={recentRecipes} />
        )}
      </div>
    </div>
  );
};

export default SearchRecipes;
