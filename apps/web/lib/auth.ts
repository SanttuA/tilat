import { cookies } from "next/headers";

export const authCookieName = "reservation_access_token";
const maxAge = 60 * 60 * 24 * 30;

export async function getAccessToken() {
  return (await cookies()).get(authCookieName)?.value;
}

export async function setAccessToken(token: string) {
  (await cookies()).set(authCookieName, token, {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAccessToken() {
  (await cookies()).delete(authCookieName);
}
