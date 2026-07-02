# TourMateAI

*An Intelligent AI-Based Travel Companion for Sri Lanka.*

A web application that gives tourists personalized, context-aware (location + weather + time)
travel help through three AI capabilities: a **content-based recommendation engine**, a
**RAG chatbot** (Gemini + ChromaDB), and **landmark image recognition** (CNN).

> University final project — CIS6035, Cardiff Metropolitan / ICBT. Academic MVP, free-tier tooling.
> For AI/agent contributors: read [`CLAUDE.md`](CLAUDE.md). For the build plan: [`plan.md`](plan.md).

## Architecture (three-tier)

```
 Tier 1: Presentation   →   frontend/     React (Vite, JavaScript)
 Tier 2: Application     →   backend/      Python Flask (modular monolith)
 Tier 3: Data            →   database/     MySQL
```

The Flask backend is a single deployable. AI features live inside it as a self-contained package
(`backend/app/ai/`) mounted at `/api/ai/*`, so the AI and web work never collide.

## Repository map & ownership

| Path | Tier | Owner | Purpose |
|------|------|-------|---------|
| `frontend/` | Presentation | **Web dev** | React SPA — UI, pages, API client |
| `backend/app/{models,routes,services}/` | Application | **Web dev** | App factory, DB models, web routes, Firebase/Maps/Weather |
| `backend/app/ai/` | Application | **AI dev** | Recommendation, RAG chatbot, image recognition (Blueprint at `/api/ai/*`) |
| `ai_lab/` | — | **AI dev** | Datasets, notebooks, training scripts, model artifacts (not shipped) |
| `database/` | Data | **Shared** | Schema, migrations, seed data |
| `docs/` | — | **Shared** | Proposal, API contract, architecture & schema docs |

**Golden rule for collaboration:** the two sides meet **only** at (a) the JSON contracts in
[`docs/api-contract.md`](docs/api-contract.md) and (b) the shared DB schema in
[`database/`](database/). Don't edit across ownership boundaries without agreeing on the contract
first. Each folder has its own `README.md` with details.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite (JavaScript) |
| Backend | Python Flask, SQLAlchemy |
| Database | MySQL |
| Auth | Firebase Authentication |
| Recommender | scikit-learn (content-based, cosine similarity) |
| Chatbot | Google Gemini + ChromaDB + sentence-transformers (RAG) |
| Image recognition | TensorFlow/Keras CNN |
| External APIs | Google Maps, OpenWeather |

## Getting started

1. `cp .env.example .env` and fill in API keys (Gemini, Google Maps, OpenWeather, Firebase, MySQL).
2. **Backend:** see [`backend/README.md`](backend/README.md).
3. **Frontend:** see [`frontend/README.md`](frontend/README.md).
4. **Database:** see [`database/README.md`](database/README.md).

> The tree is scaffolded but application code is not written yet — see `plan.md` for the
> phase-by-phase build order.
