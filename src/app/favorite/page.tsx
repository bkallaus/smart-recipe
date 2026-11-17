import Link from 'next/link';
import RecipeRow from '@/components/recipe-row';
import { requireAccess } from '@/helpers/require-access';
import { getAllFavoriteRecipes } from '@/server-actions/favorite-recipes';

const FavoritePage = async () => {
  await requireAccess('/favorite');

  const favoriteRecipes = await getAllFavoriteRecipes();

  return (
    <main className='flex min-h-screen flex-col bg-[hsl(var(--surface))]'>
      <section className='bg-[hsl(var(--surface-container-low))] py-14 md:py-20'>
        <div className='px-8 md:px-12 lg:pl-16 lg:pr-8'>
          <h1 className='font-serif text-3xl md:text-4xl font-semibold text-[hsl(var(--on-surface))]'>
            Favorite Recipes
          </h1>
          <p className='text-[hsl(var(--on-surface-variant))] mt-2 text-sm'>
            {`${favoriteRecipes.length} ${
              favoriteRecipes.length === 1 ? 'recipe' : 'recipes'
            }`}
          </p>
          <div className='h-10' />
          {favoriteRecipes.length > 0 ? (
            <RecipeRow recipes={favoriteRecipes} />
          ) : (
            <p className='text-sm text-[hsl(var(--on-surface-variant))]'>
              You haven&apos;t saved any favorites yet. Open a recipe and choose
              &ldquo;Save to Favorites&rdquo; to keep it here, or{' '}
              <Link
                href='/'
                className='text-[hsl(var(--primary))] underline-offset-4 hover:underline'
              >
                browse your recipes
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default FavoritePage;
