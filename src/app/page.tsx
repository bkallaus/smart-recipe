import Link from 'next/link';
import { titleCase } from 'title-case';
import PasteRecipe from '@/components/paste-recipe';
import RecipeRow from '@/components/recipe-row';
import SearchRecipes from '@/components/search-recipes';
import SignedOutHome from '@/components/signed-out-home';
import { toCategorySlugs } from '@/helpers/recipe-filters';
import { getRecipeCategories } from '@/server-actions/categories';
import { getRecentRecipes } from '@/server-actions/recipes';
import { hasAccess } from '@/server-actions/verify-credentials';

const Home = async () => {
  if (!(await hasAccess())) {
    return <SignedOutHome />;
  }

  const [recentRecipes, categories] = await Promise.all([
    getRecentRecipes(6),
    getRecipeCategories(),
  ]);
  const categoryLinks = toCategorySlugs(categories);

  return (
    <main className='flex min-h-screen flex-col bg-[hsl(var(--surface))]'>
      <SearchRecipes />

      {/* Recent Recipes Section */}
      <section className='bg-[hsl(var(--surface))] py-14 md:py-20'>
        <div className='px-8 md:px-12 lg:pl-16 lg:pr-8'>
          <div className='mb-10'>
            <h2
              className='text-2xl md:text-3xl font-semibold text-[hsl(var(--on-surface))]'
              style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
            >
              Recent Recipes
            </h2>
            <p className='text-[hsl(var(--on-surface-variant))] mt-2 text-sm'>
              Freshly added to your kitchen
            </p>
          </div>
          <RecipeRow recipes={recentRecipes} />
        </div>
      </section>

      {/* Categories Section */}
      {categoryLinks.length > 0 && (
        <section className='bg-[hsl(var(--surface-container-low))] py-14 md:py-20'>
          <div className='px-8 md:px-12 lg:pl-16 lg:pr-8'>
            <div className='mb-10'>
              <h2
                className='text-2xl md:text-3xl font-semibold text-[hsl(var(--on-surface))]'
                style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
              >
                Categories
              </h2>
              <p className='text-[hsl(var(--on-surface-variant))] mt-2 text-sm'>
                Browse your recipes by category
              </p>
            </div>
            <ul className='flex flex-wrap gap-3'>
              {categoryLinks.map(({ name, slug }) => (
                <li key={slug}>
                  <Link
                    href={`/category/${slug}`}
                    className='inline-block rounded-full bg-[hsl(var(--surface-container-lowest))] px-5 py-2 text-sm font-medium text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] transition-colors duration-200'
                    style={{
                      boxShadow: '0 8px 24px hsl(var(--on-surface) / 0.05)',
                    }}
                  >
                    {titleCase(name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Paste Recipe Section */}
      <PasteRecipe />
    </main>
  );
};

export default Home;
