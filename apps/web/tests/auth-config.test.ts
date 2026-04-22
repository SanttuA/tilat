import { describe, expect, it } from "vitest";

import { authCookieMaxAgeSeconds, passwordAuthTokenTtlDays } from "../lib/auth-config";

describe("auth cookie lifetime", () => {
  it("defaults to the backend token default", () => {
    expect(passwordAuthTokenTtlDays({})).toBe(30);
    expect(authCookieMaxAgeSeconds({})).toBe(60 * 60 * 24 * 30);
  });

  it("uses PASSWORD_AUTH_TOKEN_TTL_DAYS", () => {
    expect(passwordAuthTokenTtlDays({ PASSWORD_AUTH_TOKEN_TTL_DAYS: "7" })).toBe(7);
    expect(authCookieMaxAgeSeconds({ PASSWORD_AUTH_TOKEN_TTL_DAYS: "7" })).toBe(60 * 60 * 24 * 7);
  });

  it("rejects invalid PASSWORD_AUTH_TOKEN_TTL_DAYS values", () => {
    expect(() => passwordAuthTokenTtlDays({ PASSWORD_AUTH_TOKEN_TTL_DAYS: "0" })).toThrow(
      "PASSWORD_AUTH_TOKEN_TTL_DAYS must be a positive integer.",
    );
    expect(() => passwordAuthTokenTtlDays({ PASSWORD_AUTH_TOKEN_TTL_DAYS: "1.5" })).toThrow(
      "PASSWORD_AUTH_TOKEN_TTL_DAYS must be a positive integer.",
    );
    expect(() => passwordAuthTokenTtlDays({ PASSWORD_AUTH_TOKEN_TTL_DAYS: "abc" })).toThrow(
      "PASSWORD_AUTH_TOKEN_TTL_DAYS must be a positive integer.",
    );
  });
});
