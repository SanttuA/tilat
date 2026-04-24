import type { components } from "@reservation/api-client";

export type CurrentUser = components["schemas"]["Me"];

export function canUseReservations(user: CurrentUser | null | undefined): user is CurrentUser {
  return Boolean(user);
}

export function canUseStaff(user: CurrentUser | null | undefined): user is CurrentUser {
  return Boolean(user && (user.isAdmin || user.staffUnitIds.length > 0));
}

export function canUseAdmin(user: CurrentUser | null | undefined): user is CurrentUser {
  return Boolean(user?.isAdmin);
}
