import { redirect } from "next/navigation";

import { createStaffMembershipAction, deleteStaffMembershipAction } from "@/app/[locale]/actions";
import { ActionFeedbackForm, SubmitButton } from "@/components/ActionFeedbackForm";
import { getAccessToken } from "@/lib/auth";
import { getMe, listStaffMemberships, listStaffUnits } from "@/lib/api";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";
import { canUseStaff } from "@/lib/permissions";

export default async function StaffMembershipsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const token = await getAccessToken();
  if (!token) {
    redirect(`/${locale}/sign-in?next=/${locale}/staff/memberships`);
  }
  const me = await getMe(token);
  if (!me) {
    redirect(`/${locale}/sign-in?next=/${locale}/staff/memberships`);
  }
  if (!canUseStaff(me)) {
    return (
      <>
        <section className="hero" aria-labelledby="page-title">
          <h1 id="page-title">{t(messages, "staff.memberships")}</h1>
        </section>
        <section className="card" aria-labelledby="unauthorized-title">
          <h2 id="unauthorized-title">{t(messages, "auth.unauthorizedTitle")}</h2>
          <p>{t(messages, "auth.staffUnauthorized")}</p>
        </section>
      </>
    );
  }
  const [units, memberships] = await Promise.all([
    listStaffUnits(token),
    listStaffMemberships(token),
  ]);

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "staff.memberships")}</h1>
      </section>
      <ActionFeedbackForm action={createStaffMembershipAction} className="card">
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
        <SubmitButton
          className="button"
          disabled={units.length === 0}
          pendingLabel={t(messages, "staff.addMemberPending")}
          type="submit"
        >
          {t(messages, "staff.addMember")}
        </SubmitButton>
      </ActionFeedbackForm>
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
                    <ActionFeedbackForm action={deleteStaffMembershipAction}>
                      <input name="locale" type="hidden" value={locale} />
                      <input name="membershipId" type="hidden" value={membership.id} />
                      <SubmitButton
                        className="secondary-button"
                        pendingLabel={t(messages, "staff.removeMemberPending")}
                        type="submit"
                      >
                        {t(messages, "staff.remove")}
                      </SubmitButton>
                    </ActionFeedbackForm>
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
