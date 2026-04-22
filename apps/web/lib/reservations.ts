import { getMe, listOwnReservations } from "./api";

export async function listOwnReservationsForValidSession(accessToken?: string) {
  if (!accessToken) return null;

  const user = await getMe(accessToken);
  if (!user) return null;

  return listOwnReservations(accessToken);
}
