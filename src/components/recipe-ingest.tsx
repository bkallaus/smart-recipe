'use client';
import { Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ingestRecipe } from '@/app/query';
import { insertIntoFailedIngest } from '@/server-actions/recipes';
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
      <input
        type='url'
        required
        aria-label='Recipe URL'
        placeholder='Enter recipe URL'
        onChange={(e) => setUrl(e.target.value)}
        value={url}
        className="flex-1 min-w-0 px-4 py-2 rounded-xl bg-[hsl(var(--surface-container-highest))] text-[hsl(var(--on-surface))] placeholder-[hsl(var(--on-surface-variant))] outline-none border-0 border-b-2 border-[hsl(var(--outline-variant)/0.3)] focus:border-[hsl(var(--primary))] transition-colors duration-200 text-sm"
      />
      <button
        type='submit'
        disabled={loading}
        aria-busy={loading}
        className="flex items-center gap-2 px-5 py-2 gradient-primary text-white text-sm font-medium rounded-full shadow-ambient transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading && <Loader2 className='h-4 w-4 animate-spin' />}
        <Sparkles className='h-4 w-4' /> Smart Ingest
      </button>
    </form>
  );
};

export default RecipeIngest;
