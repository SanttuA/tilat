import Link from "next/link";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { type Locale, type Messages, t } from "@/lib/i18n";

export function Header({ locale, messages }: { locale: Locale; messages: Messages }) {
  const prefix = `/${locale}`;
  const href = (path: string) => path as Parameters<typeof Link>[0]["href"];

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href={href(prefix)}>
          {t(messages, "app.name")}
        </Link>
        <nav aria-label="Primary">
          <div className="nav">
            <Link href={href(prefix)}>{t(messages, "nav.home")}</Link>
            <Link href={href(`${prefix}/reservations`)}>{t(messages, "nav.reservations")}</Link>
            <Link href={href(`${prefix}/staff`)}>{t(messages, "nav.staff")}</Link>
            <Link href={href(`${prefix}/admin`)}>{t(messages, "nav.admin")}</Link>
            <a href="/api/auth/signin">{t(messages, "nav.signIn")}</a>
            <a href="/api/auth/signout">{t(messages, "nav.signOut")}</a>
          </div>
        </nav>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
