"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { toggleFavoriteRecipe } from "@/server-actions/favorite-recipes";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

const FavoriteButton = ({
  uuid,
  isFavorite,
}: {
  uuid: string;
  isFavorite: boolean;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onToggle = async () => {
    setIsLoading(true);
    try {
      await toggleFavoriteRecipe(uuid);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      toast({
        title: "Error",
        description: isFavorite
          ? "Couldn't remove this recipe from your favorites. Please try again."
          : "Couldn't save this recipe to your favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      loading={isLoading}
      onClick={onToggle}
      className={cn(
        "rounded-full px-6 font-semibold transition-all duration-300",
        isFavorite 
          ? "bg-[hsl(var(--surface-container-highest))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))] border-0 shadow-none"
          : "gradient-primary text-white hover:opacity-90 border-0 shadow-ambient-md"
      )}
    >
      {isFavorite ? "Saved to Favorites" : "Save to Favorites"}
    </Button>
  );
};

export default FavoriteButton;
