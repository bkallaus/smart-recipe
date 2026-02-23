'use client';
import { Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ingestRecipe } from '@/app/query';
import { insertIntoFailedIngest } from '@/server-actions/recipes';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';

const useRecipeIngest = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onMagicIngest = async (url: string) => {
    try {
      setLoading(true);

      if (!url?.includes('https://')) {
        toast({
          title: 'Invalid URL',
          description: `${url} is not valid. Please copy a valid URL`,
        });

        return null;
      }

      const recipeId = await ingestRecipe(url);

      toast({
        title: 'Ingested Recipe',
        description: `We've ingested the recipe for you, navigating now`,
      });

      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      console.error('failed to ingest:', error);
      if (url) {
        await insertIntoFailedIngest(url);
      }
      toast({
        title: 'Error Ingesting Recipe',
        description:
          'Your URL may be invalid or the recipe could not be ingested, Please copy a valid url.',
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
  const [url, setUrl] = useState('');

  return (
    <form
      className='flex gap-3'
      onSubmit={(e) => {
        e.preventDefault();
        onMagicIngest(url);
      }}
    >
      <Input
        type='url'
        required
        aria-label='Recipe URL'
        placeholder='Enter recipe URL'
        onChange={(e) => setUrl(e.target.value)}
        value={url}
      />
      <Button type='submit' disabled={loading} aria-busy={loading}>
        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        <Sparkles className='mr-1' /> Smart Ingest Recipe
      </Button>
    </form>
  );
};

export default RecipeIngest;
