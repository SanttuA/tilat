# Accessible Bilingual Reservation MVP

## Overview

Accessible reservation MVP for browsing resources, viewing availability, and
managing bookings. The product supports Finnish and English as first-class
languages and uses an MVP-native API.

## Stack

- Next.js App Router for the public, user, staff, and admin UI.
- Django REST Framework API with app-managed unit staff permissions.
- Django-managed email/password signup and signin.
- PostgreSQL and Docker Compose for local and server environments.
- Vitest, Playwright, oxlint, Prettier, and pytest for checks.

## Local Development

```sh
cp .env.dev.example .env
docker compose -f compose.dev.yml up --build
```

`.env` and other local secret files are intentionally ignored by git. Commit the
checked-in example files only.

Open the local services:

- Web: http://localhost:3000/fi
- API docs: http://localhost:8000/api/docs/

The Django seed command creates bilingual demo units/resources and local demo
accounts. All demo accounts use the password `Local-demo-12345`:

- Admin and Django admin fallback: `admin@example.com`
- Unit staff: `staff@example.com`
- Normal user: `user@example.com`

Django admin uses the same email value in its Username field. Only users with
Django staff access, such as the seeded admin, can sign in at `/admin/`.

`PASSWORD_AUTH_TOKEN_TTL_DAYS` controls both backend access token expiry and the
web HttpOnly auth cookie lifetime.

## Server Compose

```sh
cp .env.server.example .env.server
docker compose --env-file .env.server -f compose.server.yml up --build
```

Replace every `replace-me` value before exposing the stack. Caddy fronts `/` and
`/api`; Django migrations run before gunicorn starts.

## Checks

```sh
pnpm lint
pnpm test
pnpm e2e
cd apps/api && uv run pytest
docker compose -f compose.dev.yml config
SERVER_ENV_FILE=.env.server.example docker compose --env-file .env.server.example -f compose.server.yml config
```

See `AGENTS.md` and `specs/` before making changes.

## License

Licensed under the [MIT License](LICENSE).
