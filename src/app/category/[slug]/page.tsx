import Link from 'next/link';
import RecipeRow from '@/components/recipe-row';
import { requireAccess } from '@/helpers/require-access';
import { getCategoryRecipes } from '@/server-actions/categories';

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  await requireAccess(`/category/${slug}`);

  const result = await getCategoryRecipes(slug);

  return (
    <main className='flex min-h-screen flex-col bg-[hsl(var(--surface))]'>
      <section className='bg-[hsl(var(--surface-container-low))] py-14 md:py-20'>
        <div className='px-8 md:px-12 lg:pl-16 lg:pr-8'>
          <Link
            href='/'
            className='text-sm text-[hsl(var(--on-surface-variant))] hover:text-[hsl(var(--primary))] transition-colors duration-200'
          >
            &larr; All categories
          </Link>
          <h1
            className='mt-4 text-3xl md:text-4xl font-semibold text-[hsl(var(--on-surface))]'
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            {result ? result.category.name : 'Category not found'}
          </h1>
          <p className='text-[hsl(var(--on-surface-variant))] mt-2 text-sm'>
            {result
              ? `${result.recipes.length} ${
                  result.recipes.length === 1 ? 'recipe' : 'recipes'
                }`
              : "We couldn't find a recipe category with that name."}
          </p>
          <div className='h-10' />
          {result && result.recipes.length > 0 ? (
            <RecipeRow recipes={result.recipes} />
          ) : (
            <p className='text-sm text-[hsl(var(--on-surface-variant))]'>
              No recipes to show here yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default CategoryPage;
