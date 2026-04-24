import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelOwnReservationAction,
  createReservationAction,
  createStaffMembershipAction,
  createStaffResourceAction,
  deleteStaffMembershipAction,
  reservationStaffAction,
  signOutAction,
  signUpAction,
  updateStaffResourceAction,
} from "../app/[locale]/actions";
import {
  cancelReservation,
  createReservation,
  createStaffMembership,
  createStaffResource,
  deleteStaffMembership,
  signOut,
  signUp,
  staffReservationAction,
  updateStaffResource,
} from "@/lib/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth";
import { initialFormState } from "@/lib/form-state";
import { revalidatePath } from "next/cache";
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
  updateStaffResource: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  clearAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
}));

const clearAccessTokenMock = vi.mocked(clearAccessToken);
const cancelReservationMock = vi.mocked(cancelReservation);
const createReservationMock = vi.mocked(createReservation);
const createStaffMembershipMock = vi.mocked(createStaffMembership);
const createStaffResourceMock = vi.mocked(createStaffResource);
const deleteStaffMembershipMock = vi.mocked(deleteStaffMembership);
const getAccessTokenMock = vi.mocked(getAccessToken);
const revalidatePathMock = vi.mocked(revalidatePath);
const redirectMock = vi.mocked(redirect);
const signOutMock = vi.mocked(signOut);
const signUpMock = vi.mocked(signUp);
const staffReservationActionMock = vi.mocked(staffReservationAction);
const setAccessTokenMock = vi.mocked(setAccessToken);
const updateStaffResourceMock = vi.mocked(updateStaffResource);

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

function reservationForm(locale = "en") {
  const formData = new FormData();
  formData.set("locale", locale);
  formData.set("reservationId", "reservation-id");
  return formData;
}

function bookingForm(locale = "en") {
  const formData = new FormData();
  formData.set("locale", locale);
  formData.set("resourceId", "resource-id");
  formData.set("begin", "2026-04-24T09:00:00Z");
  formData.set("end", "2026-04-24T10:00:00Z");
  formData.set("answer.name", "Test User");
  formData.set("answer.email", "user@example.com");
  formData.set("answer.additionalInfo", "Needs a projector");
  return formData;
}

function staffReservationForm(action = "approve", locale = "en") {
  const formData = reservationForm(locale);
  formData.set("action", action);
  return formData;
}

function staffResourceForm(locale = "en") {
  const formData = new FormData();
  formData.set("locale", locale);
  formData.set("unitId", "unit-id");
  formData.set("nameFi", "Kokoushuone");
  formData.set("nameEn", "Meeting room");
  formData.set("capacity", "10");
  formData.set("slotMinutes", "60");
  formData.set("requiresApproval", "on");
  formData.append("reservationFields", "name");
  formData.set("reservationRequired.name", "on");
  formData.append("reservationFields", "email");
  formData.set("reservationRequired.email", "on");
  formData.append("reservationFields", "additionalInfo");
  return formData;
}

function staffResourceUpdateForm(locale = "en") {
  const formData = new FormData();
  formData.set("locale", locale);
  formData.set("resourceId", "resource-id");
  formData.append("reservationFields", "phoneNumber");
  formData.set("reservationRequired.phoneNumber", "on");
  return formData;
}

function staffMembershipForm(locale = "en") {
  const formData = new FormData();
  formData.set("locale", locale);
  formData.set("unitId", "unit-id");
  formData.set("userId", "user-id");
  formData.set("membershipId", "membership-id");
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

    await expect(signUpAction(initialFormState, signupForm("en"))).resolves.toEqual({
      status: "error",
      message: "An account with this email already exists. Sign in or use another address.",
      sequence: 1,
    });

    expect(setAccessTokenMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("maps rejected password validation to a localized error", async () => {
    signUpMock.mockResolvedValue({
      data: undefined,
      error: { password: ["This password is too common."] },
    } as never);

    await expect(signUpAction(initialFormState, signupForm("fi"))).resolves.toEqual({
      status: "error",
      message: "Käytä vahvempaa salasanaa ja yritä uudelleen.",
      sequence: 1,
    });
  });
});

describe("reservation feedback actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns localized success feedback when an own reservation is cancelled", async () => {
    getAccessTokenMock.mockResolvedValue("active-token");
    cancelReservationMock.mockResolvedValue({ data: {}, error: undefined } as never);

    await expect(
      cancelOwnReservationAction(initialFormState, reservationForm("en")),
    ).resolves.toEqual({
      status: "success",
      message: "Reservation cancelled.",
      sequence: 1,
    });

    expect(cancelReservationMock).toHaveBeenCalledWith("active-token", "reservation-id");
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/reservations", "page");
  });

  it("submits structured reservation form answers", async () => {
    getAccessTokenMock.mockResolvedValue("active-token");
    createReservationMock.mockResolvedValue({ data: {}, error: undefined } as never);

    await expect(createReservationAction(initialFormState, bookingForm("en"))).resolves.toEqual({
      status: "success",
      message: "Reservation submitted.",
      sequence: 1,
    });

    expect(createReservationMock).toHaveBeenCalledWith("active-token", {
      resourceId: "resource-id",
      begin: "2026-04-24T09:00:00Z",
      end: "2026-04-24T10:00:00Z",
      formAnswers: {
        name: "Test User",
        email: "user@example.com",
        additionalInfo: "Needs a projector",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/reservations", "page");
  });

  it("returns localized error feedback when an own cancellation fails", async () => {
    getAccessTokenMock.mockResolvedValue("active-token");
    cancelReservationMock.mockResolvedValue({
      data: undefined,
      error: { detail: "Failed" },
    } as never);

    await expect(
      cancelOwnReservationAction(initialFormState, reservationForm("fi")),
    ).resolves.toEqual({
      status: "error",
      message: "Varausta ei voitu perua.",
      sequence: 1,
    });

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns localized success feedback for staff reservation actions", async () => {
    getAccessTokenMock.mockResolvedValue("staff-token");
    staffReservationActionMock.mockResolvedValue({ data: {}, error: undefined } as never);

    await expect(
      reservationStaffAction(initialFormState, staffReservationForm("approve", "en")),
    ).resolves.toEqual({
      status: "success",
      message: "Reservation approved.",
      sequence: 1,
    });

    expect(staffReservationActionMock).toHaveBeenCalledWith(
      "staff-token",
      "reservation-id",
      "approve",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/staff", "page");
  });
});

describe("staff feedback actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns localized success feedback when a staff resource is created", async () => {
    getAccessTokenMock.mockResolvedValue("staff-token");
    createStaffResourceMock.mockResolvedValue({ data: {}, error: undefined } as never);

    await expect(
      createStaffResourceAction(initialFormState, staffResourceForm("en")),
    ).resolves.toEqual({
      status: "success",
      message: "Resource saved.",
      sequence: 1,
    });

    expect(createStaffResourceMock).toHaveBeenCalledWith("staff-token", {
      unitId: "unit-id",
      name: { fi: "Kokoushuone", en: "Meeting room" },
      description: { fi: "", en: "" },
      reservationInstructions: { fi: "", en: "" },
      capacity: 10,
      slotMinutes: 60,
      requiresApproval: true,
      reservationForm: {
        fields: [
          { key: "name", required: true },
          { key: "email", required: true },
          { key: "additionalInfo", required: false },
        ],
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/staff/resources", "page");
  });

  it("returns localized success feedback when a staff resource form is updated", async () => {
    getAccessTokenMock.mockResolvedValue("staff-token");
    updateStaffResourceMock.mockResolvedValue({ data: {}, error: undefined } as never);

    await expect(
      updateStaffResourceAction(initialFormState, staffResourceUpdateForm("en")),
    ).resolves.toEqual({
      status: "success",
      message: "Resource saved.",
      sequence: 1,
    });

    expect(updateStaffResourceMock).toHaveBeenCalledWith("staff-token", "resource-id", {
      reservationForm: {
        fields: [{ key: "phoneNumber", required: true }],
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/staff/resources", "page");
  });

  it("returns localized success feedback when a staff membership is added", async () => {
    getAccessTokenMock.mockResolvedValue("staff-token");
    createStaffMembershipMock.mockResolvedValue({ data: {}, error: undefined } as never);

    await expect(
      createStaffMembershipAction(initialFormState, staffMembershipForm("fi")),
    ).resolves.toEqual({
      status: "success",
      message: "Henkilöstöoikeus lisättiin.",
      sequence: 1,
    });

    expect(createStaffMembershipMock).toHaveBeenCalledWith("staff-token", {
      unitId: "unit-id",
      userId: "user-id",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/fi/staff/memberships", "page");
  });

  it("returns localized success feedback when a staff membership is removed", async () => {
    getAccessTokenMock.mockResolvedValue("staff-token");
    deleteStaffMembershipMock.mockResolvedValue({ data: undefined, error: undefined } as never);

    await expect(
      deleteStaffMembershipAction(initialFormState, staffMembershipForm("en")),
    ).resolves.toEqual({
      status: "success",
      message: "Staff permission removed.",
      sequence: 1,
    });

    expect(deleteStaffMembershipMock).toHaveBeenCalledWith("staff-token", "membership-id");
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/staff/memberships", "page");
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
