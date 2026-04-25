import type { components } from "@reservation/api-client";

import type { Locale, Messages } from "@/lib/i18n";
import { localized, t } from "@/lib/i18n";

export function BookingForm({
  locale,
  messages,
  resource,
  availability,
}: {
  locale: Locale;
  messages: Messages;
  resource: components["schemas"]["Resource"];
  availability: components["schemas"]["Availability"];
}) {
  const availableSlots = availability.slots.filter((slot) => slot.available);

  return (
    <form action={`/${locale}/resources/${resource.id}/reserve`} className="card" method="get">
      <h2>{t(messages, "resource.booking")}</h2>
      <fieldset className="slot-grid">
        <legend>{t(messages, "resource.selectSlot")}</legend>
        {availableSlots.length === 0 ? <p>{t(messages, "resource.noSlots")}</p> : null}
        {availability.slots.map((slot) => {
          const start = new Date(slot.start);
          const end = new Date(slot.end);
          const availabilityLabel = slot.available
            ? t(messages, "booking.slotAvailable")
            : t(messages, "booking.slotUnavailable");
          const label = `${localized(resource.name, locale)}, ${availability.date}, ${start.toLocaleTimeString(
            locale,
            { hour: "2-digit", minute: "2-digit" },
          )}-${end.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}, ${availabilityLabel}`;
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
      <button className="button" disabled={availableSlots.length === 0} type="submit">
        {t(messages, "booking.continue")}
      </button>
    </form>
  );
}
