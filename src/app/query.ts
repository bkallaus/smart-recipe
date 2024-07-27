'use server';
import ogs from "open-graph-scraper";
import { convertJsonLdToIngest } from "../helpers/ingest-helper";
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
        url,
        convertJsonLdToIngest
    };
    
    const results = await ogs(options);

    if(results.error) {
        throw new Error('Could not ingest recipe');
    }

    const json =  results.result.jsonLD;

    const mappedRecipe = await convertJsonLdToIngest(json, url);
    
    if(!mappedRecipe) {
        throw new Error('Could not convert jsonLD to ingest recipe');
    }
    
    const result = await insertRecipe(mappedRecipe);

    return result.id;
}