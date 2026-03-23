'use client';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { searchRecipes } from '@/server-actions/recipes';
import type { RecipeCard } from '@/types/recipe';
import RecipeRow from './recipe-row';

const SearchRecipes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentRecipes, setRecentRecipes] = useState<RecipeCard[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [value] = useDebounce(searchTerm, 1000);

  const _searchForRecipes = async (search: string) => {
    const recipes = await searchRecipes(search);
    return recipes;
  };

  useEffect(() => {
    if (!value) {
      setRecentRecipes([]);
      return;
    }

    startTransition(async () => {
      const recipes = await searchRecipes(value);
      setRecentRecipes(recipes);
    });
  }, [value]);

  return (
    <div>
      {/* Hero Section — primary→primary-container 135° gradient */}
      <section className='w-full py-16 md:py-28 lg:py-36 gradient-hero relative overflow-hidden'>
        {/* Subtle texture overlay */}
        <div className='absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--surface-container-lowest))_0%,_transparent_60%)]' />

        <div className='container px-8 md:px-12 lg:pl-16 lg:pr-8 relative z-10'>
          <div className='grid gap-8 lg:grid-cols-2 lg:gap-16 items-center'>
            <div className='space-y-4'>
              <h1
                className='text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl text-[hsl(var(--on-primary))] leading-tight'
                style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
              >
                Find Your Next
                <br />
                <span className='italic font-normal opacity-90'>
                  Favorite Recipe
                </span>
              </h1>
              <p className='text-[hsl(var(--on-primary)/0.75)] text-lg max-w-sm'>
                Search through your curated collection of AI-enhanced recipes.
              </p>
            </div>

            {/* Input with ghost bottom border, primary on focus */}
            <div className='flex flex-col w-full relative'>
              <div className='relative'>
                <Search className='absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--on-surface-variant))]' />
                <input
                  ref={inputRef}
                  type='text'
                  id='recipe-search'
                  placeholder='Search for recipes…'
                  className='w-full pl-12 pr-14 py-4 text-base rounded-xl bg-[hsl(var(--surface-container-lowest)/0.95)] text-[hsl(var(--on-surface))] placeholder-[hsl(var(--on-surface-variant))] outline-none border-0 border-b-2 border-[hsl(var(--outline-variant)/0.3)] focus:border-[hsl(var(--primary))] transition-colors duration-200 shadow-ambient'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchTerm('');
                    }
                  }}
                />
                <div className='absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2'>
                  {isPending && (
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-[hsl(var(--primary))]' />
                  )}
                  {searchTerm && !isPending && (
                    <button
                      type='button'
                      aria-label='Clear search'
                      className='text-[hsl(var(--on-surface-variant))] hover:text-[hsl(var(--on-surface))] focus-visible:ring-2 rounded-full p-1 transition-colors'
                      onClick={() => {
                        setSearchTerm('');
                        inputRef.current?.focus();
                      }}
                    >
                      <X className='h-5 w-5' />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search results */}
      {(recentRecipes.length > 0 || isPending) && (
        <div className='px-8 md:px-12 lg:pl-16 lg:pr-8 py-12 bg-[hsl(var(--surface-container-low))]'>
          {isPending ? (
            <div className='flex justify-center items-center gap-3 py-12'>
              <div className='animate-spin rounded-full h-7 w-7 border-b-2 border-[hsl(var(--primary))]' />
              <span className='text-base text-[hsl(var(--on-surface-variant))]'>
                Searching…
              </span>
            </div>
          ) : (
            <RecipeRow recipes={recentRecipes} />
          )}
        </div>
      )}
    </div>
  );
};

export default SearchRecipes;
