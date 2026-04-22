import { cookies } from "next/headers";

import { authCookieMaxAgeSeconds } from "./auth-config";

export const authCookieName = "reservation_access_token";

export async function getAccessToken() {
  return (await cookies()).get(authCookieName)?.value;
}

export async function setAccessToken(token: string) {
  (await cookies()).set(authCookieName, token, {
    httpOnly: true,
    maxAge: authCookieMaxAgeSeconds(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAccessToken() {
  (await cookies()).delete(authCookieName);
}
