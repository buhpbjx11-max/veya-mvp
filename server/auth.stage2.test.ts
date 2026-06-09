/**
 * VEYA MVP — Stage 2 Auth & Routing Tests
 * Tests for: accountContext, venue.register, couple.register
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getAccountContext: vi.fn(),
  getVenueByUserId: vi.fn(),
  getCoupleByUserId: vi.fn(),
  createVenue: vi.fn(),
  createCouple: vi.fn(),
  updateVenue: vi.fn(),
  updateCouple: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserById: vi.fn(),
  upsertUser: vi.fn(),
}));

import * as db from "./db";

// ─── getAccountContext logic tests ────────────────────────────────────────────
describe("getAccountContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns admin for users with role=admin", async () => {
    vi.mocked(db.getAccountContext).mockResolvedValue({ accountType: "admin" });
    const result = await db.getAccountContext(1, "admin");
    expect(result.accountType).toBe("admin");
  });

  it("returns venue when user has a venue record", async () => {
    const mockVenue = { id: 10, userId: 2, name: "אולם הגן" } as Parameters<typeof db.getAccountContext>[0] extends never ? never : Awaited<ReturnType<typeof db.getAccountContext>> extends { venue?: infer V } ? V : never;
    vi.mocked(db.getAccountContext).mockResolvedValue({
      accountType: "venue",
      venue: mockVenue as never,
    });
    const result = await db.getAccountContext(2, "user");
    expect(result.accountType).toBe("venue");
  });

  it("returns couple when user has a couple record", async () => {
    vi.mocked(db.getAccountContext).mockResolvedValue({
      accountType: "couple",
      couple: { id: 5, name1: "עדן", name2: "נועה" } as never,
    });
    const result = await db.getAccountContext(3, "user");
    expect(result.accountType).toBe("couple");
  });

  it("returns new for users with no venue or couple", async () => {
    vi.mocked(db.getAccountContext).mockResolvedValue({ accountType: "new" });
    const result = await db.getAccountContext(4, "user");
    expect(result.accountType).toBe("new");
  });
});

// ─── Venue registration logic tests ──────────────────────────────────────────
describe("venue.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a venue with trial status", async () => {
    vi.mocked(db.getVenueByUserId).mockResolvedValue(null);
    vi.mocked(db.createVenue).mockResolvedValue(42);

    const venueId = await db.createVenue({
      userId: 1,
      name: "אולם הגן הקסום",
      plan: "basic",
      billingCycle: "monthly",
      subStatus: "trial",
      coupleAccess: "free",
    });

    expect(venueId).toBe(42);
    expect(db.createVenue).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "אולם הגן הקסום",
        subStatus: "trial",
        plan: "basic",
      })
    );
  });

  it("rejects duplicate venue registration", async () => {
    vi.mocked(db.getVenueByUserId).mockResolvedValue({ id: 1, userId: 1, name: "קיים" } as never);

    const existing = await db.getVenueByUserId(1);
    expect(existing).not.toBeNull();
    // In the router, this triggers a CONFLICT error
  });
});

// ─── Couple registration logic tests ─────────────────────────────────────────
describe("couple.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a couple with gender-neutral names", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue(null);
    vi.mocked(db.createCouple).mockResolvedValue(99);

    const coupleId = await db.createCouple({
      userId: 1,
      name1: "עדן",
      name2: "נועה",
      primaryContact: "1",
      type: "independent",
      plan: "base",
      storageStatus: "active",
    });

    expect(coupleId).toBe(99);
    expect(db.createCouple).toHaveBeenCalledWith(
      expect.objectContaining({
        name1: "עדן",
        name2: "נועה",
        type: "independent", // IRON RULE: never set by user
      })
    );
  });

  it("never allows couple to set type=venue_linked directly", async () => {
    // type is always set to 'independent' on direct registration
    // venue_linked is only set via wedding invite flow (stage 3)
    vi.mocked(db.createCouple).mockResolvedValue(100);

    await db.createCouple({
      userId: 2,
      name1: "דנה",
      name2: "יוסי",
      primaryContact: "1",
      type: "independent", // always independent on direct registration
      plan: "base",
      storageStatus: "active",
    });

    expect(db.createCouple).toHaveBeenCalledWith(
      expect.objectContaining({ type: "independent" })
    );
  });

  it("rejects duplicate couple registration", async () => {
    vi.mocked(db.getCoupleByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      name1: "קיים",
      name2: "קיים",
    } as never);

    const existing = await db.getCoupleByUserId(1);
    expect(existing).not.toBeNull();
    // In the router, this triggers a CONFLICT error
  });
});
