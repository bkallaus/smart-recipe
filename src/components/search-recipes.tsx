'use client';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useDebounce } from 'use-debounce';
import { searchRecipes } from '@/server-actions/recipes';
import type { RecipeCard } from '@/types/recipe';
import RecipeRow from './recipe-row';

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
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
              <input
                type='text'
                aria-label='Search recipes'
                placeholder='Search for recipes'
                className='form-search rounded-lg w-full p-4 pl-12'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isPending ? (
                <div className='absolute right-4 top-1/2 transform -translate-y-1/2'>
                  <Loader2 className='animate-spin h-5 w-5 text-gray-400' />
                </div>
              ) : searchTerm ? (
                <button
                  type='button'
                  onClick={() => setSearchTerm('')}
                  className='absolute right-4 top-1/2 transform -translate-y-1/2'
                  aria-label='Clear search'
                >
                  <X className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <div className='p-12 md:p-24 text-center'>
        {isPending ? (
          <div className='flex justify-center items-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900' />
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
