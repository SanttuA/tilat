import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "./schema";

export type ApiClient = ReturnType<typeof createReservationApiClient>;

export function createReservationApiClient(options: {
  baseUrl: string;
  accessToken?: string;
  fetch?: typeof fetch;
}) {
  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      if (options.accessToken) {
        request.headers.set("Authorization", `Bearer ${options.accessToken}`);
      }
      request.headers.set("Accept", "application/json");
      return request;
    },
  };

  const client = createClient<paths>({
    baseUrl: options.baseUrl.replace(/\/$/, ""),
    fetch: options.fetch,
  });
  client.use(authMiddleware);
  return client;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
