import { redirect } from "next/navigation";

import { getAccessToken } from "@/lib/auth";
import { getMe, listStaffUnits } from "@/lib/api";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";
import { canUseAdmin } from "@/lib/permissions";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const token = await getAccessToken();
  if (!token) {
    redirect(`/${locale}/sign-in?next=/${locale}/admin`);
  }
  const me = await getMe(token);
  if (!me) {
    redirect(`/${locale}/sign-in?next=/${locale}/admin`);
  }
  if (!canUseAdmin(me)) {
    return (
      <>
        <section className="hero" aria-labelledby="page-title">
          <h1 id="page-title">{t(messages, "admin.title")}</h1>
        </section>
        <section className="card" aria-labelledby="unauthorized-title">
          <h2 id="unauthorized-title">{t(messages, "auth.unauthorizedTitle")}</h2>
          <p>{t(messages, "auth.adminUnauthorized")}</p>
        </section>
      </>
    );
  }
  const units = await listStaffUnits(token);

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "admin.title")}</h1>
        {me ? <p>{me.name}</p> : null}
      </section>
      <section className="card" aria-labelledby="units-title">
        <h2 id="units-title">{t(messages, "staff.units")}</h2>
        <ul>
          {units.map((unit) => (
            <li key={unit.id}>{localized(unit.name, locale)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
