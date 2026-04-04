'use client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleFavoriteRecipe } from '@/server-actions/favorite-recipes';

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
    try {
      await toggleFavoriteRecipe(uuid);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      disabled={isLoading}
      aria-busy={isLoading}
      onClick={onToggle}
      className={cn(
        'rounded-full px-6 font-semibold transition-all duration-300',
        isFavorite
          ? 'bg-[hsl(var(--surface-container-highest))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))] border-0 shadow-none'
          : 'gradient-primary text-white hover:opacity-90 border-0 shadow-ambient-md',
      )}
    >
      {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
      {isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}
    </Button>
  );
};

export default FavoriteButton;
