import Link from 'next/link';
import { notFound } from 'next/navigation';
import { titleCase } from 'title-case';
import RecipeRow from '@/components/recipe-row';
import { findCategoryBySlug } from '@/helpers/recipe-filters';
import { requireAccess } from '@/helpers/require-access';
import {
  getRecipeCategories,
  getRecipesInCategory,
} from '@/server-actions/categories';

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  await requireAccess(`/category/${slug}`);

  const categories = await getRecipeCategories();
  const category = findCategoryBySlug(categories, slug);

  if (!category) {
    notFound();
  }

  const recipes = await getRecipesInCategory(category);

  return (
    <main className='flex min-h-screen flex-col bg-[hsl(var(--surface))]'>
      <section className='bg-[hsl(var(--surface-container-low))] py-14 md:py-20'>
        <div className='px-8 md:px-12 lg:pl-16 lg:pr-8'>
          <div className='mb-10'>
            <h1
              className='text-3xl md:text-4xl font-semibold text-[hsl(var(--on-surface))]'
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              {titleCase(category)}
            </h1>
            <p className='text-[hsl(var(--on-surface-variant))] mt-2 text-sm'>
              {recipes.length === 1
                ? '1 recipe in this category'
                : `${recipes.length} recipes in this category`}
            </p>
          </div>

          {recipes.length > 0 ? (
            <RecipeRow recipes={recipes} />
          ) : (
            <p className='text-[hsl(var(--on-surface-variant))] text-sm'>
              No recipes in this category yet.
            </p>
          )}

          <div className='mt-12'>
            <Link
              href='/'
              className='text-sm font-semibold text-[hsl(var(--primary))] hover:opacity-80 transition-opacity duration-200'
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CategoryPage;
