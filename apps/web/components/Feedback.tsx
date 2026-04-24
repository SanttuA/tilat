"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";

import type { FormState } from "@/lib/form-state";
import { t, type Messages } from "@/lib/i18n";

export const SUCCESS_TOAST_TIMEOUT_MS = 8_000;

type FeedbackStatus = Exclude<FormState["status"], "idle">;

type FeedbackToast = {
  id: number;
  status: FeedbackStatus;
  message: string;
};

type FeedbackContextValue = {
  notify: (toast: Omit<FeedbackToast, "id">) => void;
  dismiss: (id: number) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({
  children,
  messages,
}: {
  children: ReactNode;
  messages: Messages;
}) {
  const nextId = useRef(0);
  const [toasts, setToasts] = useState<FeedbackToast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: Omit<FeedbackToast, "id">) => {
    setToasts((current) => [
      ...current,
      {
        ...toast,
        id: (nextId.current += 1),
      },
    ]);
  }, []);

  return (
    <FeedbackContext.Provider value={{ dismiss, notify }}>
      {children}
      <ToastViewport dismiss={dismiss} messages={messages} toasts={toasts} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) {
    throw new Error("useFeedback must be used inside FeedbackProvider");
  }
  return value;
}

export function useActionFeedback(state: FormState) {
  const { notify } = useFeedback();
  const lastSequence = useRef(state.sequence);

  useEffect(() => {
    if (
      state.status === "idle" ||
      state.message === "" ||
      state.sequence === lastSequence.current
    ) {
      return;
    }

    lastSequence.current = state.sequence;
    notify({ status: state.status, message: state.message });
  }, [notify, state.message, state.sequence, state.status]);
}

function ToastViewport({
  dismiss,
  messages,
  toasts,
}: {
  dismiss: (id: number) => void;
  messages: Messages;
  toasts: FeedbackToast[];
}) {
  if (toasts.length === 0) return null;

  return (
    <section className="toast-viewport" aria-label={t(messages, "feedback.region")}>
      {toasts.map((toast) => (
        <ToastItem dismiss={dismiss} key={toast.id} messages={messages} toast={toast} />
      ))}
    </section>
  );
}

function ToastItem({
  dismiss,
  messages,
  toast,
}: {
  dismiss: (id: number) => void;
  messages: Messages;
  toast: FeedbackToast;
}) {
  const [paused, setPaused] = useState(false);
  const isSuccess = toast.status === "success";

  useEffect(() => {
    if (!isSuccess || paused) return;

    const timeout = window.setTimeout(() => {
      dismiss(toast.id);
    }, SUCCESS_TOAST_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [dismiss, isSuccess, paused, toast.id]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setPaused(false);
    }
  }

  const title = isSuccess
    ? t(messages, "feedback.successTitle")
    : t(messages, "feedback.errorTitle");
  const dismissLabel = `${t(messages, "feedback.dismiss")}: ${toast.message}`;

  return (
    <div
      aria-atomic="true"
      aria-live={isSuccess ? "polite" : "assertive"}
      className={`toast toast-${toast.status}`}
      onBlurCapture={handleBlur}
      onFocusCapture={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role={isSuccess ? "status" : "alert"}
    >
      <div className="toast-copy">
        <p className="toast-title">{title}</p>
        <p>{toast.message}</p>
      </div>
      <button
        aria-label={dismissLabel}
        className="toast-dismiss"
        onClick={() => dismiss(toast.id)}
        type="button"
      >
        {t(messages, "feedback.dismiss")}
      </button>
    </div>
  );
}
