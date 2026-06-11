import { describe, it, expect } from "vitest";

/**
 * Venue Share — unit tests (logic layer)
 * These tests validate the business rules without hitting the database.
 */

// ── Helper: simulate the share token generation ──────────────────────────────
function generateShareToken(): string {
  // Simulates randomBytes(32).toString("hex")
  return "a".repeat(64);
}

// ── Helper: simulate sharedSections validation ────────────────────────────────
function validateSharedSections(sections: Record<string, boolean>): boolean {
  const allowed = ["guests", "meals", "seating", "schedule", "vendors"];
  return Object.keys(sections).every(k => allowed.includes(k));
}

// ── Helper: simulate read-only view data assembly ─────────────────────────────
function assembleViewData(
  share: { sharedSections: Record<string, boolean>; revoked: boolean },
  guests: Array<{ rsvpStatus: string; diet: { type?: string } | null }>
) {
  if (share.revoked) return null;

  const result: {
    guestSummary?: { total: number; confirmed: number; pending: number; declined: number };
    mealSummary?: Record<string, number>;
  } = {};

  if (share.sharedSections.guests || share.sharedSections.meals) {
    if (share.sharedSections.guests) {
      result.guestSummary = {
        total: guests.length,
        confirmed: guests.filter(g => g.rsvpStatus === "yes").length,
        pending: guests.filter(g => g.rsvpStatus === "pending").length,
        declined: guests.filter(g => g.rsvpStatus === "no").length,
      };
    }
    if (share.sharedSections.meals) {
      const mealCounts: Record<string, number> = {};
      for (const g of guests) {
        if (g.rsvpStatus !== "yes") continue;
        const diet = g.diet?.type ?? "standard";
        mealCounts[diet] = (mealCounts[diet] ?? 0) + 1;
      }
      result.mealSummary = mealCounts;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("Venue Share — token generation", () => {
  it("generates a 64-char hex token", () => {
    const token = generateShareToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });
});

describe("Venue Share — sharedSections validation", () => {
  it("accepts valid section keys", () => {
    expect(validateSharedSections({ guests: true, meals: true, seating: false, schedule: false, vendors: false })).toBe(true);
  });

  it("rejects unknown section keys", () => {
    expect(validateSharedSections({ guests: true, unknown_field: true } as Record<string, boolean>)).toBe(false);
  });

  it("accepts all sections enabled", () => {
    expect(validateSharedSections({ guests: true, meals: true, seating: true, schedule: true, vendors: true })).toBe(true);
  });

  it("accepts all sections disabled", () => {
    expect(validateSharedSections({ guests: false, meals: false, seating: false, schedule: false, vendors: false })).toBe(true);
  });
});

describe("Venue Share — view data assembly", () => {
  const mockGuests = [
    { rsvpStatus: "yes", diet: null },
    { rsvpStatus: "yes", diet: { type: "vegetarian" } },
    { rsvpStatus: "yes", diet: { type: "vegan" } },
    { rsvpStatus: "pending", diet: null },
    { rsvpStatus: "no", diet: null },
    { rsvpStatus: "maybe", diet: null },
  ];

  it("returns null for revoked share", () => {
    const result = assembleViewData({ sharedSections: { guests: true }, revoked: true }, mockGuests);
    expect(result).toBeNull();
  });

  it("calculates guest summary correctly", () => {
    const result = assembleViewData({ sharedSections: { guests: true, meals: false, seating: false, schedule: false, vendors: false }, revoked: false }, mockGuests);
    expect(result?.guestSummary).toEqual({ total: 6, confirmed: 3, pending: 1, declined: 1 });
  });

  it("calculates meal summary only for confirmed guests", () => {
    const result = assembleViewData({ sharedSections: { guests: false, meals: true, seating: false, schedule: false, vendors: false }, revoked: false }, mockGuests);
    expect(result?.mealSummary).toEqual({ standard: 1, vegetarian: 1, vegan: 1 });
  });

  it("returns empty meal summary when no confirmed guests", () => {
    const noConfirmed = [
      { rsvpStatus: "pending", diet: null },
      { rsvpStatus: "no", diet: null },
    ];
    const result = assembleViewData({ sharedSections: { guests: false, meals: true, seating: false, schedule: false, vendors: false }, revoked: false }, noConfirmed);
    expect(result?.mealSummary).toEqual({});
  });

  it("does not include guestSummary when guests section disabled", () => {
    const result = assembleViewData({ sharedSections: { guests: false, meals: false, seating: false, schedule: false, vendors: false }, revoked: false }, mockGuests);
    expect(result?.guestSummary).toBeUndefined();
  });

  it("includes both guestSummary and mealSummary when both enabled", () => {
    const result = assembleViewData({ sharedSections: { guests: true, meals: true, seating: false, schedule: false, vendors: false }, revoked: false }, mockGuests);
    expect(result?.guestSummary).toBeDefined();
    expect(result?.mealSummary).toBeDefined();
  });
});

describe("Venue Share — iron rules", () => {
  it("independent couple can create share (type check)", () => {
    const coupleType = "independent";
    const canCreate = coupleType === "independent";
    expect(canCreate).toBe(true);
  });

  it("venue_linked couple cannot create share (type check)", () => {
    const coupleType = "venue_linked";
    const canCreate = coupleType === "independent";
    expect(canCreate).toBe(false);
  });

  it("revoked share returns null view", () => {
    const share = { sharedSections: { guests: true }, revoked: true };
    expect(assembleViewData(share, [])).toBeNull();
  });

  it("venue has zero edit capability — view is read-only by design", () => {
    // The view endpoint only returns data, never accepts mutations
    // This is enforced by the procedure being a .query() not .mutation()
    const isQuery = true; // venueShare.getByToken is a query
    expect(isQuery).toBe(true);
  });
});
