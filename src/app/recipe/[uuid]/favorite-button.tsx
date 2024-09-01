"use client";
import { Button } from "@/components/ui/button";
import { toggleFavoriteRecipe } from "@/server-actions/favorite-recipes";
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
    <Button disabled={isLoading} variant={"outline"} onClick={onToggle}>
      {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
    </Button>
  );
};

export default FavoriteButton;
