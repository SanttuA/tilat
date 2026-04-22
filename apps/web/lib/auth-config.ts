const secondsPerDay = 60 * 60 * 24;
const defaultPasswordAuthTokenTtlDays = 30;

type AuthEnv = Record<string, string | undefined>;

export function passwordAuthTokenTtlDays(env: AuthEnv = process.env): number {
  const rawValue = env.PASSWORD_AUTH_TOKEN_TTL_DAYS ?? String(defaultPasswordAuthTokenTtlDays);
  const days = Number(rawValue);

  if (!Number.isInteger(days) || days < 1) {
    throw new Error("PASSWORD_AUTH_TOKEN_TTL_DAYS must be a positive integer.");
  }

  return days;
}

export function authCookieMaxAgeSeconds(env: AuthEnv = process.env): number {
  return passwordAuthTokenTtlDays(env) * secondsPerDay;
}
