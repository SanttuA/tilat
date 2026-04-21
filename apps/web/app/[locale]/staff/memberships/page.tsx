import { createStaffMembershipAction, deleteStaffMembershipAction } from "@/app/[locale]/actions";
import { getAccessToken } from "@/lib/auth";
import { listStaffMemberships, listStaffUnits } from "@/lib/api";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";

export default async function StaffMembershipsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const token = await getAccessToken();
  const [units, memberships] = await Promise.all([
    listStaffUnits(token),
    listStaffMemberships(token),
  ]);

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "staff.memberships")}</h1>
      </section>
      <form action={createStaffMembershipAction} className="card">
        <input name="locale" type="hidden" value={locale} />
        <h2>{t(messages, "staff.addMember")}</h2>
        <label>
          {t(messages, "staff.unit")}
          <select name="unitId" required>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {localized(unit.name, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t(messages, "staff.userId")}
          <input name="userId" required type="text" />
        </label>
        <button className="button" disabled={units.length === 0} type="submit">
          {t(messages, "staff.addMember")}
        </button>
      </form>
      <section aria-labelledby="memberships-title">
        <h2 id="memberships-title">{t(messages, "staff.memberships")}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">{t(messages, "staff.unit")}</th>
                <th scope="col">{t(messages, "staff.user")}</th>
                <th scope="col">{t(messages, "common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((membership) => (
                <tr key={membership.id}>
                  <td>{localized(membership.unit.name, locale)}</td>
                  <td>{membership.user.email || membership.user.name}</td>
                  <td>
                    <form action={deleteStaffMembershipAction}>
                      <input name="locale" type="hidden" value={locale} />
                      <input name="membershipId" type="hidden" value={membership.id} />
                      <button className="secondary-button" type="submit">
                        {t(messages, "staff.remove")}
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
