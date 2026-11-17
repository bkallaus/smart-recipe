'use client';
import { Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { smartRescanRecipe } from '@/app/query';
import type { FullRecipe } from '@/types/recipe';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

const SmartReIngestButton = ({ recipe }: { recipe: FullRecipe }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const rescanRecipe = async () => {
    try {
      setLoading(true);

      // Updates the recipe in place, so it keeps its URL and favorites
      await smartRescanRecipe(recipe.uuid);

      toast({
        title: 'Recipe Updated',
        description: 'Recipe has been rescanned and updated',
      });

      router.refresh();
    } catch (error) {
      console.error('failed to rescan recipe:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Recipe has failed to update',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button disabled={loading} aria-busy={loading} onClick={rescanRecipe}>
      {loading ? (
        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
      ) : (
        <Sparkles className='mr-1' />
      )}
      Smart Rescan
    </Button>
  );
};

export default SmartReIngestButton;
