import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { CurrentUser } from "@/lib/permissions";

import en from "../messages/en.json";
import { Header } from "./Header";

vi.mock("@/app/[locale]/actions", () => ({
  signOutAction: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
}));

const getAccessTokenMock = vi.mocked(getAccessToken);
const getMeMock = vi.mocked(getMe);

function currentUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "user-id",
    email: "user@example.com",
    name: "Test User",
    isAdmin: false,
    staffUnitIds: [],
    ...overrides,
  };
}

async function renderHeader() {
  render(await Header({ locale: "en", messages: en }));
}

describe("Header", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("hides protected navigation for anonymous users", async () => {
    getAccessTokenMock.mockResolvedValue(undefined);

    await renderHeader();

    expect(getMeMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "My reservations" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Staff" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
  });

  it("shows reservation navigation for regular users", async () => {
    getAccessTokenMock.mockResolvedValue("regular-token");
    getMeMock.mockResolvedValue(currentUser());

    await renderHeader();

    expect(getMeMock).toHaveBeenCalledWith("regular-token");
    expect(screen.getByRole("link", { name: "My reservations" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Staff" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
  });

  it("shows staff navigation for unit staff", async () => {
    getAccessTokenMock.mockResolvedValue("staff-token");
    getMeMock.mockResolvedValue(currentUser({ staffUnitIds: ["unit-id"] }));

    await renderHeader();

    expect(screen.getByRole("link", { name: "My reservations" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Staff" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("shows staff and admin navigation for admins", async () => {
    getAccessTokenMock.mockResolvedValue("admin-token");
    getMeMock.mockResolvedValue(currentUser({ isAdmin: true }));

    await renderHeader();

    expect(screen.getByRole("link", { name: "My reservations" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Staff" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("treats rejected tokens as anonymous for navigation", async () => {
    getAccessTokenMock.mockResolvedValue("expired-token");
    getMeMock.mockResolvedValue(null);

    await renderHeader();

    expect(getMeMock).toHaveBeenCalledWith("expired-token");
    expect(screen.queryByRole("link", { name: "My reservations" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Staff" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
  });
});
