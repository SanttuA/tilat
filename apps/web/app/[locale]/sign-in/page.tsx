import { signInAction } from "@/app/[locale]/actions";
import { AuthForm } from "@/components/AuthForm";
import { getMessages, isLocale, type Locale, t } from "@/lib/i18n";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const { next } = await searchParams;
  const messages = getMessages(locale);

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "auth.signInTitle")}</h1>
      </section>
      <AuthForm
        action={signInAction}
        locale={locale}
        messages={messages}
        mode="sign-in"
        next={next}
      />
    </>
  );
}
