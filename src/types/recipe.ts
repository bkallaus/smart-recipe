export type Recipe = {
    id: number;
    name: string;
    description: string;
    primary_image: string;
    url: string;
  };
  
  export type FullRecipe = Recipe & {
    ingredients: string[];
    steps: string[];
  };