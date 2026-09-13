'use client';
import { ClipboardPaste, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ingestRecipeFromText } from '@/app/query';
import { useToast } from './ui/use-toast';

const MIN_RECIPE_LENGTH = 40;

const usePasteRecipe = () => {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onPasteIngest = async (recipeText: string) => {
    const text = recipeText.trim();

    if (text.length < MIN_RECIPE_LENGTH) {
      toast({
        title: 'Recipe Too Short',
        description:
          'Paste the full recipe, including the ingredients and the steps.',
      });

      return;
    }

    try {
      setLoading(true);

      const recipeId = await ingestRecipeFromText(text);

      toast({
        title: 'Ingested Recipe',
        description: `We've ingested the recipe for you, navigating now`,
      });

      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      console.error('failed to ingest pasted recipe:', error);
      toast({
        title: 'Error Ingesting Recipe',
        description:
          'We could not read that recipe. Make sure the ingredients and steps are included, then try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    onPasteIngest,
    loading,
  };
};

const PasteRecipe = () => {
  const { onPasteIngest, loading } = usePasteRecipe();
  const [recipeText, setRecipeText] = useState('');

  return (
    <section className='bg-[hsl(var(--surface-container-low))] py-14 md:py-20'>
      <div className='px-8 md:px-12 lg:pl-16 lg:pr-8'>
        <div className='mb-10'>
          <h2
            className='text-2xl md:text-3xl font-semibold text-[hsl(var(--on-surface))]'
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Paste a Recipe
          </h2>
          <p className='text-[hsl(var(--on-surface-variant))] mt-2 text-sm'>
            No link? Paste the recipe text and let AI sort it out.
          </p>
        </div>

        <form
          className='flex flex-col gap-4 max-w-3xl'
          onSubmit={(e) => {
            e.preventDefault();
            onPasteIngest(recipeText);
          }}
        >
          <textarea
            required
            rows={10}
            aria-label='Recipe text'
            placeholder='Paste the full recipe here — title, ingredients and steps.'
            onChange={(e) => setRecipeText(e.target.value)}
            value={recipeText}
            className='w-full px-5 py-4 rounded-xl bg-[hsl(var(--surface-container-highest))] text-[hsl(var(--on-surface))] placeholder-[hsl(var(--on-surface-variant))] outline-none border-0 border-b-2 border-[hsl(var(--outline-variant)/0.3)] focus:border-[hsl(var(--primary))] transition-colors duration-200 text-base resize-y'
          />
          <div>
            <button
              type='submit'
              disabled={loading}
              aria-busy={loading}
              className='flex items-center gap-2 px-6 py-3 gradient-primary text-white text-sm font-medium rounded-full shadow-ambient transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
            >
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <ClipboardPaste className='h-4 w-4' />
              )}
              {loading ? 'Reading Recipe…' : 'Parse Recipe'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default PasteRecipe;
