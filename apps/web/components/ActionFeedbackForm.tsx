"use client";

import { useActionState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { useActionFeedback } from "@/components/Feedback";
import { initialFormState, type FormState } from "@/lib/form-state";

type FeedbackAction = (state: FormState, formData: FormData) => Promise<FormState>;

type ActionFeedbackFormProps = Omit<ComponentProps<"form">, "action" | "children"> & {
  action: FeedbackAction;
  children: ReactNode;
};

export function ActionFeedbackForm({ action, children, ...props }: ActionFeedbackFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  useActionFeedback(state);

  return (
    <form {...props} action={formAction} aria-busy={pending || undefined}>
      {children}
    </form>
  );
}

type SubmitButtonProps = ComponentProps<"button"> & {
  pendingLabel: string;
};

export function SubmitButton({
  children,
  disabled,
  name,
  pendingLabel,
  type = "submit",
  value,
  ...props
}: SubmitButtonProps) {
  const { data, pending } = useFormStatus();
  const isSubmittedButton = isCurrentSubmit(data, name, value);

  return (
    <button
      {...props}
      disabled={Boolean(disabled) || pending}
      name={name}
      type={type}
      value={value}
    >
      {pending && isSubmittedButton ? pendingLabel : children}
    </button>
  );
}

function isCurrentSubmit(
  formData: FormData | null,
  name: string | undefined,
  value: string | number | readonly string[] | undefined,
) {
  if (!formData || !name) return true;
  if (value === undefined) return true;
  return formData.get(name) === String(value);
}
