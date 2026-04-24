import Link from "next/link";

import { signOutAction } from "@/app/[locale]/actions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getMe } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { type Locale, type Messages, t } from "@/lib/i18n";
import { canUseAdmin, canUseReservations, canUseStaff } from "@/lib/permissions";

export async function Header({ locale, messages }: { locale: Locale; messages: Messages }) {
  const prefix = `/${locale}`;
  const href = (path: string) => path as Parameters<typeof Link>[0]["href"];
  const accessToken = await getAccessToken();
  const me = accessToken ? await getMe(accessToken) : null;

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href={href(prefix)}>
          {t(messages, "app.name")}
        </Link>
        <nav aria-label="Primary">
          <div className="nav">
            <Link href={href(prefix)}>{t(messages, "nav.home")}</Link>
            {canUseReservations(me) ? (
              <Link href={href(`${prefix}/reservations`)}>{t(messages, "nav.reservations")}</Link>
            ) : null}
            {canUseStaff(me) ? (
              <Link href={href(`${prefix}/staff`)}>{t(messages, "nav.staff")}</Link>
            ) : null}
            {canUseAdmin(me) ? (
              <Link href={href(`${prefix}/admin`)}>{t(messages, "nav.admin")}</Link>
            ) : null}
            {canUseReservations(me) ? (
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
