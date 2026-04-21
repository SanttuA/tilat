import { getRequestConfig } from "next-intl/server";

import { getMessages, isLocale, type Locale } from "../lib/i18n";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : "fi";

  return {
    locale,
    messages: getMessages(locale),
  };
});
