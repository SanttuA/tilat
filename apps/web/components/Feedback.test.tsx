import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import en from "../messages/en.json";
import { FeedbackProvider, SUCCESS_TOAST_TIMEOUT_MS, useFeedback } from "./Feedback";

function FeedbackTrigger({ message, status }: { message: string; status: "success" | "error" }) {
  const { notify } = useFeedback();

  return (
    <button onClick={() => notify({ message, status })} type="button">
      Notify
    </button>
  );
}

function renderFeedback(status: "success" | "error", message: string) {
  render(
    <FeedbackProvider messages={en}>
      <FeedbackTrigger message={message} status={status} />
    </FeedbackProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Notify" }));
}

describe("FeedbackProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders success toasts as polite status messages with a dismiss button", () => {
    renderFeedback("success", "Reservation submitted.");

    expect(screen.getByRole("status")).toHaveTextContent("Success");
    expect(screen.getByRole("status")).toHaveTextContent("Reservation submitted.");
    expect(
      screen.getByRole("button", { name: "Dismiss: Reservation submitted." }),
    ).toBeInTheDocument();
  });

  it("auto-dismisses success toasts after the accessible display period", () => {
    vi.useFakeTimers();
    renderFeedback("success", "Reservation submitted.");

    act(() => {
      vi.advanceTimersByTime(SUCCESS_TOAST_TIMEOUT_MS);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("pauses success auto-dismiss while the toast is hovered", () => {
    vi.useFakeTimers();
    renderFeedback("success", "Reservation submitted.");

    fireEvent.mouseEnter(screen.getByRole("status"));
    act(() => {
      vi.advanceTimersByTime(SUCCESS_TOAST_TIMEOUT_MS);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole("status"));
    act(() => {
      vi.advanceTimersByTime(SUCCESS_TOAST_TIMEOUT_MS);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps error toasts visible until dismissed", () => {
    vi.useFakeTimers();
    renderFeedback("error", "Reservation could not be cancelled.");

    act(() => {
      vi.advanceTimersByTime(SUCCESS_TOAST_TIMEOUT_MS * 2);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Reservation could not be cancelled.");

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss: Reservation could not be cancelled." }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
