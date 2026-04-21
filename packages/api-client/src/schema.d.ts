/**
 * Generated from specs/api/openapi.yaml.
 * Re-run `pnpm generate:api-client` after API contract changes.
 */
export interface paths {
  "/resources": {
    get: {
      parameters: { query?: { search?: string; page?: number } };
      responses: {
        200: { content: { "application/json": components["schemas"]["ResourcePage"] } };
      };
    };
  };
  "/resources/{id}": {
    get: {
      parameters: { path: { id: string } };
      responses: { 200: { content: { "application/json": components["schemas"]["Resource"] } } };
    };
  };
  "/resources/{id}/availability": {
    get: {
      parameters: { path: { id: string }; query: { date: string } };
      responses: {
        200: { content: { "application/json": components["schemas"]["Availability"] } };
      };
    };
  };
  "/me": {
    get: {
      responses: { 200: { content: { "application/json": components["schemas"]["Me"] } } };
    };
  };
  "/reservations": {
    get: {
      responses: {
        200: { content: { "application/json": components["schemas"]["ReservationPage"] } };
      };
    };
    post: {
      requestBody: { content: { "application/json": components["schemas"]["ReservationCreate"] } };
      responses: { 201: { content: { "application/json": components["schemas"]["Reservation"] } } };
    };
  };
  "/reservations/{id}/cancel": {
    post: {
      parameters: { path: { id: string } };
      responses: { 200: { content: { "application/json": components["schemas"]["Reservation"] } } };
    };
  };
  "/staff/units": {
    get: {
      responses: { 200: { content: { "application/json": components["schemas"]["Unit"][] } } };
    };
  };
  "/staff/reservations": {
    get: {
      parameters: { query?: { unit?: string } };
      responses: {
        200: { content: { "application/json": components["schemas"]["ReservationPage"] } };
      };
    };
  };
  "/staff/reservations/{id}/approve": {
    post: {
      parameters: { path: { id: string } };
      responses: { 200: { content: { "application/json": components["schemas"]["Reservation"] } } };
    };
  };
  "/staff/reservations/{id}/deny": {
    post: {
      parameters: { path: { id: string } };
      responses: { 200: { content: { "application/json": components["schemas"]["Reservation"] } } };
    };
  };
  "/staff/reservations/{id}/cancel": {
    post: {
      parameters: { path: { id: string } };
      responses: { 200: { content: { "application/json": components["schemas"]["Reservation"] } } };
    };
  };
  "/staff/resources": {
    post: {
      requestBody: { content: { "application/json": components["schemas"]["ResourceWrite"] } };
      responses: { 201: { content: { "application/json": components["schemas"]["Resource"] } } };
    };
  };
  "/staff/resources/{id}": {
    patch: {
      parameters: { path: { id: string } };
      requestBody: { content: { "application/json": components["schemas"]["ResourceWrite"] } };
      responses: { 200: { content: { "application/json": components["schemas"]["Resource"] } } };
    };
  };
  "/staff/memberships": {
    get: {
      parameters: { query?: { unit?: string } };
      responses: {
        200: { content: { "application/json": components["schemas"]["UnitStaffMembership"][] } };
      };
    };
    post: {
      requestBody: {
        content: { "application/json": components["schemas"]["UnitStaffMembershipWrite"] };
      };
      responses: {
        201: { content: { "application/json": components["schemas"]["UnitStaffMembership"] } };
      };
    };
  };
  "/staff/memberships/{id}": {
    delete: {
      parameters: { path: { id: string } };
      responses: { 204: never };
    };
  };
}

export interface components {
  schemas: {
    LocalizedText: { fi: string; en: string };
    Error: { detail: string; fields?: Record<string, string[]> };
    Unit: {
      id: string;
      name: components["schemas"]["LocalizedText"];
      address: components["schemas"]["LocalizedText"];
      createdAt: string;
      updatedAt: string;
    };
    Resource: {
      id: string;
      unit: components["schemas"]["Unit"];
      name: components["schemas"]["LocalizedText"];
      description: components["schemas"]["LocalizedText"];
      reservationInstructions?: components["schemas"]["LocalizedText"];
      capacity: number;
      slotMinutes: 15 | 30 | 45 | 60 | 90 | 120;
      requiresApproval: boolean;
      createdAt: string;
      updatedAt: string;
    };
    ResourceWrite: {
      unitId: string;
      name: components["schemas"]["LocalizedText"];
      description?: components["schemas"]["LocalizedText"];
      reservationInstructions?: components["schemas"]["LocalizedText"];
      capacity: number;
      slotMinutes: number;
      requiresApproval: boolean;
    };
    ResourcePage: { count: number; results: components["schemas"]["Resource"][] };
    AvailabilitySlot: { start: string; end: string; available: boolean };
    Availability: {
      resourceId: string;
      date: string;
      slots: components["schemas"]["AvailabilitySlot"][];
    };
    ReservationState: "requested" | "confirmed" | "denied" | "cancelled";
    UserProfile: {
      id: string;
      subject: string;
      email: string;
      name: string;
      isAdmin: boolean;
    };
    Me: components["schemas"]["UserProfile"] & { staffUnitIds: string[] };
    Reservation: {
      id: string;
      resource: components["schemas"]["Resource"];
      user: components["schemas"]["UserProfile"];
      begin: string;
      end: string;
      state: components["schemas"]["ReservationState"];
      note?: string;
      createdAt: string;
      updatedAt: string;
    };
    ReservationCreate: { resourceId: string; begin: string; end: string; note?: string };
    ReservationPage: { count: number; results: components["schemas"]["Reservation"][] };
    UnitStaffMembership: {
      id: string;
      unit: components["schemas"]["Unit"];
      user: components["schemas"]["UserProfile"];
      createdAt: string;
    };
    UnitStaffMembershipWrite: { unitId: string; userId: string };
  };
}
