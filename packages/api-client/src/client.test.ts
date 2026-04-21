import { describe, expect, it } from "vitest";

import { createReservationApiClient } from "./client";

describe("createReservationApiClient", () => {
  it("adds bearer authorization when a token is provided", async () => {
    let authorization = "";
    const api = createReservationApiClient({
      baseUrl: "https://api.example.test/api/v1",
      accessToken: "token",
      fetch: (async (input) => {
        authorization = (input as Request).headers.get("Authorization") ?? "";
        return new Response(JSON.stringify({ count: 0, results: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as typeof fetch,
    });

    await api.GET("/resources");

    expect(authorization).toBe("Bearer token");
  });
});
