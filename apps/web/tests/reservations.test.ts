import { beforeEach, describe, expect, it, vi } from "vitest";

import { listOwnReservationsForValidSession } from "../lib/reservations";
import { getMe, listOwnReservations } from "../lib/api";

vi.mock("../lib/api", () => ({
  getMe: vi.fn(),
  listOwnReservations: vi.fn(),
}));

const getMeMock = vi.mocked(getMe);
const listOwnReservationsMock = vi.mocked(listOwnReservations);

describe("reservation session loading", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("does not list reservations when the token is missing", async () => {
    await expect(listOwnReservationsForValidSession()).resolves.toBeNull();

    expect(getMeMock).not.toHaveBeenCalled();
    expect(listOwnReservationsMock).not.toHaveBeenCalled();
  });

  it("does not list reservations when the identity endpoint rejects the token", async () => {
    getMeMock.mockResolvedValue(null);

    await expect(listOwnReservationsForValidSession("expired-token")).resolves.toBeNull();

    expect(getMeMock).toHaveBeenCalledWith("expired-token");
    expect(listOwnReservationsMock).not.toHaveBeenCalled();
  });

  it("lists reservations only after identity validation succeeds", async () => {
    const reservationPage = { count: 0, results: [] };
    getMeMock.mockResolvedValue({
      id: "user-id",
      email: "user@example.com",
      name: "User",
      isAdmin: false,
      staffUnitIds: [],
    });
    listOwnReservationsMock.mockResolvedValue(reservationPage);

    await expect(listOwnReservationsForValidSession("valid-token")).resolves.toBe(reservationPage);

    expect(getMeMock).toHaveBeenCalledWith("valid-token");
    expect(listOwnReservationsMock).toHaveBeenCalledWith("valid-token");
  });
});
