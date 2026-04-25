import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const resourceId = "22222222-2222-4222-8222-222222222222";
const authCopy = {
  en: {
    email: "Email address",
    password: "Password",
    signIn: "Sign in",
  },
  fi: {
    email: "Sähköpostiosoite",
    password: "Salasana",
    signIn: "Kirjaudu",
  },
} as const;
const reservationFormTitles = {
  en: "Reservation details",
  fi: "Varauksen tiedot",
} as const;

const routes = [
  "/fi",
  "/en",
  "/fi/sign-in",
  "/en/sign-in",
  "/fi/sign-up",
  "/en/sign-up",
  "/fi/staff",
  "/en/staff",
  "/fi/admin",
  "/en/admin",
];

for (const route of routes) {
  test(`has no detectable WCAG violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("supports keyboard navigation through the public booking flow", async ({ page }) => {
  await page.goto("/en");
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

for (const locale of ["en", "fi"] as const) {
  test(`reservation form page has no detectable WCAG violations in ${locale}`, async ({ page }) => {
    await signInAsStaff(page, locale);
    await page.goto(
      `/${locale}/resources/${resourceId}/reserve?slot=${encodeURIComponent(
        "2026-04-24T09:00:00Z|2026-04-24T10:00:00Z",
      )}`,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: reservationFormTitles[locale] }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

async function signInAsStaff(page: Page, locale: keyof typeof authCopy) {
  const messages = authCopy[locale];
  await page.goto(`/${locale}/sign-in`);
  await page.getByLabel(messages.email).fill("staff@example.com");
  await page.getByLabel(messages.password).fill("Local-demo-12345");
  await page.getByRole("button", { name: messages.signIn }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/reservations$`));
}
