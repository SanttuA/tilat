import type { components } from "@reservation/api-client";

export const demoUnit: components["schemas"]["Unit"] = {
  id: "11111111-1111-4111-8111-111111111111",
  name: { fi: "Keskustakirjasto", en: "Central Library" },
  address: { fi: "Linnankatu 2, Turku", en: "Linnankatu 2, Turku" },
  createdAt: "2026-04-20T09:00:00Z",
  updatedAt: "2026-04-20T09:00:00Z",
};

export const demoResource: components["schemas"]["Resource"] = {
  id: "22222222-2222-4222-8222-222222222222",
  unit: demoUnit,
  name: { fi: "Kokoushuone A", en: "Meeting room A" },
  description: {
    fi: "Rauhallinen kokoustila kymmenelle hengelle.",
    en: "Quiet meeting room for ten people.",
  },
  reservationInstructions: {
    fi: "Saavu kirjaston palvelupisteelle ennen varausta.",
    en: "Check in at the library service desk before your reservation.",
  },
  capacity: 10,
  slotMinutes: 60,
  requiresApproval: true,
  createdAt: "2026-04-20T09:00:00Z",
  updatedAt: "2026-04-20T09:00:00Z",
};

export const demoResources = [demoResource];

export function demoAvailability(
  resourceId: string,
  date: string,
): components["schemas"]["Availability"] {
  return {
    resourceId,
    date,
    slots: [
      { start: `${date}T06:00:00.000Z`, end: `${date}T07:00:00.000Z`, available: true },
      { start: `${date}T07:00:00.000Z`, end: `${date}T08:00:00.000Z`, available: true },
      { start: `${date}T08:00:00.000Z`, end: `${date}T09:00:00.000Z`, available: false },
    ],
  };
}

export const demoUser: components["schemas"]["Me"] = {
  id: "33333333-3333-4333-8333-333333333333",
  subject: "demo-user",
  email: "user@example.com",
  name: "Demo User",
  isAdmin: false,
  staffUnitIds: [],
};

export const demoStaff: components["schemas"]["Me"] = {
  ...demoUser,
  id: "44444444-4444-4444-8444-444444444444",
  subject: "demo-staff",
  email: "staff@example.com",
  name: "Demo Staff",
  staffUnitIds: [demoUnit.id],
};
