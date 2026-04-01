'use client';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ingestRecipe } from '@/app/query';
import { deleteRecipe, insertIntoFailedIngest } from '@/server-actions/recipes';
import type { FullRecipe } from '@/types/recipe';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

const ReIngestButton = ({ recipe }: { recipe: FullRecipe }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const rescanRecipe = async () => {
    try {
      setLoading(true);
      const newUrl = await ingestRecipe(recipe.url, recipe.uuid);
      await deleteRecipe(recipe.id);

      toast({
        title: 'Recipe Updated',
        description: 'Recipe has been rescanned and updated',
      });

      window.location.href = `/recipe/${newUrl}`;
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Recipe has failed to update',
      });
      await insertIntoFailedIngest(recipe.url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button disabled={loading} onClick={rescanRecipe} aria-busy={loading}>
      {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />} Manual
      Rescan
    </Button>
  );
};

export default ReIngestButton;
