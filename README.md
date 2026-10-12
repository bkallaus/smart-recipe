# Smart Recipe

An AI-powered recipe website.

Instantly import any recipe, remove the fluff, and get straight to cooking. 


<img width="1512" height="701" alt="image" src="https://github.com/user-attachments/assets/d6869a4d-e2d3-4293-aef4-76474a434e0a" />

## REST API for agents

Agents can list, read and add recipes over a REST API at `/api/v1`. The API sticks to existing standards so agents can use it without special handling:

- **OpenAPI 3.1** spec at [`/api/v1/openapi.json`](/api/v1/openapi.json) (no key needed). It works with tool-calling agents, MCP OpenAPI bridges and codegen.
- **schema.org Recipe JSON-LD** for every recipe body, sent and received. It's the same format recipe sites embed, so an agent can post what it scrapes as-is.
- **RFC 9457 problem details** (`application/problem+json`) for errors. Validation errors list each failing field in `errors`.
- [`/llms.txt`](/llms.txt) points agents at the spec.

### Setup

Set one or more comma-separated keys in the environment. The API answers `503` until at least one key is set:

```
RECIPE_API_KEYS=key-for-agent-a,key-for-agent-b
```

Send the key on every request as `Authorization: Bearer <key>` or `X-API-Key: <key>`.

### Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/recipes?q=&limit=&offset=` | List or search recipes (schema.org `ItemList`) |
| `GET` | `/api/v1/recipes/{id}` | One recipe with ingredients and instructions |
| `POST` | `/api/v1/recipes` | Add a recipe; returns `201` with a `Location` header |

```bash
curl -X POST https://<host>/api/v1/recipes \
  -H "Authorization: Bearer $RECIPE_API_KEY" \
  -H "Content-Type: application/ld+json" \
  -d '{
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Simple Pancakes",
    "isBasedOn": "https://example.com/pancakes",
    "recipeIngredient": ["1 cup flour", "1 cup milk", "1 egg"],
    "recipeInstructions": [
      { "@type": "HowToStep", "text": "Whisk everything together." },
      { "@type": "HowToStep", "text": "Cook on a hot griddle." }
    ]
  }'
```

Put the original source page in `isBasedOn` (or `url`). In responses, `url` is the recipe's page on this site and `identifier` is the id to use with `GET /api/v1/recipes/{id}`.
