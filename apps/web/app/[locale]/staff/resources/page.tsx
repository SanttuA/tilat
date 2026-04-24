import { redirect } from "next/navigation";

import { createStaffResourceAction } from "@/app/[locale]/actions";
import { ActionFeedbackForm, SubmitButton } from "@/components/ActionFeedbackForm";
import { getAccessToken } from "@/lib/auth";
import { getMe, listResources, listStaffUnits } from "@/lib/api";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";
import { canUseStaff } from "@/lib/permissions";

export default async function StaffResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const token = await getAccessToken();
  if (!token) {
    redirect(`/${locale}/sign-in?next=/${locale}/staff/resources`);
  }
  const me = await getMe(token);
  if (!me) {
    redirect(`/${locale}/sign-in?next=/${locale}/staff/resources`);
  }
  if (!canUseStaff(me)) {
    return (
      <>
        <section className="hero" aria-labelledby="page-title">
          <h1 id="page-title">{t(messages, "staff.resources")}</h1>
        </section>
        <section className="card" aria-labelledby="unauthorized-title">
          <h2 id="unauthorized-title">{t(messages, "auth.unauthorizedTitle")}</h2>
          <p>{t(messages, "auth.staffUnauthorized")}</p>
        </section>
      </>
    );
  }
  const [units, resources] = await Promise.all([listStaffUnits(token), listResources()]);

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "staff.resources")}</h1>
      </section>
      <ActionFeedbackForm
        action={createStaffResourceAction}
        className="card"
        aria-labelledby="resource-form-title"
      >
        <input name="locale" type="hidden" value={locale} />
        <h2 id="resource-form-title">{t(messages, "staff.save")}</h2>
        <div className="form-grid">
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
            {t(messages, "resources.capacity")}
            <input min="1" name="capacity" required type="number" />
          </label>
          <label>
            {t(messages, "resource.slotMinutes")}
            <select defaultValue="30" name="slotMinutes" required>
              {[15, 30, 45, 60, 90, 120].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t(messages, "staff.resourceNameFi")}
          <input lang="fi" name="nameFi" required />
        </label>
        <label>
          {t(messages, "staff.resourceNameEn")}
          <input lang="en" name="nameEn" required />
        </label>
        <label className="checkbox-row">
          <input name="requiresApproval" type="checkbox" />
          {t(messages, "resources.requiresApproval")}
        </label>
        <SubmitButton
          className="button"
          disabled={units.length === 0}
          pendingLabel={t(messages, "staff.resourceSavePending")}
          type="submit"
        >
          {t(messages, "staff.save")}
        </SubmitButton>
      </ActionFeedbackForm>
      <section aria-labelledby="resources-title">
        <h2 id="resources-title">{t(messages, "staff.resources")}</h2>
        <div className="resource-grid">
          {resources.results.map((resource) => (
            <article className="card" key={resource.id}>
              <h3>{localized(resource.name, locale)}</h3>
              <p>{localized(resource.unit.name, locale)}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
