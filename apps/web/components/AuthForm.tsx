"use client";

import Link from "next/link";
import { useActionState } from "react";

import { SubmitButton } from "@/components/ActionFeedbackForm";
import { initialFormState, type FormState } from "@/lib/form-state";
import type { Locale, Messages } from "../lib/i18n";
import { t } from "../lib/i18n";

export function AuthForm({
  action,
  locale,
  messages,
  mode,
  next,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  locale: Locale;
  messages: Messages;
  mode: "sign-in" | "sign-up";
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const isSignup = mode === "sign-up";
  const errorId = `${mode}-error`;
  const alternateHref = isSignup ? `/${locale}/sign-in` : `/${locale}/sign-up`;

  return (
    <form
      action={formAction}
      aria-busy={pending || undefined}
      aria-describedby={state.status === "error" ? errorId : undefined}
      className="card auth-card"
    >
      <input name="locale" type="hidden" value={locale} />
      {next ? <input name="next" type="hidden" value={next} /> : null}
      {state.status === "error" ? (
        <div className="status error" id={errorId} role="alert">
          {state.message}
        </div>
      ) : null}
      <label>
        {t(messages, "auth.email")}
        <input autoComplete="email" name="email" required type="email" />
      </label>
      {isSignup ? (
        <label>
          {t(messages, "auth.name")}
          <input autoComplete="name" name="name" required />
        </label>
      ) : null}
      <label>
        {t(messages, "auth.password")}
        <input
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={1}
          name="password"
          required
          type="password"
        />
      </label>
      <SubmitButton className="button" pendingLabel={t(messages, "auth.pending")} type="submit">
        {isSignup ? t(messages, "auth.signUpSubmit") : t(messages, "auth.signInSubmit")}
      </SubmitButton>
      <p>
        <Link href={alternateHref}>
          {isSignup ? t(messages, "auth.haveAccount") : t(messages, "auth.needAccount")}
        </Link>
      </p>
    </form>
  );
}
