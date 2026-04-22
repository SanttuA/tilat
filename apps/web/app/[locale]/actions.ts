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
  staffReservationAction,
} from "@/lib/api";
import { signupErrorMessage } from "@/lib/api-errors";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth";
import { getMessages, isLocale, t, type Locale } from "@/lib/i18n";

export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
};

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
    return { status: "error", message: t(messages, "auth.invalidCredentials") };
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
    return { status: "error", message: signupErrorMessage(messages, error) };
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
    return { status: "error", message: t(messages, "auth.required") };
  }

  const slot = String(formData.get("slot") ?? "");
  const [begin, end] = slot.split("|");
  const resourceId = String(formData.get("resourceId") ?? "");
  const note = String(formData.get("note") ?? "");

  if (!begin || !end || !resourceId) {
    return { status: "error", message: t(messages, "booking.missingDetails") };
  }

  const { error } = await createReservation(accessToken, { resourceId, begin, end, note });
  if (error) {
    return { status: "error", message: t(messages, "booking.error") };
  }

  revalidatePath("/[locale]/reservations", "page");
  return { status: "success", message: t(messages, "booking.success") };
}

export async function reservationStaffAction(formData: FormData): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) return;
  const id = String(formData.get("reservationId") ?? "");
  const action = String(formData.get("action") ?? "") as "approve" | "deny" | "cancel";
  if (!id || !["approve", "deny", "cancel"].includes(action)) return;
  await staffReservationAction(accessToken, id, action);
  revalidatePath(localePath(formData, "/staff"), "page");
}

export async function cancelOwnReservationAction(formData: FormData): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) return;
  const id = String(formData.get("reservationId") ?? "");
  if (!id) return;
  await cancelReservation(accessToken, id);
  revalidatePath(localePath(formData, "/reservations"), "page");
}

export async function createStaffResourceAction(formData: FormData): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) return;
  const unitId = String(formData.get("unitId") ?? "");
  const nameFi = String(formData.get("nameFi") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 0);
  const slotMinutes = Number(formData.get("slotMinutes") ?? 30);
  const requiresApproval = formData.get("requiresApproval") === "on";

  if (!unitId || !nameFi || !nameEn || capacity < 1) return;

  await createStaffResource(accessToken, {
    unitId,
    name: { fi: nameFi, en: nameEn },
    description: { fi: "", en: "" },
    reservationInstructions: { fi: "", en: "" },
    capacity,
    slotMinutes,
    requiresApproval,
  });
  revalidatePath(localePath(formData, "/staff/resources"), "page");
}

export async function createStaffMembershipAction(formData: FormData): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) return;
  const unitId = String(formData.get("unitId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!unitId || !userId) return;
  await createStaffMembership(accessToken, { unitId, userId });
  revalidatePath(localePath(formData, "/staff/memberships"), "page");
}

export async function deleteStaffMembershipAction(formData: FormData): Promise<void> {
  const accessToken = await getAccessToken();
  if (!accessToken) return;
  const id = String(formData.get("membershipId") ?? "");
  if (!id) return;
  await deleteStaffMembership(accessToken, id);
  revalidatePath(localePath(formData, "/staff/memberships"), "page");
}
