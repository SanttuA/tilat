import { beforeEach, describe, expect, it, vi } from "vitest";

import { signOutAction } from "../app/[locale]/actions";
import { signOut } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import { redirect } from "next/navigation";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/api", () => ({
  cancelReservation: vi.fn(),
  createReservation: vi.fn(),
  createStaffMembership: vi.fn(),
  createStaffResource: vi.fn(),
  deleteStaffMembership: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  staffReservationAction: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  clearAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
}));

const clearAccessTokenMock = vi.mocked(clearAccessToken);
const getAccessTokenMock = vi.mocked(getAccessToken);
const redirectMock = vi.mocked(redirect);
const signOutMock = vi.mocked(signOut);

function signoutForm(locale = "en") {
  const formData = new FormData();
  formData.set("locale", locale);
  return formData;
}

describe("signOutAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`);
    });
  });

  it("clears the local auth cookie and redirects when backend signout succeeds", async () => {
    getAccessTokenMock.mockResolvedValue("active-token");

    await expect(signOutAction(signoutForm("fi"))).rejects.toThrow("redirect:/fi");

    expect(signOutMock).toHaveBeenCalledWith("active-token");
    expect(clearAccessTokenMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/fi");
  });

  it("clears the local auth cookie and redirects when backend signout fails", async () => {
    getAccessTokenMock.mockResolvedValue("stale-token");
    signOutMock.mockRejectedValue(new Error("API unavailable"));

    await expect(signOutAction(signoutForm("en"))).rejects.toThrow("redirect:/en");

    expect(signOutMock).toHaveBeenCalledWith("stale-token");
    expect(clearAccessTokenMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/en");
  });
});
