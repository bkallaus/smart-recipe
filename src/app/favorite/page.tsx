import { Search } from 'lucide-react';
import Link from 'next/link';
import RecipeRow from '@/components/recipe-row';
import { Button } from '@/components/ui/button';
import { getAllFavoriteRecipes } from '@/server-actions/favorite-recipes';

const FavoritePage = async () => {
  const favoriteRecipes = await getAllFavoriteRecipes();

  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      <div className='text-center w-full'>
        <h1 className='text-4xl font-semibold'>Favorite Recipes</h1>
        <div className='h-5' />

        {favoriteRecipes.length === 0 ? (
          <div className='flex flex-col items-center justify-center text-gray-500 py-16 px-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 mt-8'>
            <Search className='h-12 w-12 mb-4 text-gray-300' />
            <p className='text-xl font-medium text-gray-700'>
              No favorite recipes yet
            </p>
            <p className='text-sm mt-2 mb-6'>
              Find a recipe you like and click "Add to Favorites" to see it
              here.
            </p>
            <Button asChild variant='outline'>
              <Link href='/'>Discover Recipes</Link>
            </Button>
          </div>
        ) : (
          <RecipeRow recipes={favoriteRecipes} />
        )}
      </div>
    </main>
  );
};

export default FavoritePage;
