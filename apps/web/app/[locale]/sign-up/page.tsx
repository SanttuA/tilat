import { signUpAction } from "@/app/[locale]/actions";
import { AuthForm } from "@/components/AuthForm";
import { getMessages, isLocale, type Locale, t } from "@/lib/i18n";

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fi";
  const messages = getMessages(locale);

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <h1 id="page-title">{t(messages, "auth.signUpTitle")}</h1>
      </section>
      <AuthForm action={signUpAction} locale={locale} messages={messages} mode="sign-up" />
    </>
  );
}
