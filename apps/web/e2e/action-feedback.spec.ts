import { expect, type Page, test } from "@playwright/test";

const resourceId = "22222222-2222-4222-8222-222222222222";

const copy = {
  en: {
    approve: "Approve",
    approveSuccess: "Reservation approved.",
    bookingSuccess: "Reservation submitted.",
    continue: "Continue to reservation form",
    submit: "Submit reservation",
  },
  fi: {
    approve: "Hyväksy",
    approveSuccess: "Varaus hyväksyttiin.",
    bookingSuccess: "Varaus lähetettiin.",
    continue: "Jatka varauslomakkeelle",
    submit: "Lähetä varaus",
  },
} as const;

async function authenticateAsStaff(page: Page) {
  await page.context().addCookies([
    {
      name: "reservation_access_token",
      value: "staff-token",
      url: "http://127.0.0.1:3000",
    },
  ]);
}

for (const locale of ["en", "fi"] as const) {
  test(`announces booking feedback in ${locale}`, async ({ page }) => {
    const messages = copy[locale];

    await authenticateAsStaff(page);
    await page.goto(`/${locale}/resources/${resourceId}`);
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: messages.continue }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/resources/${resourceId}/reserve`));
    await page.getByRole("button", { name: messages.submit }).click();

    await expect(page.getByRole("status")).toContainText(messages.bookingSuccess);
    await expect(
      page.getByRole("button", { name: new RegExp(messages.bookingSuccess) }),
    ).toBeVisible();
  });

  test(`announces staff reservation feedback in ${locale}`, async ({ page }) => {
    const messages = copy[locale];

    await authenticateAsStaff(page);
    await page.goto(`/${locale}/staff`);
    await page.getByRole("button", { name: messages.approve }).press("Enter");

    await expect(page.getByRole("status")).toContainText(messages.approveSuccess);
    await expect(
      page.getByRole("button", { name: new RegExp(messages.approveSuccess) }),
    ).toBeVisible();
  });
}
