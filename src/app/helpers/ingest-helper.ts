
import { createClient } from '@supabase/supabase-js'
import ogs from "open-graph-scraper";
import { nanoid } from 'nanoid'

// Create a single supabase client for interacting with your database
// const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_KEY);

const slugify = (originalString:string) => {
    if (!originalString) return nanoid();

    let str = originalString;
    str = str.replace(/^\s+|\s+$/g, ''); // trim leading/trailing white space
    str = str.toLowerCase(); // convert string to lowercase
    str = str.replace(/[^a-z0-9 -]/g, '') // remove any non-alphanumeric characters
             .replace(/\s+/g, '-') // replace spaces with hyphens
             .replace(/-+/g, '-'); // remove consecutive hyphens
    return str;
  }

export const convertJsonLdToIngest = async (jsonLd: any, originalUrl:string): Promise<IngestRecipe> => {
    const json = jsonLd[0];

    const ifGraph = json["@graph"] ?? json;

    const recipe = ifGraph.length === 1 ?ifGraph[0] : ifGraph.find((item: any) =>{
        if(Array.isArray(item["@type"])){
          return item["@type"].find((subItem) => subItem["@type"] === "Recipe" || !!subItem.recipeIngredient);
        }

        return item["@type"] === "Recipe" || !!item.recipeIngredient;
    });

    if (!recipe) {
        throw new Error("No recipe found in JSON-LD");
    }

    const name = recipe.name ?? recipe.headline;
    const description = recipe.description;
    const ingredients = recipe.recipeIngredient;
    const steps = recipe.recipeInstructions.sort((a, b) =>a.position  = b.position).map((instruction: any) => [instruction.name, instruction.text].filter(Boolean).join(' : '))  ;

    return {
        heroImage: recipe.thumbnailUrl,
        name,
        url: originalUrl,
        description,
        ingredients,
        steps,
    };
};