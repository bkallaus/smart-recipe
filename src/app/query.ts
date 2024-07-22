'use server';
import ogs from "open-graph-scraper";
import { convertJsonLdToIngest } from "./helpers/ingest-helper";
import { insertRecipe } from "@/server-actions/recipes";

export const getJson = async (url: string) => {
    const options = {
        url
    };
    
    const results = await ogs(options);

    return results.result.jsonLD;
}

export const ingestRecipe = async (url: string) => {

    const options = {
        url
    };
    
    const results = await ogs(options);

    const json =  results.result.jsonLD;

    const mappedRecipe = convertJsonLdToIngest(json);
    
    const result = await insertRecipe(mappedRecipe);

    // return getRecipeById(result.id);
}