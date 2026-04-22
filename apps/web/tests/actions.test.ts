import { beforeEach, describe, expect, it, vi } from "vitest";

import { signOutAction, signUpAction } from "../app/[locale]/actions";
import { signOut, signUp } from "@/lib/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth";
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
const signUpMock = vi.mocked(signUp);
const setAccessTokenMock = vi.mocked(setAccessToken);

function signoutForm(locale = "en") {
  const formData = new FormData();
  formData.set("locale", locale);
  return formData;
}

function signupForm(locale = "en") {
  const formData = new FormData();
  formData.set("locale", locale);
  formData.set("email", "user@example.com");
  formData.set("name", "Test User");
  formData.set("password", "Local-demo-12345");
  return formData;
}

describe("signUpAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`);
    });
  });

  it("shows a localized duplicate-email validation error", async () => {
    signUpMock.mockResolvedValue({
      data: undefined,
      error: { email: ["A user with this email already exists."] },
    } as never);

    await expect(signUpAction({ status: "idle", message: "" }, signupForm("en"))).resolves.toEqual({
      status: "error",
      message: "An account with this email already exists. Sign in or use another address.",
    });

    expect(setAccessTokenMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("maps rejected password validation to a localized error", async () => {
    signUpMock.mockResolvedValue({
      data: undefined,
      error: { password: ["This password is too common."] },
    } as never);

    await expect(signUpAction({ status: "idle", message: "" }, signupForm("fi"))).resolves.toEqual({
      status: "error",
      message: "Käytä vahvempaa salasanaa ja yritä uudelleen.",
    });
  });
});

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
