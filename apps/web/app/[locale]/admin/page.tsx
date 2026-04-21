import { getAccessToken } from "@/lib/auth";
import { getMe, listStaffUnits } from "@/lib/api";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const token = await getAccessToken();
  const [me, units] = await Promise.all([getMe(token), listStaffUnits(token)]);

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
