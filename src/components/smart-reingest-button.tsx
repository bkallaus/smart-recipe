"use client";
import { fetchRecipeJsonLd, saveSmartIngestedRecipe } from "@/app/query";
import { deleteRecipe, insertIntoFailedIngest } from "@/server-actions/recipes";
import type { FullRecipe } from "@/types/recipe";
import { buildSmartIngestPrompt } from "@/helpers/ingest-helper";
import { Button } from "./ui/button";
import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";

const SmartReIngestButton = ({ recipe }: { recipe: FullRecipe }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const rescanRecipe = async () => {
    try {
      setLoading(true);
      console.log("Rescanning recipe", recipe);

      const jsonLd = await fetchRecipeJsonLd(recipe.url);
      const prompt = buildSmartIngestPrompt(jsonLd);

      const session = await window.ai.languageModel.create();
      const aiResponse = await session.prompt(prompt);

      const cleaned = aiResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const parsedRecipe = JSON.parse(cleaned);

      const newUrl = await saveSmartIngestedRecipe(parsedRecipe);

      await deleteRecipe(recipe.id);

      toast({
        title: "Recipe Updated",
        description: "Recipe has been rescanned and updated using built-in AI",
      });

      window.location.href = `/recipe/${newUrl}`;
    } catch (error) {
      console.error(error);
      toast({
        title: "Update Failed",
        description: "Recipe has failed to update",
      });
      await insertIntoFailedIngest(recipe.url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button disabled={loading} onClick={rescanRecipe}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin " />}{" "}
      <Sparkles className="mr-1" /> Smart Rescan
    </Button>
  );
};

export default SmartReIngestButton;
