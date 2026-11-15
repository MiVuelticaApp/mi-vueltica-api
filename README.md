# MiVueltica · API

REST API and MCP server behind MiVueltica: places, events, reviews, community suggestions, moderation, reputation and push notifications.

| Repository | What it is |
|---|---|
| [mi-vueltica-app](https://github.com/MiVuelticaApp/mi-vueltica-app) | Mobile app (iOS, Android and web) |
| **mi-vueltica-api** | REST API and MCP server |
| [mi-vueltica-web](https://github.com/MiVuelticaApp/mi-vueltica-web) | Marketing website |
| [mi-vueltica-crawler](https://github.com/MiVuelticaApp/mi-vueltica-crawler) | Event crawler (private) |

## Features

- Catalog: places, events, categories, sources, provinces and cantons, with price, audience, accessibility and geographic filters.
- Sign-in with Google and Apple (JWT), plus a test login for store review.
- Favorites, reviews with photos and "útil" votes, verifications and reports, blocking people.
- Community suggestions with moderation by votes, reputation points and AI pre-moderation (OpenAI moderation and a local spam check).
- Photo uploads stored in SeaweedFS (S3 API) and served through the API.
- Push notifications through Expo, privacy consent (Ley 8968) and account deletion.
- MCP server with place and event tools, used by the crawler.

## Tech stack

- Node.js, Express 5 and TypeScript
- Prisma with MySQL / MariaDB
- Zod for validation, OpenAPI with a Scalar reference at `/docs`
- Domain-driven layout with manual dependency injection
- Docker Compose (API, MariaDB and SeaweedFS)

## Requirements

- Node.js 22
- MySQL 8 or MariaDB 11
- An S3-compatible store (SeaweedFS in `docker-compose.yml`)

## Getting started

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Or start everything with Docker:

```bash
docker compose up -d --build
```

The API listens on `http://localhost:3000/api/v1` and the reference is at `http://localhost:3000/docs`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server (nodemon) |
| `npm run build` | Compile to `dist/` (`tsc` and `tsc-alias`) |
| `npm run start:prod` | Run the compiled build |
| `npm run db:seed` | Seed provinces, cantons and categories |
| `npx tsc --noEmit` | Type check |

## Configuration

Variables in `.env` (see `.env.example` for all of them):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL / MariaDB connection |
| `JWT_SECRET` | Token signing secret (required in production) |
| `PUBLIC_API_URL` | Public URL of the API, used for photo URLs |
| `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Photo storage |
| `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID` | Accepted Google client ids |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Apple sign-in and token revocation |
| `TEST_LOGIN_ENABLED`, `TEST_LOGIN_EMAIL`, `TEST_LOGIN_PASSWORD` | Store review login |
| `EXPO_ACCESS_TOKEN`, `NEARBY_PUSH_ENABLED` | Push notifications |
| `AI_MODERATION_API_KEY`, `AI_MODERATION_THRESHOLD` | AI pre-moderation |
| `TRUST_PROXY` | Number of reverse proxies in front of the API |
| `PRIVACY_VERSION`, `MIN_FRONTEND_VERSION` | Privacy notice version and minimum app version |

## Project structure

```
src/
├── domain/              # Entities, value objects, rules and repository interfaces
├── application/         # Services (use cases)
├── infrastructure/      # Prisma repositories, auth, email, storage, push
│   └── prisma/          # schema.prisma, migrations and seed
├── presentation/
│   ├── http/            # Express routes, controllers, validators and OpenAPI
│   ├── jobs/            # Background jobs
│   └── mcp/             # MCP server and tools
└── dependencyInjection/ # container.ts
```

## Deployment

The Docker image runs `prisma migrate deploy`, the seed and the API on start. Production runs on Coolify. Back up the database before deploying new migrations, and read "Pending deploy actions" in [`AGENTS.md`](AGENTS.md) first.

## Documentation

- [`AGENTS.md`](AGENTS.md): architecture, conventions and the behavior of every route
- `/docs` on a running API: OpenAPI reference (Scalar)
