import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import 'server-only';

const genAI = new GoogleGenerativeAI(process.env.API_KEY as string);

const RecipeJsonSchema = {
  description: 'Recipe format',
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
    },
    cuisine: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
    },
    keywords: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
    },
    name: {
      type: SchemaType.STRING,
    },
    description: {
      type: SchemaType.STRING,
    },
    heroImage: {
      type: SchemaType.STRING,
    },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
    },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: {
            type: SchemaType.STRING,
          },
          text: {
            type: SchemaType.STRING,
          },
          section: {
            type: SchemaType.STRING,
          },
        },
        required: ['label'],
      },
    },
    url: {
      type: SchemaType.STRING,
    },
    prepTime: {
      type: SchemaType.STRING,
    },
    cookTime: {
      type: SchemaType.STRING,
    },
    totalTime: {
      type: SchemaType.STRING,
    },
    recipeYield: {
      type: SchemaType.STRING,
    },
  },
  required: [
    'category',
    'cuisine',
    'keywords',
    'name',
    'description',
    'heroImage',
    'ingredients',
    'steps',
    'url',
  ],
};

export const askAI = async (prompt: string) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
    systemInstruction:
      'You are an expert recipe parser. Your goal is to extract recipe information from the provided text or JSON and format it according to the specified JSON schema. Ensure all fields are populated as accurately as possible. If a field is missing, try to infer it from the context if possible, otherwise leave it empty.',
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: RecipeJsonSchema,
    },
  });

  const result = await model.generateContent([prompt]);

  return result.response.text();
};
