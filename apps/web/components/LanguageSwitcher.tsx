"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { equivalentLocalePath, localeNames, locales, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const href = (path: string) => path as Parameters<typeof Link>[0]["href"];

  return (
    <nav aria-label="Language">
      <div className="nav">
        {locales.map((nextLocale) => (
          <Link
            aria-current={nextLocale === locale ? "page" : undefined}
            href={href(equivalentLocalePath(pathname, nextLocale))}
            hrefLang={nextLocale}
            key={nextLocale}
            lang={nextLocale}
          >
            {localeNames[nextLocale]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
