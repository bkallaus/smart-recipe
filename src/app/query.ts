'use server';
import { insertIntoFailedIngest, insertRecipe } from '@/server-actions/recipes';
import ogs from 'open-graph-scraper';
import {
    convertJsonLdToIngest,
    findRecipeIngredients,
    htmlToRecipeText,
    parseRecipeText,
    smartIngest,
} from '../helpers/ingest-helper';
import {
    extractMicrodataRecipe,
    getRecipeSectionHtml,
} from '../helpers/recipe-html';
import type { IngestRecipe } from '@/types/ingest';
import { toggleFavoriteRecipe } from '@/server-actions/favorite-recipes';
import { downloadUploadImage } from '@/server-actions/image-service';

// Many recipe sites reject requests without a browser user agent
const FETCH_OPTIONS = {
    headers: {
        'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
    },
};

const scrapeRecipePage = async (url: string) => {
    const results = await ogs({ url, fetchOptions: FETCH_OPTIONS });

    if (results.error) {
        throw new Error('Could not ingest recipe');
    }

    return results;
};

// Last resort for pages without structured recipe data: let the model read
// the recipe card, or the whole page when there is no card
const parseRecipePage = async (
    html: string | undefined,
    url: string,
    ogImage: string | undefined,
): Promise<IngestRecipe> => {
    const text = html ? htmlToRecipeText(getRecipeSectionHtml(html)) : '';

    if (!text) {
        throw new Error('No recipe data found and the page has no readable text');
    }

    const mappedRecipe = await parseRecipeText(text);

    if (!mappedRecipe) {
        throw new Error(
            'No recipe data found and the AI could not parse the page text',
        );
    }

    if (!mappedRecipe.name || !mappedRecipe.ingredients?.length) {
        throw new Error(
            'No recipe data found and the AI found no recipe in the page text',
        );
    }

    return {
        ...mappedRecipe,
        steps: mappedRecipe.steps ?? [],
        url,
        heroImage: ogImage ?? '',
    };
};

const findStructuredRecipe = async (
    jsonLD: unknown,
    html: string | undefined,
    url: string,
    ogImage: string | undefined,
) =>
    (await convertJsonLdToIngest(jsonLD, url)) ??
    (html ? extractMicrodataRecipe(html, url, ogImage) : null);

const saveIngestedRecipe = async (mappedRecipe: IngestRecipe, uuid?: string) => {
    if (mappedRecipe.heroImage) {
        const remappedHeroImage = await downloadUploadImage(mappedRecipe.heroImage);
        if (remappedHeroImage) {
            mappedRecipe.heroImage = remappedHeroImage;
        }
    }

    const result = await insertRecipe(mappedRecipe, uuid);

    if (!result) {
        throw new Error('Failed to insert recipe');
    }

    await toggleFavoriteRecipe(result.uuid);

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

const scrapeAndSaveRecipe = async (url: string, uuid?: string) => {
    const { result, html } = await scrapeRecipePage(url);

    const ogImage = result.ogImage?.[0]?.url;
    const mappedRecipe =
        (await findStructuredRecipe(result.jsonLD, html, url, ogImage)) ??
        (await parseRecipePage(html, url, ogImage));

    return saveIngestedRecipe(mappedRecipe, uuid);
};

const smartScrapeAndSaveRecipe = async (url: string) => {
    const { result, html } = await scrapeRecipePage(url);

    if (findRecipeIngredients(result.jsonLD)) {
        const mappedRecipe = await smartIngest(result.jsonLD);

        if (!mappedRecipe) {
            throw new Error('The AI could not parse the recipe JSON-LD');
        }

        return saveIngestedRecipe(mappedRecipe);
    }

    const ogImage = result.ogImage?.[0]?.url;
    const mappedRecipe =
        (html ? extractMicrodataRecipe(html, url, ogImage) : null) ??
        (await parseRecipePage(html, url, ogImage));

    return saveIngestedRecipe(mappedRecipe);
};

export const ingestRecipe = async (url: string, uuid?: string) =>
    withFailedIngestLog(url, () => scrapeAndSaveRecipe(url, uuid));

export const smartIngestRecipe = async (url: string) =>
    withFailedIngestLog(url, () => smartScrapeAndSaveRecipe(url));

export const ingestRecipeFromText = async (recipeText: string) => {
    const text = recipeText?.trim();

    if (!text) {
        throw new Error('Recipe text is required');
    }

    const mappedRecipe = await parseRecipeText(text);

    if (!mappedRecipe?.name || !mappedRecipe.ingredients?.length) {
        throw new Error('Could not parse recipe text');
    }

    mappedRecipe.steps = mappedRecipe.steps ?? [];

    // The pasted text has no page to scrape, so only keep links the model
    // found inside the text itself.
    mappedRecipe.url = mappedRecipe.url?.startsWith('http')
        ? mappedRecipe.url
        : '';

    mappedRecipe.heroImage = mappedRecipe.heroImage?.startsWith('http')
        ? ((await downloadUploadImage(mappedRecipe.heroImage)) ?? '')
        : '';

    const result = await insertRecipe(mappedRecipe);

    if (!result) {
        throw new Error('Failed to insert recipe');
    }

    await toggleFavoriteRecipe(result.uuid);

    return result.uuid;
};
