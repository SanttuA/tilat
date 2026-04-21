import { redirect } from "next/navigation";

import { reservationStaffAction } from "@/app/[locale]/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { getAccessToken } from "@/lib/auth";
import { getMe, listStaffReservations, listStaffUnits } from "@/lib/api";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";

export default async function StaffPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const token = await getAccessToken();
  if (!token) {
    redirect(`/${locale}/sign-in?next=/${locale}/staff`);
  }
  const me = await getMe(token);
  if (!me) {
    redirect(`/${locale}/sign-in?next=/${locale}/staff`);
  }
  if (!me.isAdmin && me.staffUnitIds.length === 0) {
    return (
      <>
        <section className="hero" aria-labelledby="page-title">
          <h1 id="page-title">{t(messages, "staff.title")}</h1>
        </section>
        <section className="card" aria-labelledby="unauthorized-title">
          <h2 id="unauthorized-title">{t(messages, "auth.unauthorizedTitle")}</h2>
          <p>{t(messages, "auth.staffUnauthorized")}</p>
        </section>
      </>
    );
  }
  const [units, reservations] = await Promise.all([
    listStaffUnits(token),
    listStaffReservations(token),
  ]);

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "staff.title")}</h1>
      </section>
      <section className="card" aria-labelledby="units-title">
        <h2 id="units-title">{t(messages, "staff.units")}</h2>
        <ul>
          {units.map((unit) => (
            <li key={unit.id}>{localized(unit.name, locale)}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="reservations-title">
        <h2 id="reservations-title">{t(messages, "staff.reservations")}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">{t(messages, "resources.title")}</th>
                <th scope="col">{t(messages, "staff.user")}</th>
                <th scope="col">{t(messages, "common.time")}</th>
                <th scope="col">{t(messages, "common.status")}</th>
                <th scope="col">{t(messages, "common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {reservations.results.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{localized(reservation.resource.name, locale)}</td>
                  <td>{reservation.user.name}</td>
                  <td>{new Date(reservation.begin).toLocaleString(locale)}</td>
                  <td>
                    <StatusBadge messages={messages} state={reservation.state} />
                  </td>
                  <td>
                    <form action={reservationStaffAction} className="actions">
                      <input name="locale" type="hidden" value={locale} />
                      <input name="reservationId" type="hidden" value={reservation.id} />
                      <button className="button" name="action" type="submit" value="approve">
                        {t(messages, "staff.approve")}
                      </button>
                      <button className="secondary-button" name="action" type="submit" value="deny">
                        {t(messages, "staff.deny")}
                      </button>
                      <button
                        className="secondary-button danger"
                        name="action"
                        type="submit"
                        value="cancel"
                      >
                        {t(messages, "staff.cancel")}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
