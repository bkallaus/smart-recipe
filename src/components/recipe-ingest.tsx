"use client";
import { ingestRecipe } from "@/app/query";
import { useToast } from "./ui/use-toast";

const RecipeIngest = () => {
  const { toast } = useToast();
  const onMagicIngest = async () => {
    try {
      const clipboardUrl = await navigator.clipboard.readText();

      if (!clipboardUrl.includes("https://")) {
        toast({
          title: "Invalid URL",
          description: "Please copy a valid URL",
        });
      }

      await ingestRecipe(clipboardUrl);

      toast({
        title: "Ingested Recipe",
        // description: `We've ingested the recipe for you ${mappedRecipe.name}`,
        description: `We've ingested the recipe for you`,
      });
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
