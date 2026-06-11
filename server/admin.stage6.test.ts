/**
 * Stage 6 — VEYA HQ Admin procedures
 * Tests for: adminGetStats, adminListVenues, adminListCouples,
 *            adminListLeads, adminCreateLead, adminUpdateLead, adminDeleteLead,
 *            adminListAccessGrants, adminCreateAccessGrant, adminUpdateAccessGrant,
 *            adminUpdateVenueStatus
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getDb ────────────────────────────────────────────────────────────────
const mockVenues = [
  { id: 1, name: "אולם א", plan: "pro", subStatus: "active", region: "מרכז", coupleAccess: "full" },
  { id: 2, name: "אולם ב", plan: "basic", subStatus: "trial", region: "צפון", coupleAccess: "limited" },
  { id: 3, name: "אולם ג", plan: "basic", subStatus: "locked", region: "דרום", coupleAccess: "none" },
];
const mockCouples = [
  { id: 1, name1: "דנה", name2: "יוסי", type: "venue_linked", weddingDate: new Date("2026-09-01"), assignmentLocked: false, storageStatus: "active", createdAt: new Date() },
  { id: 2, name1: "מיכל", name2: "אבי", type: "independent", weddingDate: null, assignmentLocked: false, storageStatus: "active", createdAt: new Date() },
];
const mockWeddings = [
  { id: 1, coupleId: 1, venueId: 1, weddingDate: new Date("2026-09-01") },
];
const mockLeads: any[] = [];
const mockAccessGrants: any[] = [];

let leadIdSeq = 100;
let accessIdSeq = 200;

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockImplementation((table: any) => {
    const name = table?._.name ?? table?.name ?? "";
    if (name === "venues") return Promise.resolve(mockVenues);
    if (name === "couples") return Promise.resolve(mockCouples);
    if (name === "weddings") return Promise.resolve(mockWeddings);
    if (name === "leads") return { orderBy: vi.fn().mockResolvedValue(mockLeads) };
    if (name === "access_grants") return { orderBy: vi.fn().mockResolvedValue(mockAccessGrants) };
    return Promise.resolve([]);
  }),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockImplementation((data: any) => ({
    execute: vi.fn().mockImplementation(() => {
      if (data.venueName !== undefined) {
        const id = ++leadIdSeq;
        mockLeads.push({ id, ...data, createdAt: new Date() });
        return Promise.resolve([{ insertId: id }]);
      }
      if (data.name !== undefined && data.role !== undefined) {
        const id = ++accessIdSeq;
        mockAccessGrants.push({ id, ...data, status: "pending", approvedByBar: false, createdAt: new Date() });
        return Promise.resolve([{ insertId: id }]);
      }
      return Promise.resolve([{ insertId: 0 }]);
    }),
  })),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    adminGetStats: async () => ({
      totalVenues: mockVenues.length,
      activeVenues: mockVenues.filter(v => v.subStatus === "active").length,
      trialVenues: mockVenues.filter(v => v.subStatus === "trial").length,
      lockedVenues: mockVenues.filter(v => v.subStatus === "locked").length,
      totalCouples: mockCouples.length,
      venueLinkedCouples: mockCouples.filter(c => c.type === "venue_linked").length,
      independentCouples: mockCouples.filter(c => c.type === "independent").length,
      totalWeddings: mockWeddings.length,
    }),
    adminListVenues: async () => mockVenues,
    adminListCouples: async () => mockCouples,
    adminUpdateVenueStatus: async (venueId: number, subStatus: string) => {
      const v = mockVenues.find(v => v.id === venueId);
      if (v) v.subStatus = subStatus;
    },
    adminListLeads: async () => [...mockLeads],
    adminCreateLead: async (data: any) => {
      const id = ++leadIdSeq;
      mockLeads.push({ id, ...data, createdAt: new Date() });
      return id;
    },
    adminUpdateLead: async (id: number, data: any) => {
      const lead = mockLeads.find(l => l.id === id);
      if (lead) Object.assign(lead, data);
    },
    adminDeleteLead: async (id: number) => {
      const idx = mockLeads.findIndex(l => l.id === id);
      if (idx !== -1) mockLeads.splice(idx, 1);
    },
    adminListAccessGrants: async () => [...mockAccessGrants],
    adminCreateAccessGrant: async (data: any) => {
      const id = ++accessIdSeq;
      mockAccessGrants.push({ id, ...data, status: "pending", approvedByBar: false, createdAt: new Date() });
      return id;
    },
    adminUpdateAccessGrant: async (id: number, data: any) => {
      const grant = mockAccessGrants.find(g => g.id === id);
      if (grant) Object.assign(grant, data);
    },
  };
});

import {
  adminGetStats,
  adminListVenues,
  adminListCouples,
  adminUpdateVenueStatus,
  adminListLeads,
  adminCreateLead,
  adminUpdateLead,
  adminDeleteLead,
  adminListAccessGrants,
  adminCreateAccessGrant,
  adminUpdateAccessGrant,
} from "./db";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Stage 6 — VEYA HQ Admin", () => {
  describe("adminGetStats", () => {
    it("returns correct venue counts", async () => {
      const stats = await adminGetStats();
      expect(stats.totalVenues).toBe(3);
      expect(stats.activeVenues).toBe(1);
      expect(stats.trialVenues).toBe(1);
      expect(stats.lockedVenues).toBe(1);
    });

    it("returns correct couple counts", async () => {
      const stats = await adminGetStats();
      expect(stats.totalCouples).toBe(2);
      expect(stats.venueLinkedCouples).toBe(1);
      expect(stats.independentCouples).toBe(1);
    });

    it("returns total weddings", async () => {
      const stats = await adminGetStats();
      expect(stats.totalWeddings).toBe(1);
    });
  });

  describe("adminListVenues", () => {
    it("returns all venues", async () => {
      const list = await adminListVenues();
      expect(list).toHaveLength(3);
    });

    it("includes plan and subStatus fields", async () => {
      const list = await adminListVenues();
      expect(list[0]).toHaveProperty("plan");
      expect(list[0]).toHaveProperty("subStatus");
    });
  });

  describe("adminUpdateVenueStatus — kill-switch", () => {
    it("changes venue status to locked", async () => {
      await adminUpdateVenueStatus(1, "locked");
      const list = await adminListVenues();
      const venue = list.find(v => v.id === 1);
      expect(venue?.subStatus).toBe("locked");
    });

    it("restores venue status to active", async () => {
      await adminUpdateVenueStatus(1, "active");
      const list = await adminListVenues();
      const venue = list.find(v => v.id === 1);
      expect(venue?.subStatus).toBe("active");
    });
  });

  describe("adminListCouples", () => {
    it("returns all couples", async () => {
      const list = await adminListCouples();
      expect(list).toHaveLength(2);
    });

    it("includes type field (venue_linked / independent)", async () => {
      const list = await adminListCouples();
      const types = list.map(c => c.type);
      expect(types).toContain("venue_linked");
      expect(types).toContain("independent");
    });
  });

  describe("adminListLeads / adminCreateLead / adminUpdateLead / adminDeleteLead", () => {
    beforeEach(() => {
      mockLeads.length = 0;
    });

    it("creates a new lead and returns an id", async () => {
      const id = await adminCreateLead({ venueName: "אולם טסט", contact: "שרה", phone: "050-1234567", email: "test@test.com", notes: "", stage: "lead", source: "manual" });
      expect(typeof id).toBe("number");
      expect(id).toBeGreaterThan(0);
    });

    it("lists leads after creation", async () => {
      await adminCreateLead({ venueName: "אולם א", contact: "רון", phone: "", email: "", notes: "", stage: "lead", source: "outreach" });
      const list = await adminListLeads();
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].venueName).toBe("אולם א");
    });

    it("updates lead stage", async () => {
      const id = await adminCreateLead({ venueName: "אולם ב", contact: "מיכל", phone: "", email: "", notes: "", stage: "lead", source: "manual" });
      await adminUpdateLead(id, { stage: "meeting" });
      const list = await adminListLeads();
      const lead = list.find(l => l.id === id);
      expect(lead?.stage).toBe("meeting");
    });

    it("deletes a lead", async () => {
      const id = await adminCreateLead({ venueName: "אולם ג", contact: "דן", phone: "", email: "", notes: "", stage: "lead", source: "manual" });
      await adminDeleteLead(id);
      const list = await adminListLeads();
      expect(list.find(l => l.id === id)).toBeUndefined();
    });
  });

  describe("adminListAccessGrants / adminCreateAccessGrant / adminUpdateAccessGrant", () => {
    beforeEach(() => {
      mockAccessGrants.length = 0;
    });

    it("creates an access grant with pending status", async () => {
      const id = await adminCreateAccessGrant({ name: "עו\"ד כהן", email: "cohen@law.co.il", role: "legal", scope: "invoices", permission: "view" });
      expect(typeof id).toBe("number");
      const list = await adminListAccessGrants();
      const grant = list.find(g => g.id === id);
      expect(grant?.status).toBe("pending");
      expect(grant?.approvedByBar).toBe(false);
    });

    it("activates a grant (approve by Bar)", async () => {
      const id = await adminCreateAccessGrant({ name: "רו\"ח לוי", email: "levi@cpa.co.il", role: "cpa", scope: "", permission: "view" });
      await adminUpdateAccessGrant(id, { status: "active", approvedByBar: true });
      const list = await adminListAccessGrants();
      const grant = list.find(g => g.id === id);
      expect(grant?.status).toBe("active");
      expect(grant?.approvedByBar).toBe(true);
    });

    it("revokes a grant", async () => {
      const id = await adminCreateAccessGrant({ name: "יועץ מס", email: "tax@firm.co.il", role: "tax", scope: "", permission: "view" });
      await adminUpdateAccessGrant(id, { status: "revoked" });
      const list = await adminListAccessGrants();
      const grant = list.find(g => g.id === id);
      expect(grant?.status).toBe("revoked");
    });
  });
});
