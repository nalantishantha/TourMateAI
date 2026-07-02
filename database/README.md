# database/ — Data Tier (MySQL)

**Owner:** Shared (designed together in Phase 0.3). This is the backbone both tracks depend on, so
changes must be agreed by both developers.

## Contents

| Path | Purpose |
|------|---------|
| `schema.sql` *(to be added)* | Full DDL: table definitions, keys, relationships |
| `seeds/` | Seed data (e.g. initial attractions) inserted after schema creation |
| `migrations/` | Incremental schema-change scripts, applied in order |

## Planned tables (from the proposal)

| Table | Notes |
|-------|-------|
| `Users` | Profile + preferences (interests, budget, trip duration) — feeds the recommender |
| `Attractions` | Must carry recommender/RAG metadata: `category`, `tags`, `location(lat,lng)`, `popularity`, `description` |
| `Interactions` | User views/selects — feedback signal for the recommender |
| `Images` | Uploaded/landmark images and identification results |
| `Feedback` | User feedback / ratings |
| `ChatSessions` | Chatbot conversation history/context |

`Attractions` is the shared join point: the recommender ranks it, the RAG KB is built from its
descriptions, and image recognition enriches results from it. Design its columns carefully.

## Rules

- Any schema change → update `schema.sql`, add a migration, and notify both developers.
- Keep the running DB reproducible from `schema.sql` + `seeds/`.
