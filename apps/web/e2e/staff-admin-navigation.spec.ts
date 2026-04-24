import { expect, type Page, test } from "@playwright/test";

const password = "Local-demo-12345";

const copy = {
  en: {
    adminTitle: "Admin overview",
    email: "Email address",
    membershipsTitle: "Staff permissions",
    password: "Password",
    resource: "Meeting room A",
    resourcesTitle: "Resources",
    signIn: "Sign in",
    staffTitle: "Staff workspace",
    unit: "Central Library",
  },
  fi: {
    adminTitle: "Ylläpidon yleisnäkymä",
    email: "Sähköpostiosoite",
    membershipsTitle: "Henkilöstöoikeudet",
    password: "Salasana",
    resource: "Kokoushuone A",
    resourcesTitle: "Tilat",
    signIn: "Kirjaudu",
    staffTitle: "Henkilöstön työtila",
    unit: "Keskustakirjasto",
  },
} as const;

type Locale = keyof typeof copy;

async function signInAs(page: Page, locale: Locale, email: string, next: string) {
  const messages = copy[locale];
  await page.goto(`/${locale}/sign-in?next=/${locale}${next}`);
  await page.getByLabel(messages.email).fill(email);
  await page.getByLabel(messages.password).fill(password);
  await page.getByRole("button", { name: messages.signIn }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}${next}$`));
}

for (const locale of ["en", "fi"] as const) {
  test(`staff can navigate protected staff pages in ${locale}`, async ({ page }) => {
    const messages = copy[locale];

    await signInAs(page, locale, "staff@example.com", "/staff");
    await expect(page.getByRole("heading", { level: 1, name: messages.staffTitle })).toBeVisible();
    await expect(page.getByText(messages.unit)).toBeVisible();
    await expect(page.getByText(messages.resource)).toBeVisible();

    await page.goto(`/${locale}/staff/resources`);
    await expect(page.getByRole("heading", { level: 1, name: messages.resourcesTitle })).toBeVisible();
    const resourceCard = page.locator("article", { hasText: messages.resource });
    await expect(resourceCard.getByText(messages.unit)).toBeVisible();
    await expect(resourceCard.getByText(messages.resource)).toBeVisible();

    await page.goto(`/${locale}/staff/memberships`);
    await expect(page.getByRole("heading", { level: 1, name: messages.membershipsTitle })).toBeVisible();
    const membershipRow = page.locator("tbody tr", { hasText: "staff@example.com" });
    await expect(membershipRow.getByText(messages.unit)).toBeVisible();
    await expect(membershipRow.getByText("staff@example.com")).toBeVisible();
  });

  test(`admin can navigate admin and staff pages in ${locale}`, async ({ page }) => {
    const messages = copy[locale];

    await signInAs(page, locale, "admin@example.com", "/admin");
    await expect(page.getByRole("heading", { level: 1, name: messages.adminTitle })).toBeVisible();
    await expect(page.getByText("Demo Admin")).toBeVisible();
    await expect(page.getByText(messages.unit)).toBeVisible();

    await page.goto(`/${locale}/staff`);
    await expect(page.getByRole("heading", { level: 1, name: messages.staffTitle })).toBeVisible();
    await expect(page.getByText(messages.resource)).toBeVisible();
  });
}
