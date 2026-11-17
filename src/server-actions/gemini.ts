import OpenAI from 'openai';
import 'server-only';

export class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigurationError';
  }
}

let client: OpenAI | null = null;

// Created on first use so a missing key fails with a clear message instead of
// the SDK's generic authentication error
const getClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new AiConfigurationError(
      'OPENROUTER_API_KEY is not set, so recipes cannot be parsed with AI',
    );
  }

  client ??= new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });

  return client;
};

const recipeSchema = {
  type: 'object',
  properties: {
    category: { type: 'string' },
    cuisine: { type: 'string' },
    keywords: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    ingredients: {
      type: 'array',
      items: { type: 'string' },
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          text: { type: 'string' },
          section: { type: 'string' },
        },
        required: ['label'],
        additionalProperties: false,
      },
    },
    url: { type: 'string' },
  },
  required: ['category', 'cuisine', 'keywords', 'name', 'description', 'ingredients', 'steps', 'url'],
  additionalProperties: false,
};

export const askAI = async (prompt: string) => {
  const withSchemaPrompt = `
  ${prompt}
  ### JSON Response Schema:
  ${JSON.stringify(recipeSchema, null, 2)}
`;

  const response = await getClient().chat.completions.create({
    model: 'google/gemma-3-12b-it:free',
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'recipe',
        strict: true,
        schema: recipeSchema,
      },
    },
    messages: [
      { role: 'user', content: withSchemaPrompt },
    ],
  });

  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('The AI returned an empty response');
  }

  return content;
};
