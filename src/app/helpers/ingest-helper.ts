

export const convertJsonLdToIngest = (jsonLd: any): IngestRecipe => {
    const json = jsonLd[0];
    console.log(json);

    const recipe = json["@graph"].find((item: any) => item["@type"] === "Recipe");


    const name = recipe.name ?? recipe.headline;
    const url = recipe.url ?? recipe.mainEntityOfPage;
    const description = recipe.description;
    const ingredients = recipe.recipeIngredient;
    const steps = recipe.recipeInstructions.sort((a, b) =>a.position  = b.position).map((instruction: any) => [instruction.name, instruction.text].filter(Boolean).join(' : '))  ;
    
    return {
        heroImage: recipe.thumbnailUrl,
        name,
        url,
        description,
        ingredients,
        steps,
    };
};