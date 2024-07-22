export type Recipe = {
    id: number;
    name: string;
    description: string;
    heroImage: string;
  };
  
  export type FullRecipe = Recipe & {
    ingredients: string[];
    steps: string[];
  };