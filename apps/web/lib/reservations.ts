import { listOwnReservations } from "./api";
import { hasValidSession } from "./session";

export async function listOwnReservationsForValidSession(accessToken?: string) {
  if (!accessToken) return null;

  if (!(await hasValidSession(accessToken))) return null;

  return listOwnReservations(accessToken);
}
