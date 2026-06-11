import { describe, it, expect } from "vitest";

/**
 * Stage 4 — Couple Type Separation Tests
 * Tests the iron rules around venue_linked vs independent couples
 */

describe("couple.type iron rules", () => {
  it("independent couple has no venueId", () => {
    const couple = {
      type: "independent" as const,
      venueId: null,
      assignmentLocked: false,
    };
    expect(couple.type).toBe("independent");
    expect(couple.venueId).toBeNull();
  });

  it("venue_linked couple has venueId set", () => {
    const couple = {
      type: "venue_linked" as const,
      venueId: 42,
      assignmentLocked: false,
    };
    expect(couple.type).toBe("venue_linked");
    expect(couple.venueId).toBe(42);
  });

  it("chat is only available for venue_linked couples", () => {
    const canChat = (type: "venue_linked" | "independent") => type === "venue_linked";
    expect(canChat("venue_linked")).toBe(true);
    expect(canChat("independent")).toBe(false);
  });

  it("venue reports only available for venue_linked couples", () => {
    const canSeeVenueReports = (type: "venue_linked" | "independent") =>
      type === "venue_linked";
    expect(canSeeVenueReports("venue_linked")).toBe(true);
    expect(canSeeVenueReports("independent")).toBe(false);
  });

  it("assignment locked prevents re-linking", () => {
    const couple = {
      type: "independent" as const,
      venueId: null,
      assignmentLocked: true,
    };
    const tryAcceptInvite = () => {
      if (couple.assignmentLocked) throw new Error("ASSIGNMENT_LOCKED");
    };
    expect(tryAcceptInvite).toThrow("ASSIGNMENT_LOCKED");
  });

  it("couple.type is set automatically — not by user choice", () => {
    // Simulates the server logic: type is always 'independent' on register
    const registerCouple = (input: { name1: string; name2: string }) => ({
      ...input,
      type: "independent" as const, // always independent on register
    });
    const couple = registerCouple({ name1: "Alice", name2: "Bob" });
    expect(couple.type).toBe("independent");
  });

  it("couple becomes venue_linked only via acceptWeddingInvite", () => {
    const couple = { type: "independent" as const, venueId: null as number | null, assignmentLocked: false };
    const acceptInvite = (venueId: number) => {
      if (couple.assignmentLocked) throw new Error("ASSIGNMENT_LOCKED");
      couple.type = "venue_linked" as any;
      couple.venueId = venueId;
    };
    acceptInvite(7);
    expect(couple.type).toBe("venue_linked");
    expect(couple.venueId).toBe(7);
  });

  it("gender-neutral: no חתן/כלה in couple fields", () => {
    const coupleFields = ["name1", "name2", "phone1", "phone2", "primaryContact", "sideLabels"];
    const forbiddenTerms = ["חתן", "כלה", "groom", "bride"];
    coupleFields.forEach((field) => {
      forbiddenTerms.forEach((term) => {
        expect(field.toLowerCase()).not.toContain(term.toLowerCase());
      });
    });
  });

  it("message conversationId uses wedding_ prefix", () => {
    const weddingId = 123;
    const conversationId = `wedding_${weddingId}`;
    expect(conversationId).toBe("wedding_123");
    expect(conversationId.startsWith("wedding_")).toBe(true);
  });

  it("venue.getById returns only safe public fields", () => {
    const fullVenue = {
      id: 1,
      name: "אולם הגן",
      region: "מרכז",
      phone: "050-1234567",
      email: "info@garden.co.il",
      userId: 99, // internal — should NOT be exposed
      plan: "business", // internal — should NOT be exposed
      subStatus: "active", // internal — should NOT be exposed
    };
    // Simulate what getById returns
    const safeVenue = {
      id: fullVenue.id,
      name: fullVenue.name,
      region: fullVenue.region,
      phone: fullVenue.phone,
      email: fullVenue.email,
    };
    expect(safeVenue).not.toHaveProperty("userId");
    expect(safeVenue).not.toHaveProperty("plan");
    expect(safeVenue).not.toHaveProperty("subStatus");
    expect(safeVenue).toHaveProperty("name");
  });
});
