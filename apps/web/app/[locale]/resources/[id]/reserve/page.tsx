import Link from "next/link";
import { redirect } from "next/navigation";

import { createReservationAction } from "@/app/[locale]/actions";
import { ReservationAnswers } from "@/components/ReservationAnswers";
import { ReservationDetailsForm } from "@/components/ReservationDetailsForm";
import { getAvailability, getMe, getResource, listOwnReservations } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";

function helsinkiDateIso(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Helsinki",
    year: "numeric",
  }).formatToParts(parsed);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function sameInstant(first: string, second: string): boolean {
  const firstTime = new Date(first).getTime();
  const secondTime = new Date(second).getTime();
  return !Number.isNaN(firstTime) && firstTime === secondTime;
}

export default async function ReservationFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const { slot = "" } = await searchParams;
  const nextPath = `/${locale}/resources/${id}/reserve?slot=${encodeURIComponent(slot)}`;
  const token = await getAccessToken();
  if (!token) {
    redirect(`/${locale}/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  const me = await getMe(token);
  if (!me) {
    redirect(`/${locale}/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  const [begin, end] = slot.split("|");
  const resource = await getResource(id);
  const date = begin ? helsinkiDateIso(begin) : "";
  const availability = date ? await getAvailability(id, date) : null;
  const selectedSlot = availability?.slots.find(
    (candidate) => candidate.start === begin && candidate.end === end && candidate.available,
  );
  const ownReservations = begin && end ? await listOwnReservations(token) : null;
  const matchingReservation = ownReservations?.results.find(
    (reservation) =>
      reservation.resource.id === id &&
      sameInstant(reservation.begin, begin) &&
      sameInstant(reservation.end, end) &&
      ["requested", "confirmed"].includes(reservation.state),
  );

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <p>{localized(resource.unit.name, locale)}</p>
        <h1 id="page-title">{t(messages, "booking.formTitle")}</h1>
      </section>
      {matchingReservation ? (
        <section className="card" aria-labelledby="reservation-success-title">
          <h2 id="reservation-success-title">{t(messages, "booking.successTitle")}</h2>
          <p>
            {localized(matchingReservation.resource.name, locale)},{" "}
            {new Date(matchingReservation.begin).toLocaleString(locale)}-
            {new Date(matchingReservation.end).toLocaleTimeString(locale)}
          </p>
          <ReservationAnswers answers={matchingReservation.formAnswers} messages={messages} />
          <Link className="button" href={`/${locale}/reservations`}>
            {t(messages, "booking.viewReservation")}
          </Link>
        </section>
      ) : begin && end && selectedSlot ? (
        <ReservationDetailsForm
          action={createReservationAction}
          begin={begin}
          end={end}
          locale={locale}
          messages={messages}
          profileEmail={me.email}
          profileName={me.name}
          resource={resource}
        />
      ) : (
        <section className="card" aria-labelledby="slot-error-title">
          <h2 id="slot-error-title">{t(messages, "booking.staleSlotTitle")}</h2>
          <p>{t(messages, "booking.staleSlot")}</p>
          <Link className="button" href={`/${locale}/resources/${id}${date ? `?date=${date}` : ""}`}>
            {t(messages, "booking.backToResource")}
          </Link>
        </section>
      )}
    </>
  );
}
