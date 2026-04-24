export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
  sequence: number;
};

export const initialFormState: FormState = {
  status: "idle",
  message: "",
  sequence: 0,
};

export function nextFormState(
  previousState: FormState | undefined,
  status: Exclude<FormState["status"], "idle">,
  message: string,
): FormState {
  return {
    status,
    message,
    sequence: (previousState?.sequence ?? 0) + 1,
  };
}
