'use server';
import { editRecipe, insertRecipe } from '@/server-actions/recipes';
import ogs from 'open-graph-scraper';
import { convertJsonLdToIngest, smartIngest } from '../helpers/ingest-helper';
import { toggleFavoriteRecipe } from '@/server-actions/favorite-recipes';
import { downloadUploadImage } from '@/server-actions/image-service';
import type { FullRecipe } from '@/types/recipe';

export const getJson = async (url: string) => {
  const options = {
    url,
  };

  const results = await ogs(options);

  return results.result.jsonLD;
};

export const ingestRecipe = async (url: string, uuid?: string) => {
  const options = {
    url,
  };

  const results = await ogs(options);

  if (results.error) {
    throw new Error('Could not ingest recipe');
  }

  const json = results.result.jsonLD;

  const mappedRecipe = await convertJsonLdToIngest(json, url);

  if (!mappedRecipe) {
    throw new Error('Could not convert jsonLD to ingest recipe');
  }

  if (mappedRecipe.heroImage) {
    const remappedHeroImage = await downloadUploadImage(mappedRecipe.heroImage);
    if (remappedHeroImage) {
      mappedRecipe.heroImage = remappedHeroImage;
    }
  }

  const result = await insertRecipe(mappedRecipe, uuid);

  await toggleFavoriteRecipe(result.uuid);

  return result.uuid;
};

export const smartIngestRecipe = async (url: string, uuid?: string) => {
  const options = {
    url,
  };

  const results = await ogs(options);

  if (results.error) {
    throw new Error('Could not ingest recipe');
  }

  const mappedRecipe = await smartIngest(results);

  if (!mappedRecipe) {
    throw new Error('Could not parse recipe');
  }

  if (mappedRecipe.heroImage) {
    const remappedHeroImage = await downloadUploadImage(mappedRecipe.heroImage);
    if (remappedHeroImage) {
      mappedRecipe.heroImage = remappedHeroImage;
    }
  }

  const result = await insertRecipe(mappedRecipe, uuid);

  await toggleFavoriteRecipe(result.uuid);

  return result.uuid;
};

export const smartRescanRecipe = async (
  id: number,
  url: string,
  uuid: string,
) => {
  const options = {
    url,
  };

  const results = await ogs(options);

  if (results.error) {
    throw new Error('Could not ingest recipe');
  }

  const mappedRecipe = await smartIngest(results);

  if (!mappedRecipe) {
    throw new Error('Could not parse recipe');
  }

  if (mappedRecipe.heroImage) {
    const remappedHeroImage = await downloadUploadImage(mappedRecipe.heroImage);
    if (remappedHeroImage) {
      mappedRecipe.heroImage = remappedHeroImage;
    }
  }

  const fullRecipe: FullRecipe = {
    id: id,
    uuid: uuid,
    name: mappedRecipe.name,
    description: mappedRecipe.description,
    url: mappedRecipe.url,
    primary_image: mappedRecipe.heroImage,
    cuisine: mappedRecipe.cuisine,
    category: mappedRecipe.category,
    keywords: mappedRecipe.keywords,
    ingredients: mappedRecipe.ingredients,
    steps: mappedRecipe.steps,
    is_favorite: false,
  };

  await editRecipe(fullRecipe, id);

  return uuid;
};
