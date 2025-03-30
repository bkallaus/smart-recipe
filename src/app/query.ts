'use server';
import { insertRecipe } from '@/server-actions/recipes';
import ogs from 'open-graph-scraper';
import { convertJsonLdToIngest, smartIngest } from '../helpers/ingest-helper';
import { downloadUploadImage } from '@/helpers/image-helpers';
import { toggleFavoriteRecipe } from '@/server-actions/favorite-recipes';

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
