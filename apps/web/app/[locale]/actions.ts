"use server";

import { revalidatePath } from "next/cache";

import {
  cancelReservation,
  createReservation,
  createStaffMembership,
  createStaffResource,
  deleteStaffMembership,
  staffReservationAction,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";

export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
};

function localePath(formData: FormData, suffix: string): string {
  const locale = String(formData.get("locale") ?? "fi");
  return `/${isLocale(locale) ? locale : "fi"}${suffix}`;
}

export async function createReservationAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { status: "error", message: "Authentication required." };
  }

  const slot = String(formData.get("slot") ?? "");
  const [begin, end] = slot.split("|");
  const resourceId = String(formData.get("resourceId") ?? "");
  const note = String(formData.get("note") ?? "");

  if (!begin || !end || !resourceId) {
    return { status: "error", message: "Required reservation details are missing." };
  }

  const { error } = await createReservation(accessToken, { resourceId, begin, end, note });
  if (error) {
    return { status: "error", message: "Reservation could not be created." };
  }

  revalidatePath("/[locale]/reservations", "page");
  return { status: "success", message: "Reservation submitted." };
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
