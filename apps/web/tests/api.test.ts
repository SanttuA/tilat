import { createReservationApiClient } from "@reservation/api-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listStaffResources } from "@/lib/api";

vi.mock("@reservation/api-client", () => ({
  createReservationApiClient: vi.fn(),
}));

const createReservationApiClientMock = vi.mocked(createReservationApiClient);

describe("staff API fallbacks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns an empty staff resource page when the staff resource request fails", async () => {
    createReservationApiClientMock.mockReturnValue({
      GET: vi.fn().mockRejectedValue(new Error("API unavailable")),
    } as never);

    await expect(listStaffResources("staff-token")).resolves.toEqual({
      count: 0,
      results: [],
    });
  });
});
