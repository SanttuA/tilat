import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

import "../globals.css";
import { FeedbackProvider } from "@/components/Feedback";
import { Header } from "@/components/Header";
import { getMessages, isLocale, type Locale, t } from "@/lib/i18n";

export async function generateStaticParams() {
  return [{ locale: "fi" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);
  return {
    title: t(messages, "app.name"),
    description: t(messages, "resources.title"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const messages = getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FeedbackProvider messages={messages}>
            <a className="skip-link" href="#main">
              {t(messages, "app.skip")}
            </a>
            <div className="shell">
              <Header locale={locale} messages={messages} />
              <main className="page" id="main" tabIndex={-1}>
                {children}
              </main>
            </div>
          </FeedbackProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
