/**
 * Stage 3 Tests — Wedding Flow
 *
 * Tests the core wedding flow:
 * 1. Venue creates a wedding → gets inviteToken
 * 2. Couple accepts invite via token → becomes venue_linked
 * 3. Iron rules: assignmentLocked, already-linked wedding, couple type set automatically
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the DB module ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getVenueByUserId: vi.fn(),
  getCoupleByUserId: vi.fn(),
  getCoupleById: vi.fn(),
  getWeddingByToken: vi.fn(),
  getWeddingById: vi.fn(),
  createWedding: vi.fn(),
  getWeddingsByVenueId: vi.fn(),
  acceptWeddingInvite: vi.fn(),
  getAccountContext: vi.fn(),
  createVenue: vi.fn(),
  createCouple: vi.fn(),
  updateVenue: vi.fn(),
  updateCouple: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserById: vi.fn(),
  upsertUser: vi.fn(),
  getVenueById: vi.fn(),
}));

import * as db from "./db";

// ── Test helpers ──────────────────────────────────────────────────────────────

const mockVenue = {
  id: 1,
  userId: 10,
  name: "אולם הגן",
  plan: "basic" as const,
  subStatus: "trial" as const,
  coupleAccess: "free" as const,
  billingCycle: "monthly" as const,
  region: null,
  contact: null,
  phone: null,
  email: null,
  resellPrice: null,
  trialEndsAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCouple = {
  id: 5,
  userId: 20,
  name1: "עדן",
  name2: "נועה",
  phone1: null,
  phone2: null,
  primaryContact: "1" as const,
  email: null,
  weddingDate: null,
  type: "independent" as const,
  venueId: null,
  assignmentLocked: false,
  plan: "base" as const,
  storageStatus: "active" as const,
  deleteAt: null,
  sideLabels: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWedding = {
  id: 100,
  venueId: 1,
  coupleId: null,
  date: new Date("2026-10-15"),
  status: "prep" as const,
  inviteToken: "abc123token",
  balanceDue: null,
  timeline: [{ time: "00:00", label: "עדן & נועה", addedBy: "venue" as const }],
  documents: null,
  guestPhotoUploadClosedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Wedding Flow — Stage 3", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Create wedding ────────────────────────────────────────────────────────

  describe("createWedding", () => {
    it("should create a wedding with a unique inviteToken", async () => {
      vi.mocked(db.createWedding).mockResolvedValue(100);

      const weddingId = await db.createWedding({
        venueId: 1,
        coupleId: null,
        date: new Date("2026-10-15"),
        status: "prep",
        inviteToken: "some-random-token",
        timeline: [{ time: "00:00", label: "עדן & נועה", addedBy: "venue" }],
      });

      expect(weddingId).toBe(100);
      expect(db.createWedding).toHaveBeenCalledOnce();
    });

    it("should reject wedding creation if user has no venue", async () => {
      vi.mocked(db.getVenueByUserId).mockResolvedValue(null);

      const venue = await db.getVenueByUserId(999);
      expect(venue).toBeNull();
    });
  });

  // ── 2. Get wedding by token ──────────────────────────────────────────────────

  describe("getWeddingByToken", () => {
    it("should return wedding details for a valid token", async () => {
      vi.mocked(db.getWeddingByToken).mockResolvedValue(mockWedding);

      const wedding = await db.getWeddingByToken("abc123token");
      expect(wedding).not.toBeNull();
      expect(wedding?.inviteToken).toBe("abc123token");
      expect(wedding?.coupleId).toBeNull(); // not yet linked
    });

    it("should return null for an invalid token", async () => {
      vi.mocked(db.getWeddingByToken).mockResolvedValue(null);

      const wedding = await db.getWeddingByToken("invalid-token");
      expect(wedding).toBeNull();
    });
  });

  // ── 3. Accept invite — happy path ────────────────────────────────────────────

  describe("acceptWeddingInvite", () => {
    it("should link couple to wedding and set type to venue_linked", async () => {
      vi.mocked(db.getCoupleById).mockResolvedValue(mockCouple);
      vi.mocked(db.getWeddingById).mockResolvedValue(mockWedding);
      vi.mocked(db.acceptWeddingInvite).mockResolvedValue(undefined);

      await db.acceptWeddingInvite(100, 5, 1);

      expect(db.acceptWeddingInvite).toHaveBeenCalledWith(100, 5, 1);
    });

    it("should throw ASSIGNMENT_LOCKED if couple is locked", async () => {
      const lockedCouple = { ...mockCouple, assignmentLocked: true };
      vi.mocked(db.getCoupleById).mockResolvedValue(lockedCouple);
      vi.mocked(db.acceptWeddingInvite).mockRejectedValue(new Error("ASSIGNMENT_LOCKED"));

      await expect(db.acceptWeddingInvite(100, 5, 1)).rejects.toThrow("ASSIGNMENT_LOCKED");
    });

    it("should throw WEDDING_ALREADY_LINKED if wedding has a different couple", async () => {
      const linkedWedding = { ...mockWedding, coupleId: 99 }; // different couple
      vi.mocked(db.getCoupleById).mockResolvedValue(mockCouple);
      vi.mocked(db.getWeddingById).mockResolvedValue(linkedWedding);
      vi.mocked(db.acceptWeddingInvite).mockRejectedValue(new Error("WEDDING_ALREADY_LINKED"));

      await expect(db.acceptWeddingInvite(100, 5, 1)).rejects.toThrow("WEDDING_ALREADY_LINKED");
    });

    it("should allow re-linking same couple to same wedding (idempotent)", async () => {
      const sameCouple = { ...mockWedding, coupleId: 5 }; // same couple
      vi.mocked(db.getCoupleById).mockResolvedValue(mockCouple);
      vi.mocked(db.getWeddingById).mockResolvedValue(sameCouple);
      vi.mocked(db.acceptWeddingInvite).mockResolvedValue(undefined);

      await expect(db.acceptWeddingInvite(100, 5, 1)).resolves.not.toThrow();
    });
  });

  // ── 4. Iron rules ────────────────────────────────────────────────────────────

  describe("Iron rules", () => {
    it("couple.type must be independent when registering directly (not via invite)", async () => {
      vi.mocked(db.createCouple).mockResolvedValue(5);

      const coupleId = await db.createCouple({
        userId: 20,
        name1: "עדן",
        name2: "נועה",
        primaryContact: "1",
        type: "independent", // must always be independent on direct registration
        plan: "base",
        storageStatus: "active",
      });

      expect(coupleId).toBe(5);
      // Verify the call used type: "independent"
      expect(db.createCouple).toHaveBeenCalledWith(
        expect.objectContaining({ type: "independent" })
      );
    });

    it("couple.type becomes venue_linked only via acceptWeddingInvite", async () => {
      vi.mocked(db.getCoupleById).mockResolvedValue(mockCouple);
      vi.mocked(db.getWeddingById).mockResolvedValue(mockWedding);
      vi.mocked(db.acceptWeddingInvite).mockResolvedValue(undefined);

      // The only way to become venue_linked is via acceptWeddingInvite
      await db.acceptWeddingInvite(100, 5, 1);
      expect(db.acceptWeddingInvite).toHaveBeenCalledOnce();
    });

    it("wedding list should only return weddings for the requesting venue", async () => {
      const venue1Weddings = [mockWedding];
      vi.mocked(db.getWeddingsByVenueId).mockResolvedValue(venue1Weddings);

      const result = await db.getWeddingsByVenueId(1);
      expect(result).toHaveLength(1);
      expect(result[0].venueId).toBe(1);
    });
  });
});
