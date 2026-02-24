'use client';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { searchRecipes } from '@/server-actions/recipes';
import type { RecipeCard } from '@/types/recipe';
import RecipeRow from './recipe-row';
import { Input } from './ui/input';
import { Label } from './ui/label';

const SearchRecipes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentRecipes, setRecentRecipes] = useState<RecipeCard[]>([]);
  const [isPending, startTransition] = useTransition();

  const [value] = useDebounce(searchTerm, 1000);

  useEffect(() => {
    if (value) {
      startTransition(async () => {
        const recipes = await searchRecipes(value);
        setRecentRecipes(recipes);
      });
    }
  }, [value]);

  const clearSearch = () => {
    setSearchTerm('');
    setRecentRecipes([]);
  };

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
            {/* biome-ignore lint/a11y/useSemanticElements: form with role search is standard pattern */}
            <form
              role='search'
              className='flex flex-col w-full relative'
              onSubmit={(e) => e.preventDefault()}
            >
              <Label htmlFor='search-recipes' className='sr-only'>
                Search recipes
              </Label>
              <div className='relative'>
                <Search
                  className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500'
                  aria-hidden='true'
                />
                <Input
                  id='search-recipes'
                  type='text'
                  placeholder='Search for recipes'
                  className='pl-12 pr-12 h-14 text-lg rounded-lg shadow-sm bg-white'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && !isPending && (
                  <button
                    type='button'
                    onClick={clearSearch}
                    className='absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors'
                    aria-label='Clear search'
                  >
                    <X className='h-5 w-5 text-gray-500' />
                  </button>
                )}
                {isPending && (
                  // biome-ignore lint/a11y/useSemanticElements: div role status is standard for loading state
                  <div
                    className='absolute right-4 top-1/2 -translate-y-1/2'
                    role='status'
                  >
                    <Loader2 className='animate-spin h-5 w-5 text-gray-500' />
                    <span className='sr-only'>Searching...</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
      <div className='p-12 md:p-24 text-center'>
        {isPending ? (
          // biome-ignore lint/a11y/useSemanticElements: div role status is standard for loading state
          <div className='flex justify-center items-center' role='status'>
            <Loader2 className='animate-spin h-8 w-8 text-gray-900' />
            <span className='ml-2 text-lg'>Searching...</span>
          </div>
        ) : (
          <RecipeRow recipes={recentRecipes} />
        )}
      </div>
    </div>
  );
};

export default SearchRecipes;
