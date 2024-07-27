import { nanoid } from 'nanoid';

type RecipeJson = {
    name: string;
    headline: string;
    description: string;
    recipeIngredient: string[];
    recipeInstructions: any[];
    thumbnailUrl: string;
};

const slugify = (originalString: string) => {
    if (!originalString) return nanoid();

    let str = originalString;
    str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
    str = str.toLowerCase(); // convert string to lowercase
    str = str
        .replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // remove consecutive hyphens
    return str;
};

const convertRecipe = (recipeJson: RecipeJson, originalUrl: string) => {
    const name = recipeJson.name ?? recipeJson.headline;
    const description = recipeJson.description;
    const ingredients = recipeJson.recipeIngredient;
    const steps = recipeJson.recipeInstructions
        ?.sort((a, b) => a.position - b.position)
        .map((instruction: any) =>
            [instruction.name, instruction.text].filter(Boolean).join(' : '),
        );

    return {
        heroImage: recipeJson.thumbnailUrl,
        name,
        url: originalUrl,
        description,
        ingredients,
        steps,
    };
};

export const findRecipeIngredients = (data: any): RecipeJson | null => {
    if (!data) {
        return null;
    }

    if (data.recipeIngredient) {
        return data;
    }

    if (data['@graph']) {
        return findRecipeIngredients(data['@graph']);
    }

    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            const found = findRecipeIngredients(data[i]);
            if (found) {
                return found;
            }
        }
    }

    return null; // Base case: not found
};

export const convertJsonLdToIngest = async (
    jsonLd: Record<string, any>[],
    originalUrl: string,
): Promise<IngestRecipe | null> => {
    const foundRecipe = findRecipeIngredients(jsonLd);

    const mappedRecipe = convertRecipe(foundRecipe as RecipeJson, originalUrl);

    return mappedRecipe;
};
