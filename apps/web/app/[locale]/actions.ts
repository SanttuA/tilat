"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cancelReservation,
  createReservation,
  createStaffMembership,
  createStaffResource,
  deleteStaffMembership,
  signIn,
  signOut,
  signUp,
  staffReservationAction as sendStaffReservationAction,
} from "@/lib/api";
import { signupErrorMessage } from "@/lib/api-errors";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth";
import { nextFormState, type FormState } from "@/lib/form-state";
import { getMessages, isLocale, t, type Locale } from "@/lib/i18n";

export type { FormState } from "@/lib/form-state";

function localePath(formData: FormData, suffix: string): string {
  const locale = String(formData.get("locale") ?? "fi");
  return `/${isLocale(locale) ? locale : "fi"}${suffix}`;
}

function formLocale(formData: FormData): Locale {
  const locale = String(formData.get("locale") ?? "fi");
  return isLocale(locale) ? locale : "fi";
}

function safeNextPath(formData: FormData, locale: Locale, fallback: string): string {
  const next = String(formData.get("next") ?? "");
  if (next.startsWith(`/${locale}/`) || next === `/${locale}`) {
    return next;
  }
  return `/${locale}${fallback}`;
}

export async function signInAction(_state: FormState, formData: FormData): Promise<FormState> {
  const locale = formLocale(formData);
  const messages = getMessages(locale);
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { data, error } = await signIn({ email, password });
  if (error || !data) {
    return nextFormState(_state, "error", t(messages, "auth.invalidCredentials"));
  }

  await setAccessToken(data.token);
  redirect(safeNextPath(formData, locale, "/reservations"));
}

export async function signUpAction(_state: FormState, formData: FormData): Promise<FormState> {
  const locale = formLocale(formData);
  const messages = getMessages(locale);
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");

  const { data, error } = await signUp({ email, name, password });
  if (error || !data) {
    return nextFormState(_state, "error", signupErrorMessage(messages, error));
  }

  await setAccessToken(data.token);
  redirect(`/${locale}/reservations`);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = formLocale(formData);
  const accessToken = await getAccessToken();
  try {
    if (accessToken) {
      await signOut(accessToken);
    }
  } catch {
    // Local signout must still complete if the API is restarting or unavailable.
  } finally {
    await clearAccessToken();
  }
  redirect(`/${locale}`);
}

export async function createReservationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  const messages = getMessages(locale);
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return nextFormState(_state, "error", t(messages, "auth.required"));
  }

  const slot = String(formData.get("slot") ?? "");
  const [begin, end] = slot.split("|");
  const resourceId = String(formData.get("resourceId") ?? "");
  const note = String(formData.get("note") ?? "");

  if (!begin || !end || !resourceId) {
    return nextFormState(_state, "error", t(messages, "booking.missingDetails"));
  }

  try {
    const { error } = await createReservation(accessToken, { resourceId, begin, end, note });
    if (error) {
      return nextFormState(_state, "error", t(messages, "booking.error"));
    }
  } catch {
    return nextFormState(_state, "error", t(messages, "booking.error"));
  }

  revalidatePath("/[locale]/reservations", "page");
  return nextFormState(_state, "success", t(messages, "booking.success"));
}

export async function reservationStaffAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  const messages = getMessages(locale);
  const accessToken = await getAccessToken();
  if (!accessToken) return nextFormState(_state, "error", t(messages, "auth.required"));
  const id = String(formData.get("reservationId") ?? "");
  const action = String(formData.get("action") ?? "") as "approve" | "deny" | "cancel";
  if (!id || !["approve", "deny", "cancel"].includes(action)) {
    return nextFormState(_state, "error", t(messages, "staff.reservationActionError"));
  }
  try {
    const { error } = await sendStaffReservationAction(accessToken, id, action);
    if (error) {
      return nextFormState(_state, "error", staffReservationMessage(messages, action, "error"));
    }
  } catch {
    return nextFormState(_state, "error", staffReservationMessage(messages, action, "error"));
  }
  revalidatePath(localePath(formData, "/staff"), "page");
  return nextFormState(_state, "success", staffReservationMessage(messages, action, "success"));
}

export async function cancelOwnReservationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  const messages = getMessages(locale);
  const accessToken = await getAccessToken();
  if (!accessToken) return nextFormState(_state, "error", t(messages, "auth.required"));
  const id = String(formData.get("reservationId") ?? "");
  if (!id) return nextFormState(_state, "error", t(messages, "reservations.cancelError"));
  try {
    const { error } = await cancelReservation(accessToken, id);
    if (error) {
      return nextFormState(_state, "error", t(messages, "reservations.cancelError"));
    }
  } catch {
    return nextFormState(_state, "error", t(messages, "reservations.cancelError"));
  }
  revalidatePath(localePath(formData, "/reservations"), "page");
  return nextFormState(_state, "success", t(messages, "reservations.cancelSuccess"));
}

export async function createStaffResourceAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  const messages = getMessages(locale);
  const accessToken = await getAccessToken();
  if (!accessToken) return nextFormState(_state, "error", t(messages, "auth.required"));
  const unitId = String(formData.get("unitId") ?? "");
  const nameFi = String(formData.get("nameFi") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 0);
  const slotMinutes = Number(formData.get("slotMinutes") ?? 30);
  const requiresApproval = formData.get("requiresApproval") === "on";

  if (!unitId || !nameFi || !nameEn || capacity < 1) {
    return nextFormState(_state, "error", t(messages, "staff.resourceSaveError"));
  }

  try {
    const { error } = await createStaffResource(accessToken, {
      unitId,
      name: { fi: nameFi, en: nameEn },
      description: { fi: "", en: "" },
      reservationInstructions: { fi: "", en: "" },
      capacity,
      slotMinutes,
      requiresApproval,
    });
    if (error) {
      return nextFormState(_state, "error", t(messages, "staff.resourceSaveError"));
    }
  } catch {
    return nextFormState(_state, "error", t(messages, "staff.resourceSaveError"));
  }
  revalidatePath(localePath(formData, "/staff/resources"), "page");
  return nextFormState(_state, "success", t(messages, "staff.resourceSaveSuccess"));
}

export async function createStaffMembershipAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  const messages = getMessages(locale);
  const accessToken = await getAccessToken();
  if (!accessToken) return nextFormState(_state, "error", t(messages, "auth.required"));
  const unitId = String(formData.get("unitId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!unitId || !userId)
    return nextFormState(_state, "error", t(messages, "staff.addMemberError"));
  try {
    const { error } = await createStaffMembership(accessToken, { unitId, userId });
    if (error) {
      return nextFormState(_state, "error", t(messages, "staff.addMemberError"));
    }
  } catch {
    return nextFormState(_state, "error", t(messages, "staff.addMemberError"));
  }
  revalidatePath(localePath(formData, "/staff/memberships"), "page");
  return nextFormState(_state, "success", t(messages, "staff.addMemberSuccess"));
}

export async function deleteStaffMembershipAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const locale = formLocale(formData);
  const messages = getMessages(locale);
  const accessToken = await getAccessToken();
  if (!accessToken) return nextFormState(_state, "error", t(messages, "auth.required"));
  const id = String(formData.get("membershipId") ?? "");
  if (!id) return nextFormState(_state, "error", t(messages, "staff.removeMemberError"));
  try {
    const { error } = await deleteStaffMembership(accessToken, id);
    if (error) {
      return nextFormState(_state, "error", t(messages, "staff.removeMemberError"));
    }
  } catch {
    return nextFormState(_state, "error", t(messages, "staff.removeMemberError"));
  }
  revalidatePath(localePath(formData, "/staff/memberships"), "page");
  return nextFormState(_state, "success", t(messages, "staff.removeMemberSuccess"));
}

function staffReservationMessage(
  messages: ReturnType<typeof getMessages>,
  action: "approve" | "deny" | "cancel",
  result: "success" | "error",
): string {
  if (action === "approve") {
    return result === "success"
      ? t(messages, "staff.approveSuccess")
      : t(messages, "staff.approveError");
  }
  if (action === "deny") {
    return result === "success" ? t(messages, "staff.denySuccess") : t(messages, "staff.denyError");
  }
  return result === "success"
    ? t(messages, "staff.cancelSuccess")
    : t(messages, "staff.cancelError");
}
