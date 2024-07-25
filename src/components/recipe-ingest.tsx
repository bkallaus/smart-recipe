"use client";
import { ingestRecipe } from "@/app/query";
import { useToast } from "./ui/use-toast";
import { useRouter } from "next/navigation";

const RecipeIngest = () => {
  const { toast } = useToast();
  const router = useRouter();
  const onMagicIngest = async () => {
    try {
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
      toast({
        title: "Error Ingesting Recipe",
        description:
          "Your URL may be invalid or the recipe could not be ingested",
      });
    }
  };

  return (
    <div>
      <button
        className="border border-slate-300 rounded p-3"
        onClick={onMagicIngest}
      >
        Ingest Recipe
      </button>
    </div>
  );
};

export default RecipeIngest;
