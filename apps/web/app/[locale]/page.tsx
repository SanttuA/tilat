import Link from "next/link";

import { listResources } from "@/lib/api";
import { getMessages, isLocale, localized, type Locale, t } from "@/lib/i18n";

export default async function ResourceListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  const { search } = await searchParams;
  const resources = await listResources(search);

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "app.name")}</h1>
      </section>
      <form className="search-form" role="search">
        <label>
          {t(messages, "resources.searchLabel")}
          <input
            defaultValue={search}
            name="search"
            placeholder={t(messages, "resources.searchPlaceholder")}
            type="search"
          />
        </label>
        <button className="button" type="submit">
          {t(messages, "resources.searchButton")}
        </button>
      </form>
      <section aria-labelledby="results-title">
        <h2 id="results-title">{t(messages, "resources.results")}</h2>
        {resources.results.length === 0 ? <p>{t(messages, "resources.empty")}</p> : null}
        <div className="resource-grid">
          {resources.results.map((resource) => (
            <article className="card resource-card" key={resource.id}>
              <h3>{localized(resource.name, locale)}</h3>
              <p className="resource-description">{localized(resource.description, locale)}</p>
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
              <Link className="button" href={`/${locale}/resources/${resource.id}`}>
                {t(messages, "resources.details")}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
