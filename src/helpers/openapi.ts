const problemResponse = (description: string) => ({
  description,
  content: {
    'application/problem+json': {
      schema: { $ref: '#/components/schemas/Problem' },
    },
  },
});

const recipeResponse = (description: string) => ({
  description,
  content: {
    'application/ld+json': {
      schema: { $ref: '#/components/schemas/Recipe' },
    },
  },
});

const stringOrList = {
  oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
};

/** OpenAPI 3.1 description of the recipe API. */
export const buildOpenApiSpec = (origin: string) => ({
  openapi: '3.1.0',
  info: {
    title: 'Smart Recipe API',
    version: '1.0.0',
    description:
      'Read and add recipes. Recipes are exchanged as schema.org Recipe JSON-LD (https://schema.org/Recipe), the same format recipe websites embed, and errors use RFC 9457 problem details. Every operation needs an API key.',
  },
  servers: [{ url: `${origin}/api/v1` }],
  security: [{ bearerAuth: [] }, { apiKeyHeader: [] }],
  paths: {
    '/recipes': {
      get: {
        operationId: 'listRecipes',
        summary: 'List or search recipes, newest first',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Case-insensitive text to match in the recipe name.',
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'A schema.org ItemList of recipe summaries.',
            content: {
              'application/ld+json': {
                schema: { $ref: '#/components/schemas/RecipeList' },
              },
            },
          },
          '401': problemResponse('Missing or invalid API key.'),
        },
      },
      post: {
        operationId: 'createRecipe',
        summary: 'Add a recipe',
        description:
          'Send a schema.org Recipe. Pass the original source page as `isBasedOn` (or `url`). The response is the stored recipe, whose `url` is its page on this site.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecipeInput' },
            },
            'application/ld+json': {
              schema: { $ref: '#/components/schemas/RecipeInput' },
            },
          },
        },
        responses: {
          '201': {
            ...recipeResponse('The created recipe.'),
            headers: {
              Location: {
                description: 'URL of the recipe page.',
                schema: { type: 'string', format: 'uri' },
              },
            },
          },
          '400': problemResponse('The body is not valid JSON.'),
          '401': problemResponse('Missing or invalid API key.'),
          '413': problemResponse('The body is larger than 1 MB.'),
          '422': problemResponse(
            'The body is not a valid recipe; `errors` lists each problem.',
          ),
        },
      },
    },
    '/recipes/{id}': {
      get: {
        operationId: 'getRecipe',
        summary: 'Get a recipe with its ingredients and instructions',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'The recipe `identifier` (a UUID).',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': recipeResponse('The recipe.'),
          '401': problemResponse('Missing or invalid API key.'),
          '404': problemResponse('No recipe has that id.'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' },
      apiKeyHeader: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
    schemas: {
      HowToStep: {
        type: 'object',
        required: ['text'],
        properties: {
          '@type': { const: 'HowToStep' },
          name: { type: 'string', description: 'Short label for the step.' },
          text: { type: 'string' },
        },
      },
      HowToSection: {
        type: 'object',
        required: ['name', 'itemListElement'],
        properties: {
          '@type': { const: 'HowToSection' },
          name: { type: 'string', description: 'Section heading.' },
          itemListElement: {
            type: 'array',
            minItems: 1,
            items: {
              oneOf: [
                { type: 'string' },
                { $ref: '#/components/schemas/HowToStep' },
              ],
            },
          },
        },
      },
      RecipeInput: {
        type: 'object',
        required: ['@type', 'name', 'recipeIngredient', 'recipeInstructions'],
        properties: {
          '@context': { const: 'https://schema.org' },
          '@type': { const: 'Recipe' },
          name: { type: 'string', maxLength: 200 },
          description: { type: 'string', maxLength: 5000 },
          image: {
            description: 'Image URL, list of URLs, or ImageObject.',
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
              {
                type: 'object',
                required: ['url'],
                properties: { url: { type: 'string' } },
              },
            ],
          },
          isBasedOn: {
            type: 'string',
            description: 'URL of the original recipe.',
          },
          url: {
            type: 'string',
            description: 'Used as the source URL when isBasedOn is absent.',
          },
          recipeCategory: stringOrList,
          recipeCuisine: stringOrList,
          keywords: stringOrList,
          recipeIngredient: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' },
          },
          recipeInstructions: {
            description:
              'One string with a step per line, or a list of steps and sections.',
            oneOf: [
              { type: 'string' },
              {
                type: 'array',
                minItems: 1,
                items: {
                  oneOf: [
                    { type: 'string' },
                    { $ref: '#/components/schemas/HowToStep' },
                    { $ref: '#/components/schemas/HowToSection' },
                  ],
                },
              },
            ],
          },
        },
        example: {
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          name: 'Simple Pancakes',
          description: 'Fluffy weekend pancakes.',
          recipeCategory: 'Breakfast',
          recipeCuisine: 'American',
          keywords: 'pancakes, breakfast',
          recipeIngredient: ['1 cup flour', '1 cup milk', '1 egg'],
          recipeInstructions: [
            { '@type': 'HowToStep', text: 'Whisk everything together.' },
            { '@type': 'HowToStep', text: 'Cook on a hot griddle.' },
          ],
        },
      },
      Recipe: {
        type: 'object',
        properties: {
          '@context': { const: 'https://schema.org' },
          '@type': { const: 'Recipe' },
          '@id': { type: 'string', format: 'uri' },
          identifier: { type: 'string', format: 'uuid' },
          url: {
            type: 'string',
            format: 'uri',
            description: 'Recipe page on this site.',
          },
          name: { type: 'string' },
          description: { type: 'string' },
          image: { type: 'string' },
          isBasedOn: {
            type: 'string',
            description: 'URL of the original recipe.',
          },
          recipeCategory: { type: 'array', items: { type: 'string' } },
          recipeCuisine: { type: 'array', items: { type: 'string' } },
          keywords: { type: 'string' },
          recipeIngredient: { type: 'array', items: { type: 'string' } },
          recipeInstructions: {
            type: 'array',
            items: {
              oneOf: [
                { $ref: '#/components/schemas/HowToStep' },
                { $ref: '#/components/schemas/HowToSection' },
              ],
            },
          },
        },
      },
      RecipeList: {
        type: 'object',
        properties: {
          '@context': { const: 'https://schema.org' },
          '@type': { const: 'ItemList' },
          numberOfItems: { type: 'integer' },
          itemListElement: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                '@type': { const: 'ListItem' },
                position: { type: 'integer' },
                item: {
                  type: 'object',
                  properties: {
                    '@type': { const: 'Recipe' },
                    '@id': { type: 'string', format: 'uri' },
                    identifier: { type: 'string', format: 'uuid' },
                    url: { type: 'string', format: 'uri' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      Problem: {
        type: 'object',
        description: 'RFC 9457 problem details.',
        properties: {
          type: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'integer' },
          detail: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
});
