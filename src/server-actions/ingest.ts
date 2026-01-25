'use server';

import { convertJsonLdToIngest, smartIngest } from '@/helpers/ingest-helper';
import { downloadUploadImage } from '@/server-actions/image-service';
import {
  editRecipe,
  getFullRecipeById,
  insertRecipe,
} from '@/server-actions/recipes';
import type { IngestRecipe } from '@/types/ingest';
import type { FullRecipe } from '@/types/recipe';

// Helper to fetch HTML
async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
  return res.text();
}

// Helper to extract JSON-LD
function extractJsonLd(html: string) {
  const jsonLdMatches = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi,
  );
  if (!jsonLdMatches) return null;

  const jsonObjects = jsonLdMatches
    .map((match) => {
      try {
        const content = match
          .replace(/<script type="application\/ld\+json">/i, '')
          .replace(/<\/script>/i, '');
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);

  return jsonObjects;
}

const processRecipe = async (
  recipeData: IngestRecipe,
  uuid?: string,
): Promise<string> => {
  // Handle image
  if (recipeData.heroImage && recipeData.heroImage.startsWith('http')) {
    const uploadedImage = await downloadUploadImage(recipeData.heroImage);
    if (uploadedImage) {
      recipeData.heroImage = uploadedImage;
    }
  }

  if (uuid) {
    const existing = await getFullRecipeById(uuid);
    if (existing) {
      const updated: FullRecipe = {
        ...existing,
        name: recipeData.name,
        description: recipeData.description,
        url: recipeData.url,
        primary_image: recipeData.heroImage,
        cuisine: recipeData.cuisine,
        category: recipeData.category,
        keywords: recipeData.keywords,
        ingredients: recipeData.ingredients,
        steps: recipeData.steps.map((s, i) => ({
          label: s.label,
          text: s.text || '',
          section: s.section,
          sort: i,
        })),
      };
      await editRecipe(updated, existing.id);
      return existing.uuid;
    }
    // If uuid provided but not found, insert new with that uuid
    const newRecipe = await insertRecipe(recipeData, uuid);
    if (!newRecipe) throw new Error('Failed to insert recipe');
    return newRecipe.uuid;
  }

  // New ingest
  const newRecipe = await insertRecipe(recipeData);
  if (!newRecipe) throw new Error('Failed to insert recipe');
  return newRecipe.uuid;
};

export const ingestRecipe = async (url: string, uuid?: string) => {
  const html = await fetchHtml(url);
  const jsonLd = extractJsonLd(html);
  let recipeData: IngestRecipe | null = null;

  if (jsonLd) {
    try {
      recipeData = await convertJsonLdToIngest(jsonLd, url);
    } catch (e) {
      console.warn('Deterministic conversion failed, trying AI', e);
    }

    if (!recipeData) {
      recipeData = await smartIngest(jsonLd);
    }
  }

  if (!recipeData) {
    throw new Error('Could not extract recipe data');
  }

  recipeData.url = url;

  return processRecipe(recipeData, uuid);
};

export const smartIngestRecipe = async (url: string, uuid?: string) => {
  const html = await fetchHtml(url);
  const jsonLd = extractJsonLd(html);
  let recipeData: IngestRecipe | null = null;

  if (jsonLd) {
    recipeData = await smartIngest(jsonLd);
  }

  if (!recipeData) {
    throw new Error('Could not extract recipe data via AI');
  }

  recipeData.url = url;

  return processRecipe(recipeData, uuid);
};
