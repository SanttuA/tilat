# Initial Implementation Task

Create the first complete MVP scaffold:

- Monorepo metadata and scripts.
- Django API with password authentication, domain models, permissions,
  serializers, views, seed command, tests, and OpenAPI schema.
- Next.js bilingual accessible UI for public, user, staff, and admin flows.
- Generated TypeScript API types and runtime client.
- Docker Compose for local development and server deployment.

The goal is a coherent base that future agents can run and extend, even if the
current environment cannot install dependencies.

## Public UI Responsiveness Acceptance

- The public resource search page and shared shell must not create horizontal
  overflow at 320px width or at 200% zoom.
- The header keeps all navigation and language links visible by wrapping them
  cleanly; links must not stretch into oversized full-width controls unless
  they are primary page actions.
- Search controls stack before they overflow, and resource cards keep titles,
  descriptions, metadata pills, and detail actions contained within the card.
