import { expect, type Locator, type Page, test } from "@playwright/test";

const copy = {
  en: {
    details: "Details",
    email: "Email address",
    languageNav: "Language",
    password: "Password",
    primaryNav: "Primary navigation",
    searchButton: "Search",
    searchLabel: "Search resources",
    signIn: "Sign in",
  },
  fi: {
    details: "Tiedot",
    email: "Sähköpostiosoite",
    languageNav: "Kieli",
    password: "Salasana",
    primaryNav: "Päävalikko",
    searchButton: "Hae",
    searchLabel: "Hae tiloja",
    signIn: "Kirjaudu",
  },
} as const;

const viewports = [
  { name: "narrow", width: 320, height: 900 },
  { name: "small", width: 640, height: 900 },
  { name: "tablet", width: 900, height: 900 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

for (const locale of ["en", "fi"] as const) {
  for (const signedIn of [false, true] as const) {
    test(`public resource page layout stays contained in ${locale} ${
      signedIn ? "authenticated" : "anonymous"
    } state`, async ({ page }) => {
      const messages = copy[locale];
      if (signedIn) {
        await signInAsStaff(page, locale);
      } else {
        await page.context().clearCookies();
      }

      for (const viewport of viewports) {
        await page.setViewportSize({ height: viewport.height, width: viewport.width });
        await page.goto(`/${locale}`);

        const context = `${locale} ${signedIn ? "authenticated" : "anonymous"} ${viewport.name}`;
        const cards = page.locator(".resource-card");
        await expect(page.getByRole("heading", { level: 1, name: "Tilat" })).toBeVisible();
        await expect(cards.first()).toBeVisible();
        await expectNoHorizontalOverflow(page, context);

        const primaryNav = page.getByRole("navigation", { name: messages.primaryNav });
        const languageNav = page.getByRole("navigation", { name: messages.languageNav });
        await expect(primaryNav).toBeVisible();
        await expect(languageNav).toBeVisible();
        await expectWithinViewport(page, page.locator(".topbar a, .topbar button"), context);
        await expectWithinViewport(page, languageNav.getByRole("link"), context);
        await expectWithinViewport(
          page,
          page.getByRole("searchbox", { name: messages.searchLabel }),
          context,
        );
        await expectWithinViewport(
          page,
          page.getByRole("button", { name: messages.searchButton }),
          context,
        );
        for (let index = 0; index < (await cards.count()); index += 1) {
          const card = cards.nth(index);
          await expectWithinParent(card, card.locator("h3"), context);
          await expectWithinParent(card, card.locator(".resource-description"), context);
          await expectWithinParent(card, card.locator(".pill"), context);
          await expectWithinParent(
            card,
            card.getByRole("link", { name: messages.details }),
            context,
          );
          await expectCardRowsDoNotOverlap(card, context);
        }
      }
    });
  }
}

async function signInAsStaff(page: Page, locale: keyof typeof copy) {
  const messages = copy[locale];
  await page.goto(`/${locale}/sign-in`);
  await page.getByLabel(messages.email).fill("staff@example.com");
  await page.getByLabel(messages.password).fill("Local-demo-12345");
  await page.getByRole("button", { name: messages.signIn }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/reservations$`));
}

async function expectNoHorizontalOverflow(page: Page, context: string) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    dimensions.scrollWidth,
    `${context}: document should not overflow horizontally`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectWithinViewport(page: Page, locator: Locator, context: string) {
  const viewport = page.viewportSize();
  expect(viewport, `${context}: viewport should be available`).not.toBeNull();
  const width = viewport?.width ?? 0;
  const count = await locator.count();

  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (!(await item.isVisible())) continue;
    const box = await item.boundingBox();
    expect(box, `${context}: visible element ${index} should have bounds`).not.toBeNull();
    if (!box) continue;
    expect(box.x, `${context}: element ${index} should not escape left`).toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `${context}: element ${index} should not escape right`,
    ).toBeLessThanOrEqual(width + 1);
  }
}

async function expectWithinParent(parent: Locator, child: Locator, context: string) {
  const parentBox = await parent.boundingBox();
  expect(parentBox, `${context}: parent should have bounds`).not.toBeNull();
  if (!parentBox) return;

  const count = await child.count();
  for (let index = 0; index < count; index += 1) {
    const item = child.nth(index);
    if (!(await item.isVisible())) continue;
    const childBox = await item.boundingBox();
    expect(childBox, `${context}: child ${index} should have bounds`).not.toBeNull();
    if (!childBox) continue;
    expect(
      childBox.x,
      `${context}: child ${index} should stay inside left edge`,
    ).toBeGreaterThanOrEqual(parentBox.x - 1);
    expect(
      childBox.x + childBox.width,
      `${context}: child ${index} should stay inside right edge`,
    ).toBeLessThanOrEqual(parentBox.x + parentBox.width + 1);
    expect(
      childBox.y,
      `${context}: child ${index} should stay inside top edge`,
    ).toBeGreaterThanOrEqual(parentBox.y - 1);
    expect(
      childBox.y + childBox.height,
      `${context}: child ${index} should stay inside bottom edge`,
    ).toBeLessThanOrEqual(parentBox.y + parentBox.height + 1);
  }
}

async function expectCardRowsDoNotOverlap(card: Locator, context: string) {
  const overlaps = await card.evaluate((element) => {
    const selectors = ["h3", ".resource-description", ".meta", ".button"];
    const boxes = selectors
      .map((selector) => element.querySelector(selector)?.getBoundingClientRect())
      .filter((box): box is DOMRect => Boolean(box))
      .map((box) => ({ bottom: box.bottom, top: box.top }));

    return boxes.flatMap((box, index) => {
      const previous = boxes[index - 1];
      return previous && box.top < previous.bottom - 1 ? [`${index - 1}-${index}`] : [];
    });
  });

  expect(overlaps, `${context}: resource card rows should not overlap`).toEqual([]);
}
