import { StatusBadge } from "@/components/StatusBadge";
import { cancelOwnReservationAction } from "@/app/[locale]/actions";
import { listOwnReservations } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const reservations = await listOwnReservations(await getAccessToken());

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "reservations.title")}</h1>
      </section>
      {reservations.results.length === 0 ? <p>{t(messages, "reservations.empty")}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{t(messages, "resources.title")}</th>
              <th scope="col">{t(messages, "common.time")}</th>
              <th scope="col">{t(messages, "common.status")}</th>
              <th scope="col">{t(messages, "common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {reservations.results.map((reservation) => (
              <tr key={reservation.id}>
                <td>{localized(reservation.resource.name, locale)}</td>
                <td>
                  {new Date(reservation.begin).toLocaleString(locale)}-
                  {new Date(reservation.end).toLocaleTimeString(locale)}
                </td>
                <td>
                  <StatusBadge messages={messages} state={reservation.state} />
                </td>
                <td>
                  <form action={cancelOwnReservationAction}>
                    <input name="locale" type="hidden" value={locale} />
                    <input name="reservationId" type="hidden" value={reservation.id} />
                    <button
                      className="secondary-button"
                      disabled={reservation.state === "cancelled"}
                      type="submit"
                    >
                      {t(messages, "reservations.cancel")}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
