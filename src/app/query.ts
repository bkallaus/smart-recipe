'use server';
import { insertRecipe } from '@/server-actions/recipes';
import ogs from 'open-graph-scraper';
import { convertJsonLdToIngest, smartIngest } from '../helpers/ingest-helper';
import { toggleFavoriteRecipe } from '@/server-actions/favorite-recipes';
import { downloadUploadImage } from '@/server-actions/image-service';

export const getJson = async (url: string) => {
    const options = {
        url,
    };

    const results = await ogs(options);

    return results.result.jsonLD;
};

export const ingestRecipe = async (url: string, uuid?: string) => {
    const response = await fetch(url, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        },
    });
    const html = await response.text();

    const options = {
        html,
        url: response.url,
    };

    const results = await ogs(options);

    const json = results.result.jsonLD;

    let mappedRecipe = await convertJsonLdToIngest(json, url);

    if (!mappedRecipe) {
        mappedRecipe = await smartIngest(html);
    }

    if (!mappedRecipe) {
        throw new Error('Could not ingest recipe');
    }

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

export const smartIngestRecipe = async (url: string, uuid?: string) => {
    const response = await fetch(url, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        },
    });
    const html = await response.text();

    const mappedRecipe = await smartIngest(html);

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

    if (!result) {
        throw new Error('Failed to insert recipe');
    }

    await toggleFavoriteRecipe(result.uuid);

    return result.uuid;
};