import { getMe } from "./api";

export async function hasValidSession(accessToken?: string) {
  if (!accessToken) return false;

  return Boolean(await getMe(accessToken));
}
