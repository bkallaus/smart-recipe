'use client';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { searchRecipes } from '@/server-actions/recipes';
import type { RecipeCard } from '@/types/recipe';
import RecipeRow from './recipe-row';
import { Button } from './ui/button';

const SearchRecipes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentRecipes, setRecentRecipes] = useState<RecipeCard[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [value] = useDebounce(searchTerm, 1000);

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
      <section className='w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-indigo-50'>
        <div className='container px-4 md:px-6'>
          <div className='grid gap-6 lg:grid-cols-2 lg:gap-12 items-center'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none'>
                Search through existing recipes
              </h1>
            </div>
            <div className='flex flex-col w-full relative'>
              <div className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
                <Search className='h-5 w-5' />
              </div>
              <input
                ref={inputRef}
                type='text'
                aria-label='Search recipes'
                placeholder='Search for recipes or ingredients'
                className='form-search rounded-lg w-full p-4 pl-12 pr-24'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('');
                    setRecentRecipes([]);
                  }
                }}
              />
              {searchTerm && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-4 top-1/2 -translate-y-1/2 hover:bg-transparent'
                  onClick={() => {
                    setSearchTerm('');
                    setRecentRecipes([]);
                    inputRef.current?.focus();
                  }}
                  aria-label='Clear search'
                >
                  <X className='h-4 w-4' />
                </Button>
              )}
              {isPending && (
                <div className='absolute right-16 top-1/2 -translate-y-1/2'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900' />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {(isPending || searchTerm || recentRecipes.length > 0) && (
        <div className='p-12 md:p-24 text-center'>
          {isPending ? (
            <div className='flex justify-center items-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900' />
              <span className='ml-2 text-lg'>Searching...</span>
            </div>
          ) : recentRecipes.length > 0 ? (
            <RecipeRow recipes={recentRecipes} />
          ) : searchTerm ? (
            <div className='flex flex-col items-center justify-center text-gray-500 py-8'>
              <Search className='h-12 w-12 mb-4 text-gray-300' />
              <p className='text-xl font-medium'>No recipes found</p>
              <p className='text-sm mt-2'>
                We couldn't find any recipes or ingredients matching "
                {searchTerm}"
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchRecipes;
