"use client";
import { Button } from "@/components/ui/button";
import { toggleFavoriteRecipe } from "@/server-actions/favorite-recipes";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FavoriteButton = ({
  uuid,
  isFavorite,
}: {
  uuid: string;
  isFavorite: boolean;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onToggle = async () => {
    setIsLoading(true);
    await toggleFavoriteRecipe(uuid);
    router.refresh();
    setIsLoading(false);
  };

  return (
    <Button
      disabled={isLoading}
      aria-busy={isLoading}
      variant={"outline"}
      onClick={onToggle}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
    </Button>
  );
};

export default FavoriteButton;
