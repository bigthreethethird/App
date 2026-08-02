# Cannect Deployment Guide

## Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 16 (or Neon serverless)
- Redis 7 (or Upstash)

## Services & Environment Variables

| Service | Purpose | Required | Setup Link |
|---------|---------|----------|------------|
| Clerk | Brand authentication | Yes | https://clerk.com |
| Stripe | Subscription billing | Yes | https://stripe.com |
| AWS S3 | File uploads | Yes | https://aws.amazon.com/s3 |
| OpenAI | AI Budtender chat | Yes | https://platform.openai.com |
| Neon | Serverless Postgres | Yes | https://neon.tech |
| Upstash | Serverless Redis | Optional | https://upstash.com |

## Environment Variables

### Frontend (`.env.local`)
```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_STRIPE_PRICE_ESSENTIAL=
NEXT_PUBLIC_STRIPE_PRICE_GROWTH=
```

### Backend (`.env`)
```dotenv
DATABASE_URL=
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
OPENAI_API_KEY=
```

## Local Development
1. Clone the repo.
2. Run `pnpm install`.
3. Copy `.env.example` and fill in variables.
4. Run `docker compose up -d` (Postgres + Redis).
5. Run `pnpm db:push` to create tables.
6. Run `pnpm dev` to start frontend and backend.

> The checked-in MVP schema currently targets SQLite for local development. For production, change the Prisma datasource provider to `postgresql` and use a PostgreSQL `DATABASE_URL` before running migrations.

## Production Deployment

### Frontend: Vercel
1. Connect the repository to Vercel.
2. Set root directory to `packages/frontend`.
3. Set build command to `pnpm build`.
4. Add all frontend environment variables.
5. Deploy.

### Backend: Railway / Render / AWS
1. Deploy `packages/backend` as a Node.js service.
2. Set build command to `pnpm build`.
3. Set start command to `node dist/main`.
4. Add all backend environment variables.

### Webhook Setup (post-deploy)
- Clerk: set webhook URL to `{BACKEND_URL}/api/webhooks/clerk`.
- Stripe: set webhook URL to `{BACKEND_URL}/api/webhooks/stripe`.
