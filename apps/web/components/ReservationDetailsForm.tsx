"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ActionFeedbackForm";
import { useActionFeedback } from "@/components/Feedback";
import { initialFormState, type FormState } from "@/lib/form-state";
import type { Locale, Messages } from "@/lib/i18n";
import { localized, t } from "@/lib/i18n";
import {
  reservationFormAutocomplete,
  reservationFormFieldLabels,
  reservationFormInputTypes,
} from "@/lib/reservation-form";
import type { components } from "@reservation/api-client";

export function ReservationDetailsForm({
  action,
  begin,
  end,
  locale,
  messages,
  profileEmail,
  profileName,
  resource,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  begin: string;
  end: string;
  locale: Locale;
  messages: Messages;
  profileEmail: string;
  profileName: string;
  resource: components["schemas"]["Resource"];
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  useActionFeedback(state);
  const errorId = "reservation-form-error";

  return (
    <form
      action={formAction}
      aria-busy={pending || undefined}
      aria-describedby={state.status === "error" ? errorId : undefined}
      className="card"
    >
      <input name="locale" type="hidden" value={locale} />
      <input name="resourceId" type="hidden" value={resource.id} />
      <input name="begin" type="hidden" value={begin} />
      <input name="end" type="hidden" value={end} />
      <h2>{t(messages, "booking.formTitle")}</h2>
      <p>
        {localized(resource.name, locale)}, {new Date(begin).toLocaleString(locale)}-
        {new Date(end).toLocaleTimeString(locale)}
      </p>
      {state.status === "error" ? (
        <div className="status error" id={errorId} role="alert">
          {state.message}
        </div>
      ) : null}
      {resource.reservationForm.fields.map((field) => {
        const label = field.required
          ? `${t(messages, reservationFormFieldLabels[field.key])} (${t(messages, "common.required")})`
          : t(messages, reservationFormFieldLabels[field.key]);
        const defaultValue =
          field.key === "name" ? profileName : field.key === "email" ? profileEmail : "";
        if (field.key === "additionalInfo") {
          return (
            <label key={field.key}>
              {label}
              <textarea
                autoComplete={reservationFormAutocomplete[field.key]}
                name={`answer.${field.key}`}
                required={field.required}
              />
            </label>
          );
        }
        return (
          <label key={field.key}>
            {label}
            <input
              autoComplete={reservationFormAutocomplete[field.key]}
              defaultValue={defaultValue}
              name={`answer.${field.key}`}
              required={field.required}
              type={reservationFormInputTypes[field.key]}
            />
          </label>
        );
      })}
      <SubmitButton
        className="button"
        pendingLabel={t(messages, "booking.formPending")}
        type="submit"
      >
        {t(messages, "booking.formSubmit")}
      </SubmitButton>
    </form>
  );
}
