"use client";
import { ingestRecipe } from "@/app/query";
import { useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { insertIntoFailedIngest } from "@/server-actions/recipes";
import { Input } from "./ui/input";

const useRecipeIngest = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onMagicIngest = async (url: string) => {
    try {
      setLoading(true);

      if (!url?.includes("https://")) {
        toast({
          title: "Invalid URL",
          description: `${url} is not valid. Please copy a valid URL`,
        });

        return null;
      }

      const recipeId = await ingestRecipe(url);

      toast({
        title: "Ingested Recipe",
        description: `We've ingested the recipe for you, navigating now`,
      });

      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      console.error("failed to ingest:", error);
      if (url) {
        await insertIntoFailedIngest(url);
      }
      toast({
        title: "Error Ingesting Recipe",
        description:
          "Your URL may be invalid or the recipe could not be ingested, Please copy a valid url.",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    onMagicIngest,
    loading,
  };
};

const RecipeIngest = () => {
  const { onMagicIngest, loading } = useRecipeIngest();
  const [url, setUrl] = useState("");

  return (
    <div className="flex gap-3">
      <Input
        placeholder="Enter recipe URL"
        onChange={(e) => setUrl(e.target.value)}
        value={url}
      />
      <Button
        type="button"
        disabled={loading}
        onClick={() => onMagicIngest(url)}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Sparkles className="mr-1" /> Smart Ingest Recipe
      </Button>
    </div>
  );
};

export default RecipeIngest;
