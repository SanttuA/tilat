FROM ghcr.io/astral-sh/uv:0.11.6-python3.14-trixie-slim AS base

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

FROM base AS dev
COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --dev --locked
COPY apps/api .
EXPOSE 8000

FROM base AS server
COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --no-dev --locked
COPY apps/api .
RUN uv run python manage.py collectstatic --noinput
EXPOSE 8000
