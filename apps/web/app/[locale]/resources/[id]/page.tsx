import Link from "next/link";

import { BookingForm } from "@/components/BookingForm";
import { createReservationAction } from "@/app/[locale]/actions";
import { getAvailability, getResource } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";
import { hasValidSession } from "@/lib/session";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const { date = todayIso() } = await searchParams;
  const resource = await getResource(id);
  const availability = await getAvailability(id, date);
  const accessToken = await getAccessToken();
  const canBook = await hasValidSession(accessToken);

  return (
    <>
      <section className="hero" aria-labelledby="resource-title">
        <p>{localized(resource.unit.name, locale)}</p>
        <h1 id="resource-title">{localized(resource.name, locale)}</h1>
        <p>{localized(resource.description, locale)}</p>
        <div className="meta">
          <span className="pill">
            {t(messages, "resources.capacity")}: {resource.capacity}
          </span>
          <span className={`pill ${resource.requiresApproval ? "warning" : ""}`}>
            {resource.requiresApproval
              ? t(messages, "resources.requiresApproval")
              : t(messages, "resources.instant")}
          </span>
        </div>
      </section>
      <section className="card" aria-labelledby="availability-title">
        <h2 id="availability-title">{t(messages, "resource.availability")}</h2>
        <form className="search-form">
          <label>
            {t(messages, "common.date")}
            <input name="date" type="date" defaultValue={date} />
          </label>
          <button className="secondary-button" type="submit">
            {t(messages, "resources.searchButton")}
          </button>
        </form>
      </section>
      {canBook ? (
        <BookingForm
          action={createReservationAction}
          availability={availability}
          locale={locale}
          messages={messages}
          resource={resource}
        />
      ) : (
        <section className="card" aria-labelledby="signin-title">
          <h2 id="signin-title">{t(messages, "auth.requiredTitle")}</h2>
          <p>{t(messages, "auth.required")}</p>
          <Link className="button" href={`/${locale}/sign-in?next=/${locale}/resources/${id}`}>
            {t(messages, "nav.signIn")}
          </Link>
        </section>
      )}
    </>
  );
}
