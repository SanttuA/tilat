import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthForm } from "./AuthForm";
import en from "../messages/en.json";
import fi from "../messages/fi.json";

async function noopAction() {
  return { status: "idle" as const, message: "" };
}

describe("AuthForm", () => {
  it("renders accessible sign-in controls", () => {
    render(<AuthForm action={noopAction} locale="en" messages={en} mode="sign-in" />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("renders accessible sign-up controls in Finnish", () => {
    render(<AuthForm action={noopAction} locale="fi" messages={fi} mode="sign-up" />);

    expect(screen.getByRole("button", { name: "Rekisteröidy" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sähköpostiosoite")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Nimi")).toBeInTheDocument();
    expect(screen.getByLabelText("Salasana")).toHaveAttribute("type", "password");
  });
});
