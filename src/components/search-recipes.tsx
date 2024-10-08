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
      <input
        type="text"
        placeholder="Search for recipes"
        className="form-search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <RecipeRow recipes={recentRecipes} />
    </div>
  );
};

export default SearchRecipes;
