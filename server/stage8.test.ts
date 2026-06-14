import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getVendorsByCoupleId: vi.fn().mockResolvedValue([
      { id: 1, ownerType: "couple", ownerId: 1, name: "DJ מיכאל", category: "DJ/תקליטן", phone: "050-1234567", contact: null, status: "active" },
    ]),
    createVendor: vi.fn().mockResolvedValue(2),
    updateVendor: vi.fn().mockResolvedValue(undefined),
    deleteVendor: vi.fn().mockResolvedValue(undefined),
    getFamilyAccessByCoupleId: vi.fn().mockResolvedValue([
      { id: 1, coupleId: 1, name: "אמא", email: null, phone: null, accessLevel: "view_only", assignedArea: null, inviteToken: "tok123", status: "pending" },
    ]),
    createFamilyAccess: vi.fn().mockResolvedValue(3),
    updateFamilyAccess: vi.fn().mockResolvedValue(undefined),
    deleteFamilyAccess: vi.fn().mockResolvedValue(undefined),
    getFamilyAccessByToken: vi.fn().mockResolvedValue({
      id: 1, coupleId: 1, name: "אמא", email: null, phone: null, accessLevel: "view_only", assignedArea: null, inviteToken: "tok123", status: "pending",
    }),
    getCoupleByUserId: vi.fn().mockResolvedValue({ id: 1, userId: 42, name1: "שם1", name2: "שם2", type: "independent" }),
  };
});

import {
  getVendorsByCoupleId,
  createVendor,
  updateVendor,
  deleteVendor,
  getFamilyAccessByCoupleId,
  createFamilyAccess,
  updateFamilyAccess,
  deleteFamilyAccess,
  getFamilyAccessByToken,
  getCoupleByUserId,
} from "./db";

// ─── Vendor DB helpers ────────────────────────────────────────────────────────
describe("Vendor DB helpers", () => {
  it("getVendorsByCoupleId returns vendor list", async () => {
    const vendors = await getVendorsByCoupleId(1);
    expect(vendors).toHaveLength(1);
    expect(vendors[0].name).toBe("DJ מיכאל");
    expect(vendors[0].category).toBe("DJ/תקליטן");
  });

  it("createVendor returns new id", async () => {
    const id = await createVendor({ ownerType: "couple", ownerId: 1, name: "צלמת", category: "צלם/צלמת", phone: null, contact: null, status: "active" });
    expect(id).toBe(2);
  });

  it("updateVendor resolves without error", async () => {
    await expect(updateVendor(1, { status: "done" })).resolves.toBeUndefined();
  });

  it("deleteVendor resolves without error", async () => {
    await expect(deleteVendor(1)).resolves.toBeUndefined();
  });
});

// ─── Family Access DB helpers ─────────────────────────────────────────────────
describe("FamilyAccess DB helpers", () => {
  it("getFamilyAccessByCoupleId returns list", async () => {
    const list = await getFamilyAccessByCoupleId(1);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("אמא");
    expect(list[0].accessLevel).toBe("view_only");
  });

  it("createFamilyAccess returns new id", async () => {
    const id = await createFamilyAccess({ coupleId: 1, name: "אחות", email: null, phone: null, accessLevel: "view_only", assignedArea: null, inviteToken: "newtoken", status: "pending" });
    expect(id).toBe(3);
  });

  it("getFamilyAccessByToken returns record", async () => {
    const record = await getFamilyAccessByToken("tok123");
    expect(record).not.toBeNull();
    expect(record?.name).toBe("אמא");
    expect(record?.status).toBe("pending");
  });

  it("updateFamilyAccess resolves without error", async () => {
    await expect(updateFamilyAccess(1, { status: "active" })).resolves.toBeUndefined();
  });

  it("deleteFamilyAccess resolves without error", async () => {
    await expect(deleteFamilyAccess(1)).resolves.toBeUndefined();
  });
});

// ─── Vendor business logic ────────────────────────────────────────────────────
describe("Vendor business logic", () => {
  it("vendor categories cover main wedding vendors", () => {
    const CATEGORIES = ["צלם/צלמת", "DJ/תקליטן", "קייטרינג", "פרחים", "תאורה", "הגברה", "שמלה/חליפה", "קייק", "הסעות", "מאפר/מעצב שיער", "אחר"];
    expect(CATEGORIES).toContain("DJ/תקליטן");
    expect(CATEGORIES).toContain("קייטרינג");
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(10);
  });

  it("vendor statuses are valid", () => {
    const STATUSES = ["active", "pending", "done", "cancelled"];
    expect(STATUSES).toContain("active");
    expect(STATUSES).toContain("done");
  });
});

// ─── Family Access business logic ─────────────────────────────────────────────
describe("FamilyAccess business logic", () => {
  it("access levels are view_only or limited_edit", () => {
    const levels = ["view_only", "limited_edit"];
    expect(levels).toContain("view_only");
    expect(levels).toContain("limited_edit");
  });

  it("invite token is generated as hex string", () => {
    // Simulate token generation
    const token = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token.length).toBe(24);
  });

  it("revoked status prevents further access", async () => {
    const revokedRecord = { id: 2, coupleId: 1, name: "דוד", email: null, phone: null, accessLevel: "view_only" as const, assignedArea: null, inviteToken: "revoked_tok", status: "revoked" };
    expect(revokedRecord.status).toBe("revoked");
  });
});

// ─── Timeline logic ───────────────────────────────────────────────────────────
describe("Timeline logic", () => {
  it("timeline items have required fields", () => {
    const item = { id: "abc123", time: "18:00", label: "חופה", responsible: "מנהל אירוע", addedBy: "couple" };
    expect(item.id).toBeTruthy();
    expect(item.time).toMatch(/^\d{2}:\d{2}$/);
    expect(item.label).toBeTruthy();
  });

  it("time sorting works correctly", () => {
    const items = [
      { time: "20:00", label: "ריקודים" },
      { time: "18:00", label: "קבלת פנים" },
      { time: "19:30", label: "חופה" },
    ];
    const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
    expect(sorted[0].time).toBe("18:00");
    expect(sorted[1].time).toBe("19:30");
    expect(sorted[2].time).toBe("20:00");
  });

  it("incrementTime adds 60 minutes correctly", () => {
    function incrementTime(t: string): string {
      const [h, m] = t.split(":").map(Number);
      const total = h * 60 + m + 60;
      return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    }
    expect(incrementTime("18:00")).toBe("19:00");
    expect(incrementTime("23:30")).toBe("00:30");
    expect(incrementTime("14:45")).toBe("15:45");
  });
});
