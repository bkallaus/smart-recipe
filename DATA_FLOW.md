# Data Flow Diagram

This diagram visualizes how data flows through the **Smart Recipes** application, from recipe ingestion to user interaction and retrieval.

```mermaid
graph TD
    subgraph "External Sources"
        URL[Recipe Website URL]
    end

    subgraph "Client Side (Next.js)"
        UI[User Interface]
        Search[Search Component]
        IngestForm[Ingest Form]
        RecipeView[Full Recipe View]
    end

    subgraph "Server Actions (Next.js)"
        SA_AI[askAI - gemini.ts]
        SA_Recipes[recipes.ts]
        SA_Favs[favorite-recipes.ts]
        SA_Auth[verify-credentials.ts]
    end

    subgraph "AI Services"
        Gemini[Google Gemini API]
    end

    subgraph "Database (PostgreSQL)"
        DB_Recipes[(Recipe Table)]
        DB_Ingredients[(Ingredient Table)]
        DB_Steps[(Steps Table)]
        DB_Users[(Users Table)]
        DB_UserRecipes[(User_Recipe Table)]
    end

    %% Ingestion Flow
    URL --> IngestForm
    IngestForm --> SA_AI
    SA_AI <--> Gemini
    SA_AI -- "Parsed JSON" --> SA_Recipes
    SA_Recipes -- "INSERT" --> DB_Recipes
    SA_Recipes -- "INSERT" --> DB_Ingredients
    SA_Recipes -- "INSERT" --> DB_Steps

    %% Retrieval Flow
    UI --> Search
    Search --> SA_Recipes
    SA_Recipes -- "SELECT" --> DB_Recipes
    DB_Recipes -- "Recipe Data" --> UI

    UI --> RecipeView
    RecipeView --> SA_Recipes
    SA_Recipes -- "SELECT" --> DB_Recipes
    SA_Recipes -- "SELECT" --> DB_Ingredients
    SA_Recipes -- "SELECT" --> DB_Steps
    SA_Recipes -- "Result" --> RecipeView

    %% User Actions
    UI --> SA_Favs
    SA_Favs -- "SELECT/UPDATE" --> DB_UserRecipes
    SA_Favs -- "JOIN" --> DB_Users
    
    UI --> SA_Recipes
    SA_Recipes -- "UPDATE/DELETE" --> DB_Recipes

    %% Styling
    style Gemini fill:#f9f,stroke:#333,stroke-width:2px
    style DB_Recipes fill:#ccf,stroke:#333,stroke-width:2px
    style DB_Ingredients fill:#ccf,stroke:#333,stroke-width:2px
    style DB_Steps fill:#ccf,stroke:#333,stroke-width:2px
    style SA_AI fill:#cfc,stroke:#333,stroke-width:2px
```

## Data Flow Descriptions

### 1. Recipe Ingestion
- **Input**: The user provides a URL of a recipe website.
- **Processing**: The `askAI` action sends a prompt to **Google Gemini** to extract recipe details (ingredients, steps, metadata) into a structured JSON format.
- **Storage**: The `insertRecipe` action uses a transaction to save the data into the `recipe`, `ingredient`, and `steps` tables.

### 2. Recipe Retrieval
- **Listing**: The home page calls `getRecentRecipes` and `getFavoriteRecipes` to display cards.
- **Searching**: The `searchRecipes` action performs a case-insensitive `ILIKE` query on the `recipe` table.
- **Full View**: `getFullRecipeById` retrieves all related data (ingredients, steps) and checks if the recipe is favorited by the current user.

### 3. User Interactions
- **Favoriting**: `toggleFavoriteRecipe` adds or removes a record in the `user_recipe` join table.
- **Editing**: Users can modify recipe details, which triggers updates to the main table and replaces ingredients/steps.
