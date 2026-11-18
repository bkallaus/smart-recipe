# Smart Recipe

An AI-powered recipe website.

Instantly import any recipe, remove the fluff, and get straight to cooking. 


<img width="1512" height="701" alt="image" src="https://github.com/user-attachments/assets/d6869a4d-e2d3-4293-aef4-76474a434e0a" />

## Setup

Copy `.env.example` to `.env.local` and fill in each value. Set the same
variables in your hosting provider's environment settings and redeploy.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres (Neon) connection string. |
| `SESSION_SECRET` | Signs the session cookie set after Google sign-in. **Required** — without it sign-in fails and every visitor is treated as signed out. Use a random string of at least 32 characters: `openssl rand -base64 48`. |
| `OPENROUTER_API_KEY` | API key for AI recipe parsing. |

Then run `pnpm install` and `pnpm dev`.
