import en from "../messages/en.json";
import fi from "../messages/fi.json";

export const locales = ["fi", "en"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  fi: "Suomi",
  en: "English",
};

const messages = { fi, en };

export type Messages = typeof fi;
type MessageLeafKeys<T> = {
  [K in Extract<keyof T, string>]: T[K] extends string
    ? K
    : T[K] extends Record<string, unknown>
      ? `${K}.${MessageLeafKeys<T[K]>}`
      : never;
}[Extract<keyof T, string>];
export type MessageKey = MessageLeafKeys<Messages>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function t(messagesForLocale: Messages, key: MessageKey): string {
  let value: unknown = messagesForLocale;
  for (const part of key.split(".")) {
    if (!value || typeof value !== "object" || !(part in value)) {
      return key;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : key;
}

export function localized(
  value: { fi?: string | null; en?: string | null } | null | undefined,
  locale: Locale,
): string {
  if (!value) return "";
  return value[locale] || value.fi || value.en || "";
}

export function equivalentLocalePath(pathname: string, nextLocale: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) {
    parts[1] = nextLocale;
    return parts.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}
