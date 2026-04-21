# Accessible Bilingual Reservation MVP

Greenfield reservation MVP inspired by the Respa/Varaamo reservation flow. The
API is intentionally new and MVP-native.

## Stack

- Next.js App Router with Finnish and English routes.
- Django REST Framework API with app-managed unit staff permissions.
- authentik OIDC for identity and global admin group claims.
- PostgreSQL, Docker Compose, Vitest, Playwright, oxlint, Prettier, pytest.

## Local Development

```sh
cp .env.dev.example .env
docker compose -f compose.dev.yml up --build
```

`.env` and other local secret files are intentionally ignored by git. Commit the
checked-in example files only.

Then open:

- Web: http://localhost:3000/fi
- API docs: http://localhost:8000/api/docs/
- authentik: http://localhost:9000/if/flow/initial-setup/

The Django seed command creates bilingual demo units/resources and local
profiles. authentik still needs the OIDC application/provider from the blueprint
or the same values entered manually if blueprint import is not available.

## Server Compose

```sh
cp .env.server.example .env.server
docker compose --env-file .env.server -f compose.server.yml up --build
```

Replace every `replace-me` value before exposing the stack. Caddy fronts `/`,
`/api`, and `/auth`; Django migrations run before gunicorn starts.

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

## First GitHub Push

```sh
git init
git add .
git status --short
git commit -m "Initial reservation MVP scaffold"
git branch -M main
git remote add origin git@github.com:YOUR_ORG/YOUR_REPO.git
git push -u origin main
```

Before pushing, check that `git status --short` does not include `.env`,
`node_modules`, `.next`, `.venv`, cache directories, or test output.
