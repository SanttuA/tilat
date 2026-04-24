"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ActionFeedbackForm";
import { useActionFeedback } from "@/components/Feedback";
import { initialFormState, type FormState } from "@/lib/form-state";
import type { Locale, Messages } from "@/lib/i18n";
import { localized, t } from "@/lib/i18n";
import type { components } from "@reservation/api-client";

export function BookingForm({
  locale,
  messages,
  resource,
  availability,
  action,
}: {
  locale: Locale;
  messages: Messages;
  resource: components["schemas"]["Resource"];
  availability: components["schemas"]["Availability"];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  useActionFeedback(state);
  const availableSlots = availability.slots.filter((slot) => slot.available);
  const errorId = "booking-error";

  return (
    <form
      action={formAction}
      aria-busy={pending || undefined}
      aria-describedby={state.status === "error" ? errorId : undefined}
      className="card"
    >
      <input name="locale" type="hidden" value={locale} />
      <input name="resourceId" type="hidden" value={resource.id} />
      <h2>{t(messages, "resource.booking")}</h2>
      {state.status === "error" ? (
        <div className="status error" id={errorId}>
          {state.message}
        </div>
      ) : null}
      <fieldset className="slot-grid">
        <legend>{t(messages, "resource.selectSlot")}</legend>
        {availableSlots.length === 0 ? <p>{t(messages, "resource.noSlots")}</p> : null}
        {availability.slots.map((slot) => {
          const start = new Date(slot.start);
          const end = new Date(slot.end);
          const label = `${localized(resource.name, locale)}, ${availability.date}, ${start.toLocaleTimeString(
            locale,
            { hour: "2-digit", minute: "2-digit" },
          )}-${end.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;
          return (
            <label aria-disabled={!slot.available} className="slot-option" key={slot.start}>
              <input
                disabled={!slot.available}
                name="slot"
                required
                type="radio"
                value={`${slot.start}|${slot.end}`}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </fieldset>
      <label>
        {t(messages, "booking.note")}
        <textarea name="note" />
      </label>
      <SubmitButton
        className="button"
        disabled={availableSlots.length === 0}
        pendingLabel={t(messages, "booking.pending")}
        type="submit"
      >
        {t(messages, "booking.submit")}
      </SubmitButton>
    </form>
  );
}
