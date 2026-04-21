import { describe, expect, it } from "vitest";

import en from "../messages/en.json";
import fi from "../messages/fi.json";
import { equivalentLocalePath, localized } from "../lib/i18n";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "string" ? [path] : leafKeys(child, path);
  });
}

describe("i18n", () => {
  it("keeps Finnish and English message keys aligned", () => {
    expect(leafKeys(en).sort()).toEqual(leafKeys(fi).sort());
  });

  it("uses Finnish fallback for missing localized content", () => {
    expect(localized({ fi: "Suomi", en: "" }, "en")).toBe("Suomi");
  });

  it("switches locale-prefixed routes without losing the page", () => {
    expect(equivalentLocalePath("/fi/resources/123", "en")).toBe("/en/resources/123");
  });
});
