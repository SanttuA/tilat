import { createReservationApiClient, type components } from "@reservation/api-client";

import { demoAvailability, demoResource, demoResources } from "./demo-data";

const baseUrl =
  process.env.API_INTERNAL_ORIGIN ?? process.env.API_ORIGIN ?? "http://localhost:8000/api/v1";

function api(accessToken?: string) {
  return createReservationApiClient({ baseUrl, accessToken });
}

export async function listResources(search?: string) {
  try {
    const { data, error } = await api().GET("/resources", { params: { query: { search } } });
    if (error || !data) throw new Error("Resource request failed");
    return data;
  } catch {
    const needle = search?.toLowerCase().trim();
    const results = needle
      ? demoResources.filter(
          (resource) =>
            resource.name.fi.toLowerCase().includes(needle) ||
            resource.name.en.toLowerCase().includes(needle) ||
            resource.description.fi.toLowerCase().includes(needle) ||
            resource.description.en.toLowerCase().includes(needle),
        )
      : demoResources;
    return { count: results.length, results };
  }
}

export async function getResource(id: string) {
  try {
    const { data, error } = await api().GET("/resources/{id}", { params: { path: { id } } });
    if (error || !data) throw new Error("Resource detail request failed");
    return data;
  } catch {
    return demoResource;
  }
}

export async function getAvailability(id: string, date: string) {
  try {
    const { data, error } = await api().GET("/resources/{id}/availability", {
      params: { path: { id }, query: { date } },
    });
    if (error || !data) throw new Error("Availability request failed");
    return data;
  } catch {
    return demoAvailability(id, date);
  }
}

export async function signUp(body: components["schemas"]["SignupRequest"]) {
  return api().POST("/auth/signup", { body });
}

export async function signIn(body: components["schemas"]["SigninRequest"]) {
  return api().POST("/auth/signin", { body });
}

export async function signOut(accessToken: string) {
  return api(accessToken).POST("/auth/signout");
}

export async function getMe(accessToken?: string) {
  if (!accessToken) return null;
  try {
    const { data, error } = await api(accessToken).GET("/me");
    if (error || !data) throw new Error("Me request failed");
    return data;
  } catch {
    return null;
  }
}

export async function listOwnReservations(accessToken?: string) {
  if (!accessToken) return { count: 0, results: [] as components["schemas"]["Reservation"][] };
  try {
    const { data, error } = await api(accessToken).GET("/reservations");
    if (error || !data) throw new Error("Reservation request failed");
    return data;
  } catch {
    return { count: 0, results: [] as components["schemas"]["Reservation"][] };
  }
}

export async function listStaffUnits(accessToken?: string) {
  if (!accessToken) return [];
  try {
    const { data, error } = await api(accessToken).GET("/staff/units");
    if (error || !data) throw new Error("Staff units failed");
    return data;
  } catch {
    return [];
  }
}

export async function listStaffReservations(accessToken?: string) {
  if (!accessToken) return { count: 0, results: [] as components["schemas"]["Reservation"][] };
  try {
    const { data, error } = await api(accessToken).GET("/staff/reservations");
    if (error || !data) throw new Error("Staff reservations failed");
    return data;
  } catch {
    return { count: 0, results: [] as components["schemas"]["Reservation"][] };
  }
}

export async function listStaffMemberships(accessToken?: string) {
  if (!accessToken) return [] as components["schemas"]["UnitStaffMembership"][];
  try {
    const { data, error } = await api(accessToken).GET("/staff/memberships");
    if (error || !data) throw new Error("Staff memberships failed");
    return data;
  } catch {
    return [] as components["schemas"]["UnitStaffMembership"][];
  }
}

export async function createReservation(
  accessToken: string,
  body: components["schemas"]["ReservationCreate"],
) {
  return api(accessToken).POST("/reservations", { body });
}

export async function cancelReservation(accessToken: string, id: string) {
  return api(accessToken).POST("/reservations/{id}/cancel", { params: { path: { id } } });
}

export async function staffReservationAction(
  accessToken: string,
  id: string,
  action: "approve" | "deny" | "cancel",
) {
  const client = api(accessToken);
  if (action === "approve") {
    return client.POST("/staff/reservations/{id}/approve", { params: { path: { id } } });
  }
  if (action === "deny") {
    return client.POST("/staff/reservations/{id}/deny", { params: { path: { id } } });
  }
  return client.POST("/staff/reservations/{id}/cancel", { params: { path: { id } } });
}

export async function createStaffResource(
  accessToken: string,
  body: components["schemas"]["ResourceWrite"],
) {
  return api(accessToken).POST("/staff/resources", { body });
}

export async function createStaffMembership(
  accessToken: string,
  body: components["schemas"]["UnitStaffMembershipWrite"],
) {
  return api(accessToken).POST("/staff/memberships", { body });
}

export async function deleteStaffMembership(accessToken: string, id: string) {
  return api(accessToken).DELETE("/staff/memberships/{id}", { params: { path: { id } } });
}
