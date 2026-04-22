import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../lib/api";
import { hasValidSession } from "../lib/session";

vi.mock("../lib/api", () => ({
  getMe: vi.fn(),
}));

const getMeMock = vi.mocked(getMe);

describe("session validation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects missing tokens without calling the identity endpoint", async () => {
    await expect(hasValidSession()).resolves.toBe(false);

    expect(getMeMock).not.toHaveBeenCalled();
  });

  it("rejects tokens that fail identity validation", async () => {
    getMeMock.mockResolvedValue(null);

    await expect(hasValidSession("expired-token")).resolves.toBe(false);

    expect(getMeMock).toHaveBeenCalledWith("expired-token");
  });

  it("accepts tokens that return an identity", async () => {
    getMeMock.mockResolvedValue({
      id: "user-id",
      email: "user@example.com",
      name: "User",
      isAdmin: false,
      staffUnitIds: [],
    });

    await expect(hasValidSession("valid-token")).resolves.toBe(true);

    expect(getMeMock).toHaveBeenCalledWith("valid-token");
  });
});
