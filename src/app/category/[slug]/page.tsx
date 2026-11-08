import Link from 'next/link';
import RecipeRow from '@/components/recipe-row';
import { requireAccess } from '@/helpers/require-access';
import { getCategoryRecipes } from '@/server-actions/categories';

type Props = { params: Promise<{ slug: string }> };

const CategoryPage = async ({ params }: Props) => {
  const { slug } = await params;
  await requireAccess(`/category/${slug}`);

  const result = await getCategoryRecipes(slug);

  return (
    <main className='flex min-h-screen flex-col bg-[hsl(var(--surface))] px-8 py-14 md:px-12 md:py-20 lg:pl-16 lg:pr-8'>
      <div className='mb-10'>
        <Link
          href='/'
          className='text-sm text-[hsl(var(--primary))] hover:opacity-80'
        >
          &larr; Home
        </Link>
        <h1
          className='mt-4 text-3xl md:text-4xl font-semibold text-[hsl(var(--on-surface))]'
          style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
        >
          {result ? result.category : 'Category not found'}
        </h1>
      </div>
      {result && result.recipes.length > 0 ? (
        <RecipeRow recipes={result.recipes} />
      ) : (
        <p className='text-[hsl(var(--on-surface-variant))]'>
          {result
            ? 'No recipes in this category yet.'
            : "We couldn't find a category with that name."}
        </p>
      )}
    </main>
  );
};

export default CategoryPage;
