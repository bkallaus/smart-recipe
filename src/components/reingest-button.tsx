"use client";
import { ingestRecipe } from "@/app/query";
import { deleteRecipe, insertIntoFailedIngest } from "@/server-actions/recipes";
import type { FullRecipe } from "@/types/recipe";
import { Button } from "./ui/button";
import { useState } from "react";
import { useToast } from "./ui/use-toast";

const RecipeIngestButton = ({ recipe }: { recipe: FullRecipe }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const rescanRecipe = async () => {
    try {
      setLoading(true);
      const newUrl = await ingestRecipe(recipe.url);

      await deleteRecipe(recipe.id);

      toast({
        title: "Recipe Updated",
        description: "Recipe has been rescanned and updated",
      });

      window.location.href = `/recipe/${newUrl}`;
    } catch (error) {
      toast({
        title: "Update Fialed",
        description: "Recipe has failed to update",
      });
      await insertIntoFailedIngest(recipe.url);
    } finally {
      setLoading(false);
    }
  };
  return <Button onClick={rescanRecipe}>Rescan</Button>;
};

export default RecipeIngestButton;
