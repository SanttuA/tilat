import Link from "next/link";

import { signOutAction } from "@/app/[locale]/actions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getAccessToken } from "@/lib/auth";
import { type Locale, type Messages, t } from "@/lib/i18n";

export async function Header({ locale, messages }: { locale: Locale; messages: Messages }) {
  const prefix = `/${locale}`;
  const href = (path: string) => path as Parameters<typeof Link>[0]["href"];
  const signedIn = Boolean(await getAccessToken());

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
            {signedIn ? (
              <form action={signOutAction}>
                <input name="locale" type="hidden" value={locale} />
                <button type="submit">{t(messages, "nav.signOut")}</button>
              </form>
            ) : (
              <>
                <Link href={href(`${prefix}/sign-in`)}>{t(messages, "nav.signIn")}</Link>
                <Link href={href(`${prefix}/sign-up`)}>{t(messages, "nav.signUp")}</Link>
              </>
            )}
          </div>
        </nav>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
