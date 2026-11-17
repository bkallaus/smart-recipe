'use server';
import ogs from 'open-graph-scraper';
import { z } from 'zod';
import { findRecipeSource, replaceRecipeContent } from '@/lib/recipe-rescan';
import { toggleFavoriteRecipe } from '@/server-actions/favorite-recipes';
import { insertIntoFailedIngest, insertRecipe } from '@/server-actions/recipes';
import { getUser } from '@/server-actions/verify-credentials';
import type { IngestRecipe } from '@/types/ingest';
import {
  convertJsonLdToIngest,
  findRecipeIngredients,
  htmlToRecipeText,
  parseRecipeText,
  smartIngest,
  withRecipeName,
} from '../helpers/ingest-helper';
import { MAX_RECIPE_TEXT_LENGTH } from '../helpers/ingest-limits';
import {
  extractMicrodataRecipe,
  getPageTitle,
  getRecipeSectionHtml,
} from '../helpers/recipe-html';
import { assertSafeUrl, fetchPublicHtml } from '../helpers/safe-url';

// Many recipe sites reject requests without a browser user agent
const FETCH_OPTIONS = {
  headers: {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
  },
};

const requireUser = async () => {
  const user = await getUser();

  if (!user?.email) {
    throw new Error('You must be signed in to import recipes');
  }

  return user;
};

// The page is fetched here, with every redirect hop checked against private
// and internal addresses, and only the HTML is handed to open-graph-scraper,
// so the scraper itself never makes a request
const scrapeRecipePage = async (url: string) => {
  const html = await fetchPublicHtml(url, FETCH_OPTIONS);
  const results = await ogs({ html });

  if (results.error) {
    throw new Error('Could not ingest recipe');
  }

  return { result: results.result, html };
};

type ScrapedPage = Awaited<ReturnType<typeof scrapeRecipePage>>;

// Last resort for pages without structured recipe data: let the model read
// the recipe card, or the whole page when there is no card
const parseRecipePage = async (
  html: string | undefined,
  url: string,
): Promise<IngestRecipe> => {
  const text = html ? htmlToRecipeText(getRecipeSectionHtml(html)) : '';

  if (!text) {
    throw new Error('No recipe data found and the page has no readable text');
  }

  const mappedRecipe = await parseRecipeText(text);

  if (!mappedRecipe) {
    throw new Error(
      'No recipe data found and the AI could not find a recipe in the page text',
    );
  }

  return { ...mappedRecipe, url };
};

const nameFromPage = (recipe: IngestRecipe, { result, html }: ScrapedPage) =>
  withRecipeName(
    recipe,
    result.ogTitle,
    result.twitterTitle,
    getPageTitle(html),
  );

const findStructuredRecipe = async (page: ScrapedPage, url: string) => {
  const recipe =
    (await convertJsonLdToIngest(page.result.jsonLD, url)) ??
    extractMicrodataRecipe(page.html, url);

  return recipe ? nameFromPage(recipe, page) : null;
};

const scrapeRecipe = async (url: string): Promise<IngestRecipe> => {
  const page = await scrapeRecipePage(url);

  return (
    (await findStructuredRecipe(page, url)) ??
    (await parseRecipePage(page.html, url))
  );
};

// Lets the model clean up the JSON-LD (sections, metadata in the description)
const smartScrapeRecipe = async (url: string): Promise<IngestRecipe> => {
  const page = await scrapeRecipePage(url);

  if (findRecipeIngredients(page.result.jsonLD)) {
    const mappedRecipe = await smartIngest(page.result.jsonLD);

    if (!mappedRecipe) {
      throw new Error('The AI could not parse the recipe JSON-LD');
    }

    // Keep the scraped page's URL, never one the model made up
    return { ...mappedRecipe, url };
  }

  const microdata = extractMicrodataRecipe(page.html, url);

  return microdata
    ? nameFromPage(microdata, page)
    : parseRecipePage(page.html, url);
};

const saveIngestedRecipe = async (mappedRecipe: IngestRecipe) => {
  const result = await insertRecipe(mappedRecipe);

  if (!result) {
    throw new Error('Failed to insert recipe');
  }

  // The recipe is saved at this point; failing here would make the user retry
  // and import a duplicate
  try {
    await toggleFavoriteRecipe(result.uuid);
  } catch (error) {
    console.error('failed to favorite ingested recipe:', error);
  }

  return result.uuid;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  // open-graph-scraper rejects with its result object instead of an Error
  const ogsError = (error as { result?: { error?: string } } | null)?.result
    ?.error;

  if (ogsError) {
    return ogsError;
  }

  return typeof error === 'string' ? error : JSON.stringify(error);
};

// Logs the failure with its error on the server, where the message is still
// available (Next.js hides server action errors from the client in production)
const withFailedIngestLog = async <T>(
  url: string,
  ingest: () => Promise<T>,
): Promise<T> => {
  try {
    return await ingest();
  } catch (error) {
    try {
      await insertIntoFailedIngest(url, getErrorMessage(error));
    } catch (logError) {
      console.error('failed to log failed ingest:', logError);
    }

    throw error;
  }
};

export const ingestRecipe = async (url: string) => {
  await requireUser();
  // Rejected URLs are not logged as failed ingests: they are not recipe pages
  const safeUrl = (await assertSafeUrl(url)).toString();

  return withFailedIngestLog(safeUrl, async () =>
    saveIngestedRecipe(await scrapeRecipe(safeUrl)),
  );
};

const recipeUuidSchema = z.guid();

/**
 * Re-scrapes a recipe's source page with the AI-assisted parser and replaces
 * its content in place. The recipe keeps its uuid, url and favorites; if the
 * scrape or parse fails, the recipe is left unchanged.
 */
export const smartRescanRecipe = async (uuid: string) => {
  await requireUser();

  const parsedUuid = recipeUuidSchema.safeParse(uuid);

  if (!parsedUuid.success) {
    throw new Error('Recipe not found');
  }

  const existing = await findRecipeSource(parsedUuid.data);

  if (!existing) {
    throw new Error('Recipe not found');
  }

  if (!existing.url) {
    throw new Error('This recipe has no source URL to rescan');
  }

  const safeUrl = (await assertSafeUrl(existing.url)).toString();

  await withFailedIngestLog(safeUrl, async () => {
    const recipe = await smartScrapeRecipe(safeUrl);
    await replaceRecipeContent(existing.id, recipe);
  });

  return parsedUuid.data;
};

export const ingestRecipeFromText = async (recipeText: string) => {
  await requireUser();

  const text = typeof recipeText === 'string' ? recipeText.trim() : '';

  if (!text) {
    throw new Error('Recipe text is required');
  }

  if (text.length > MAX_RECIPE_TEXT_LENGTH) {
    throw new Error(
      `Recipe text is too long (max ${MAX_RECIPE_TEXT_LENGTH} characters)`,
    );
  }

  const mappedRecipe = await parseRecipeText(text);

  if (!mappedRecipe) {
    throw new Error('Could not parse recipe text');
  }

  // The pasted text has no page to scrape, so only keep links the model
  // found inside the text itself.
  const url = /^https?:\/\//i.test(mappedRecipe.url) ? mappedRecipe.url : '';

  return saveIngestedRecipe({ ...mappedRecipe, url });
};
