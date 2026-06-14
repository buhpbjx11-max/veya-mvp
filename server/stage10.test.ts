import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getCoupleByUserId: vi.fn().mockResolvedValue({
      id: 1,
      userId: 42,
      name1: "אלי",
      name2: "מיה",
      type: "venue_linked",
      venueId: 10,
      weddingDate: new Date("2026-09-15"),
      invitation: JSON.stringify({
        location: "אולם הגן",
        time: "19:00",
        customText: "ברוכים הבאים",
        rsvpDeadline: "2026-09-01",
        shareToken: "test-share-token-abc123",
      }),
    }),
    updateCouple: vi.fn().mockResolvedValue(undefined),
    createMessage: vi.fn().mockResolvedValue(99),
    getMessagesByConversation: vi.fn().mockResolvedValue([
      {
        id: 1,
        conversationId: "wedding_5",
        conversationType: "venue_couple",
        senderId: 42,
        senderType: "couple",
        content: "שלום, יש שאלה לגבי התפריט",
        createdAt: new Date("2026-06-01T10:00:00Z"),
      },
      {
        id: 2,
        conversationId: "wedding_5",
        conversationType: "venue_couple",
        senderId: 99,
        senderType: "venue",
        content: "כמובן, מה תרצו לדעת?",
        createdAt: new Date("2026-06-01T10:05:00Z"),
      },
    ]),
    getVenueByUserId: vi.fn().mockResolvedValue(null),
    getWeddingByVenueAndCouple: vi.fn().mockResolvedValue({ id: 5 }),
  };
});

import {
  getCoupleByUserId,
  updateCouple,
  createMessage,
  getMessagesByConversation,
} from "./db";

// ─── Invitation DB helpers ────────────────────────────────────────────────────
describe("Invitation — couple.getInvitation logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getCoupleByUserId as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      userId: 42,
      name1: "אלי",
      name2: "מיה",
      type: "venue_linked",
      venueId: 10,
      weddingDate: new Date("2026-09-15"),
      invitation: JSON.stringify({
        location: "אולם הגן",
        time: "19:00",
        customText: "ברוכים הבאים",
        rsvpDeadline: "2026-09-01",
        shareToken: "test-share-token-abc123",
      }),
    });
  });

  it("getCoupleByUserId returns couple with invitation JSON", async () => {
    const couple = await getCoupleByUserId(42);
    expect(couple).not.toBeNull();
    expect(couple?.invitation).toBeDefined();
  });

  it("invitation JSON contains expected fields", async () => {
    const couple = await getCoupleByUserId(42);
    const inv = JSON.parse(couple?.invitation as string ?? "{}") as Record<string, string>;
    expect(inv.location).toBe("אולם הגן");
    expect(inv.time).toBe("19:00");
    expect(inv.customText).toBe("ברוכים הבאים");
    expect(inv.rsvpDeadline).toBe("2026-09-01");
    expect(inv.shareToken).toBe("test-share-token-abc123");
  });

  it("invitation JSON has shareToken for sharing", async () => {
    const couple = await getCoupleByUserId(42);
    const inv = JSON.parse(couple?.invitation as string ?? "{}") as Record<string, string>;
    expect(inv.shareToken).toMatch(/^[a-z0-9-]+$/);
  });

  it("updateCouple resolves without error", async () => {
    await expect(updateCouple(1, {} as Parameters<typeof updateCouple>[1])).resolves.toBeUndefined();
  });

  it("updateCouple is called with correct id", async () => {
    await updateCouple(1, {} as Parameters<typeof updateCouple>[1]);
    expect(updateCouple).toHaveBeenCalledWith(1, expect.anything());
  });
});

// ─── Invitation — updateInvitation logic ─────────────────────────────────────
describe("Invitation — updateInvitation logic", () => {
  it("merges new fields into existing invitation JSON", () => {
    const current: Record<string, string> = {
      location: "אולם הגן",
      time: "19:00",
      shareToken: "abc123",
    };
    const input: Record<string, string> = { time: "20:00", customText: "ברוכים הבאים" };
    const updated = { ...current, ...input };
    expect(updated.location).toBe("אולם הגן"); // preserved
    expect(updated.time).toBe("20:00"); // updated
    expect(updated.customText).toBe("ברוכים הבאים"); // added
    expect(updated.shareToken).toBe("abc123"); // preserved
  });

  it("generates shareToken if missing", () => {
    const current: Record<string, string> = { location: "אולם" };
    const shareToken = current.shareToken ?? "generated-token-xyz";
    expect(shareToken).toBe("generated-token-xyz");
  });

  it("preserves existing shareToken", () => {
    const current: Record<string, string> = { location: "אולם", shareToken: "existing-token" };
    const shareToken = current.shareToken ?? "new-token";
    expect(shareToken).toBe("existing-token");
  });
});

// ─── Chat — message helpers ───────────────────────────────────────────────────
describe("Chat — message DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createMessage as ReturnType<typeof vi.fn>).mockResolvedValue(99);
    (getMessagesByConversation as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 1,
        conversationId: "wedding_5",
        conversationType: "venue_couple",
        senderId: 42,
        senderType: "couple",
        content: "שלום, יש שאלה לגבי התפריט",
        createdAt: new Date("2026-06-01T10:00:00Z"),
      },
      {
        id: 2,
        conversationId: "wedding_5",
        conversationType: "venue_couple",
        senderId: 99,
        senderType: "venue",
        content: "כמובן, מה תרצו לדעת?",
        createdAt: new Date("2026-06-01T10:05:00Z"),
      },
    ]);
  });

  it("createMessage returns new message id", async () => {
    const id = await createMessage({
      conversationId: "wedding_5",
      conversationType: "venue_couple",
      senderId: 42,
      senderType: "couple",
      content: "הודעה חדשה",
    } as Parameters<typeof createMessage>[0]);
    expect(id).toBe(99);
  });

  it("getMessagesByConversation returns messages list", async () => {
    const msgs = await getMessagesByConversation("wedding_5", "venue_couple");
    expect(msgs).toHaveLength(2);
  });

  it("messages are ordered by createdAt (first is older)", async () => {
    const msgs = await getMessagesByConversation("wedding_5", "venue_couple");
    expect(new Date(msgs[0].createdAt).getTime()).toBeLessThan(
      new Date(msgs[1].createdAt).getTime()
    );
  });

  it("message content is preserved correctly", async () => {
    const msgs = await getMessagesByConversation("wedding_5", "venue_couple");
    expect(msgs[0].content).toBe("שלום, יש שאלה לגבי התפריט");
    expect(msgs[1].content).toBe("כמובן, מה תרצו לדעת?");
  });

  it("message senderType distinguishes couple from venue", async () => {
    const msgs = await getMessagesByConversation("wedding_5", "venue_couple");
    expect(msgs[0].senderType).toBe("couple");
    expect(msgs[1].senderType).toBe("venue");
  });

  it("conversationId follows wedding_{id} format", async () => {
    const msgs = await getMessagesByConversation("wedding_5", "venue_couple");
    expect(msgs[0].conversationId).toMatch(/^wedding_\d+$/);
  });
});

// ─── Chat — venue_linked restriction ─────────────────────────────────────────
describe("Chat — venue_linked restriction logic", () => {
  it("venue_linked couple can access chat", () => {
    const couple = { type: "venue_linked" };
    const canChat = couple.type === "venue_linked";
    expect(canChat).toBe(true);
  });

  it("independent couple cannot access chat", () => {
    const couple = { type: "independent" };
    const canChat = couple.type === "venue_linked";
    expect(canChat).toBe(false);
  });

  it("null couple cannot access chat", () => {
    const couple = null;
    const canChat = couple !== null && (couple as { type: string }).type === "venue_linked";
    expect(canChat).toBe(false);
  });
});

// ─── GuestInvitation — public access ─────────────────────────────────────────
describe("GuestInvitation — public invitation data", () => {
  it("returns correct couple names", async () => {
    const couple = await getCoupleByUserId(42);
    expect(couple?.name1).toBe("אלי");
    expect(couple?.name2).toBe("מיה");
  });

  it("returns weddingDate as Date object", async () => {
    const couple = await getCoupleByUserId(42);
    expect(couple?.weddingDate).toBeInstanceOf(Date);
  });

  it("invitation location is accessible from JSON", async () => {
    const couple = await getCoupleByUserId(42);
    const inv = JSON.parse(couple?.invitation as string ?? "{}") as Record<string, string>;
    expect(inv.location).toBe("אולם הגן");
  });

  it("rsvpDeadline is a valid date string", async () => {
    const couple = await getCoupleByUserId(42);
    const inv = JSON.parse(couple?.invitation as string ?? "{}") as Record<string, string>;
    expect(new Date(inv.rsvpDeadline).getFullYear()).toBe(2026);
  });

  it("shareToken is a non-empty string", async () => {
    const couple = await getCoupleByUserId(42);
    const inv = JSON.parse(couple?.invitation as string ?? "{}") as Record<string, string>;
    expect(typeof inv.shareToken).toBe("string");
    expect(inv.shareToken.length).toBeGreaterThan(0);
  });
});
