import { describe, it, expect } from "vitest";

describe("Stage 5 — MVP Tools (unit logic tests)", () => {
  // ─── Guest logic ──────────────────────────────────────────────────────────
  describe("Guest RSVP", () => {
    it("counts total guests correctly", () => {
      const guests = [
        { name: "משפחת כהן", count: 3, rsvpStatus: "yes" },
        { name: "דנה לוי", count: 1, rsvpStatus: "no" },
        { name: "יוסי מזרחי", count: 2, rsvpStatus: "pending" },
      ];
      const confirmed = guests.filter(g => g.rsvpStatus === "yes").reduce((s, g) => s + g.count, 0);
      expect(confirmed).toBe(3);
    });

    it("aggregates meal counts for chef report", () => {
      const guests = [
        { rsvpStatus: "yes", count: 2, diet: { type: "regular" } },
        { rsvpStatus: "yes", count: 1, diet: { type: "vegan" } },
        { rsvpStatus: "yes", count: 3, diet: null },
        { rsvpStatus: "no", count: 2, diet: { type: "vegetarian" } },
      ];
      const meals: Record<string, number> = {};
      guests.filter(g => g.rsvpStatus === "yes").forEach(g => {
        const diet = (g.diet as { type?: string } | null)?.type ?? "regular";
        meals[diet] = (meals[diet] ?? 0) + g.count;
      });
      expect(meals.regular).toBe(5); // 2 + 3 (null defaults to regular)
      expect(meals.vegan).toBe(1);
      expect(meals.vegetarian).toBeUndefined(); // no=not counted
    });

    it("filters guests by RSVP status", () => {
      const guests = [
        { name: "א", rsvpStatus: "yes" },
        { name: "ב", rsvpStatus: "no" },
        { name: "ג", rsvpStatus: "pending" },
        { name: "ד", rsvpStatus: "yes" },
      ];
      expect(guests.filter(g => g.rsvpStatus === "yes").length).toBe(2);
      expect(guests.filter(g => g.rsvpStatus === "pending").length).toBe(1);
    });
  });

  // ─── Seating logic ────────────────────────────────────────────────────────
  describe("Seating", () => {
    it("calculates seated count per table", () => {
      const guests = [
        { id: 1, tableId: 10, count: 2 },
        { id: 2, tableId: 10, count: 1 },
        { id: 3, tableId: 11, count: 3 },
        { id: 4, tableId: null, count: 1 },
      ];
      const table10Count = guests.filter(g => g.tableId === 10).reduce((s, g) => s + g.count, 0);
      expect(table10Count).toBe(3);
    });

    it("identifies unseated confirmed guests", () => {
      const guests = [
        { id: 1, tableId: null, rsvpStatus: "yes" },
        { id: 2, tableId: 5, rsvpStatus: "yes" },
        { id: 3, tableId: null, rsvpStatus: "no" },
        { id: 4, tableId: null, rsvpStatus: "yes" },
      ];
      const unseated = guests.filter(g => !g.tableId && g.rsvpStatus === "yes");
      expect(unseated.length).toBe(2);
    });

    it("detects table capacity overflow", () => {
      const table = { id: 1, capacity: 10 };
      const seated = [
        { tableId: 1, count: 4 },
        { tableId: 1, count: 4 },
        { tableId: 1, count: 3 },
      ];
      const total = seated.filter(g => g.tableId === table.id).reduce((s, g) => s + g.count, 0);
      expect(total > table.capacity).toBe(true);
    });
  });

  // ─── Budget logic ─────────────────────────────────────────────────────────
  describe("Budget", () => {
    it("calculates total estimated vs actual", () => {
      const items = [
        { estimatedAmount: "5000", actualAmount: "4800", paid: true },
        { estimatedAmount: "3000", actualAmount: null, paid: false },
        { estimatedAmount: "2000", actualAmount: "2200", paid: true },
      ];
      const totalEstimated = items.reduce((s, i) => s + parseFloat(i.estimatedAmount ?? "0"), 0);
      const totalActual = items.reduce((s, i) => s + parseFloat(i.actualAmount ?? "0"), 0);
      const totalPaid = items.filter(i => i.paid).reduce((s, i) => s + parseFloat(i.actualAmount ?? i.estimatedAmount ?? "0"), 0);
      expect(totalEstimated).toBe(10000);
      expect(totalActual).toBe(7000);
      expect(totalPaid).toBe(7000);
    });

    it("identifies unpaid items", () => {
      const items = [
        { category: "אולם", paid: true },
        { category: "פרחים", paid: false },
        { category: "צילום", paid: false },
      ];
      expect(items.filter(i => !i.paid).length).toBe(2);
    });
  });

  // ─── Gifts logic ──────────────────────────────────────────────────────────
  describe("Gifts", () => {
    it("calculates total gift amount", () => {
      const guests = [
        { giftAmount: "500", thanked: true },
        { giftAmount: "1000", thanked: false },
        { giftAmount: null, thanked: false },
        { giftAmount: "750", thanked: true },
      ];
      const total = guests.reduce((s, g) => s + parseFloat(g.giftAmount ?? "0"), 0);
      expect(total).toBe(2250);
    });

    it("counts unthanked guests with gifts", () => {
      const guests = [
        { giftAmount: "500", thanked: false },
        { giftAmount: "1000", thanked: true },
        { giftAmount: null, thanked: false },
        { giftAmount: "750", thanked: false },
      ];
      const notThanked = guests.filter(g => g.giftAmount && !g.thanked).length;
      expect(notThanked).toBe(2);
    });
  });

  // ─── Venue Share integration ──────────────────────────────────────────────
  describe("Venue Share — guest summary", () => {
    it("builds correct guest summary for share view", () => {
      const guests = [
        { rsvpStatus: "yes", count: 2 },
        { rsvpStatus: "yes", count: 1 },
        { rsvpStatus: "no", count: 1 },
        { rsvpStatus: "pending", count: 3 },
        { rsvpStatus: "maybe", count: 1 },
      ];
      const summary = {
        total: guests.reduce((s, g) => s + g.count, 0),
        confirmed: guests.filter(g => g.rsvpStatus === "yes").reduce((s, g) => s + g.count, 0),
        declined: guests.filter(g => g.rsvpStatus === "no").reduce((s, g) => s + g.count, 0),
        pending: guests.filter(g => g.rsvpStatus === "pending").reduce((s, g) => s + g.count, 0),
      };
      expect(summary.total).toBe(8);
      expect(summary.confirmed).toBe(3);
      expect(summary.declined).toBe(1);
      expect(summary.pending).toBe(3);
    });
  });
});
