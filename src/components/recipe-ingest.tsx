"use client";
import { ingestRecipe } from "@/app/query";
import { useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { Button } from "./ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const RecipeIngest = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onMagicIngest = async () => {
    try {
      setLoading(true);
      const clipboardUrl = await navigator.clipboard.readText();

      if (!clipboardUrl.includes("https://")) {
        toast({
          title: "Invalid URL",
          description: "Please copy a valid URL",
        });
      }

      const recipeId = await ingestRecipe(clipboardUrl);

      toast({
        title: "Ingested Recipe",
        description: `We've ingested the recipe for you, navigating now`,
      });

      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      console.error("failed to ingest:", error);
      toast({
        title: "Error Ingesting Recipe",
        description:
          "Your URL may be invalid or the recipe could not be ingested",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button type="button" disabled={loading} onClick={onMagicIngest}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Ingest Recipe
      </Button>
    </div>
  );
};

export default RecipeIngest;
