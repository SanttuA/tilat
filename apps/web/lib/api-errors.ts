import { t, type Messages } from "./i18n";

function stringMessages(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function fieldErrors(error: unknown, field: string): string[] {
  if (!error || typeof error !== "object") return [];

  const record = error as Record<string, unknown>;
  const directErrors = stringMessages(record[field]);
  const fields = record.fields;
  const nestedErrors =
    fields && typeof fields === "object"
      ? stringMessages((fields as Record<string, unknown>)[field])
      : [];

  return [...directErrors, ...nestedErrors];
}

export function signupErrorMessage(messages: Messages, error: unknown): string {
  const emailErrors = fieldErrors(error, "email");
  if (emailErrors.some((message) => message.toLowerCase().includes("already exists"))) {
    return t(messages, "auth.emailAlreadyExists");
  }
  if (emailErrors.length > 0) {
    return t(messages, "auth.emailInvalid");
  }

  if (fieldErrors(error, "password").length > 0) {
    return t(messages, "auth.passwordRejected");
  }

  return t(messages, "auth.signupFailed");
}
