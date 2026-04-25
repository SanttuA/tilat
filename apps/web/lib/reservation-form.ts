import type { components } from "@reservation/api-client";

import type { MessageKey } from "@/lib/i18n";

export type ReservationFormFieldKey = components["schemas"]["ReservationFormFieldKey"];
export type ReservationForm = components["schemas"]["ReservationForm"];
export type ReservationFormAnswers = components["schemas"]["ReservationFormAnswers"];

export const reservationFormFieldKeys: ReservationFormFieldKey[] = [
  "name",
  "phoneNumber",
  "email",
  "address",
  "additionalInfo",
];

export const defaultReservationForm: ReservationForm = {
  fields: [
    { key: "name", required: true },
    { key: "email", required: true },
  ],
};

export const reservationFormFieldLabels: Record<ReservationFormFieldKey, MessageKey> = {
  name: "reservationForm.fields.name",
  phoneNumber: "reservationForm.fields.phoneNumber",
  email: "reservationForm.fields.email",
  address: "reservationForm.fields.address",
  additionalInfo: "reservationForm.fields.additionalInfo",
};

export const reservationFormAutocomplete: Record<ReservationFormFieldKey, string> = {
  name: "name",
  phoneNumber: "tel",
  email: "email",
  address: "street-address",
  additionalInfo: "off",
};

export const reservationFormInputTypes: Record<ReservationFormFieldKey, "email" | "tel" | "text"> = {
  name: "text",
  phoneNumber: "tel",
  email: "email",
  address: "text",
  additionalInfo: "text",
};
