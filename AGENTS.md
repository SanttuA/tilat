# AI Agent Contract

This repository is built with spec-driven development. Every agent must treat the
specs as the source of truth and keep implementation, tests, and generated API
types aligned.

## Required Reading

Before changing code, read:

- `specs/product-mvp.md`
- `specs/domain.md`
- `specs/permissions.md`
- `specs/i18n.md`
- `specs/accessibility.md`
- `specs/api/openapi.yaml`
- The active task spec in `specs/tasks/`

## Work Loop

1. Confirm the requested behavior against the specs.
2. Update the relevant spec first when behavior changes.
3. Add or update failing tests or acceptance checks.
4. Implement the smallest coherent change.
5. Regenerate API client/types from `specs/api/openapi.yaml`.
6. Run the relevant checks.
7. Summarize the behavior covered by specs and tests.

## Hard Rules

- Do not hand-edit generated API client files except the small runtime wrapper in
  `packages/api-client/src/client.ts`.
- Do not introduce endpoints that are not represented in OpenAPI.
- Do not bypass permission checks in views or serializers.
- Do not add custom interactive UI without keyboard behavior and accessible
  name/role/state tests.
- WCAG 2.2 AA issues in public, staff, or admin flows block MVP acceptance.
- Finnish and English are both first-class product languages.

## Quality Gates

Run these before a handoff when the toolchain is available:

```sh
pnpm lint
pnpm test
pnpm e2e
cd apps/api && uv run pytest
cd apps/api && uv run python manage.py spectacular --file ../../tmp-openapi.yaml --validate
```

When a command cannot be run in the current environment, document the reason and
the exact command for the next agent.
