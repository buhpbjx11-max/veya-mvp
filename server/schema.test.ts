/**
 * Stage 11 — Schema vitest
 * Tests that the Drizzle schema tables exist and have the expected columns/types.
 * These are static structural tests — no DB connection needed.
 */
import { describe, it, expect } from "vitest";
import {
  users,
  venues,
  couples,
  guests,
  tables,
  weddings,
  messages,
  budgetItems,
  photos,
  vendors,
  familyAccess,
  toolSettings,
  venueShares,
  leads,
  accessGrants,
  feedback,
  canvasObjects,
  externalStaff,
} from "../drizzle/schema";

// ─── Helper: extract column names from a Drizzle table ───────────────────────
function columnNames(table: Record<string, unknown>): string[] {
  // Drizzle tables expose columns as properties on the table object
  // Filter out non-column properties (functions, symbols, etc.)
  return Object.keys(table).filter(
    (k) =>
      typeof (table as Record<string, unknown>)[k] === "object" &&
      (table as Record<string, unknown>)[k] !== null &&
      !Array.isArray((table as Record<string, unknown>)[k]) &&
      typeof ((table as Record<string, unknown>)[k] as Record<string, unknown>).name === "string"
  );
}

// ─── users ────────────────────────────────────────────────────────────────────
describe("Schema: users table", () => {
  it("has id column", () => {
    expect(users.id).toBeDefined();
  });
  it("has openId column", () => {
    expect(users.openId).toBeDefined();
  });
  it("has email column", () => {
    expect(users.email).toBeDefined();
  });
  it("has role column", () => {
    expect(users.role).toBeDefined();
  });
  it("has createdAt column", () => {
    expect(users.createdAt).toBeDefined();
  });
});

// ─── venues ───────────────────────────────────────────────────────────────────
describe("Schema: venues table", () => {
  it("has id column", () => {
    expect(venues.id).toBeDefined();
  });
  it("has userId column", () => {
    expect(venues.userId).toBeDefined();
  });
  it("has name column", () => {
    expect(venues.name).toBeDefined();
  });
  it("has plan column", () => {
    expect(venues.plan).toBeDefined();
  });
  it("has subStatus column", () => {
    expect(venues.subStatus).toBeDefined();
  });
  it("has phone column", () => {
    expect(venues.phone).toBeDefined();
  });
  it("has contact column", () => {
    expect(venues.contact).toBeDefined();
  });
});

// ─── couples ──────────────────────────────────────────────────────────────────
describe("Schema: couples table", () => {
  it("has id column", () => {
    expect(couples.id).toBeDefined();
  });
  it("has userId column", () => {
    expect(couples.userId).toBeDefined();
  });
  it("has name1 column (gender-neutral)", () => {
    expect(couples.name1).toBeDefined();
  });
  it("has name2 column (gender-neutral)", () => {
    expect(couples.name2).toBeDefined();
  });
  it("has type column (venue_linked | independent)", () => {
    expect(couples.type).toBeDefined();
  });
  it("has weddingDate column", () => {
    expect(couples.weddingDate).toBeDefined();
  });
  it("has invitation column (JSON)", () => {
    expect(couples.invitation).toBeDefined();
  });
  it("has venueId column", () => {
    expect(couples.venueId).toBeDefined();
  });
});

// ─── guests ───────────────────────────────────────────────────────────────────
describe("Schema: guests table", () => {
  it("has id column", () => {
    expect(guests.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(guests.coupleId).toBeDefined();
  });
  it("has name column", () => {
    expect(guests.name).toBeDefined();
  });
  it("has rsvpStatus column", () => {
    expect(guests.rsvpStatus).toBeDefined();
  });
  it("has diet column (JSON)", () => {
    expect(guests.diet).toBeDefined();
  });
});

// ─── weddings ─────────────────────────────────────────────────────────────────
describe("Schema: weddings table", () => {
  it("has id column", () => {
    expect(weddings.id).toBeDefined();
  });
  it("has venueId column", () => {
    expect(weddings.venueId).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(weddings.coupleId).toBeDefined();
  });
  it("has inviteToken column", () => {
    expect(weddings.inviteToken).toBeDefined();
  });
  it("has date column", () => {
    expect(weddings.date).toBeDefined();
  });
});

// ─── messages ─────────────────────────────────────────────────────────────────
describe("Schema: messages table", () => {
  it("has id column", () => {
    expect(messages.id).toBeDefined();
  });
  it("has conversationId column", () => {
    expect(messages.conversationId).toBeDefined();
  });
  it("has conversationType column", () => {
    expect(messages.conversationType).toBeDefined();
  });
  it("has senderId column", () => {
    expect(messages.senderId).toBeDefined();
  });
  it("has senderName column", () => {
    expect(messages.senderName).toBeDefined();
  });
  it("has content column", () => {
    expect(messages.content).toBeDefined();
  });
  it("has createdAt column", () => {
    expect(messages.createdAt).toBeDefined();
  });
});

// ─── budgetItems ──────────────────────────────────────────────────────────────
describe("Schema: budgetItems table", () => {
  it("has id column", () => {
    expect(budgetItems.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(budgetItems.coupleId).toBeDefined();
  });
  it("has category column", () => {
    expect(budgetItems.category).toBeDefined();
  });
  it("has estimatedAmount column", () => {
    expect(budgetItems.estimatedAmount).toBeDefined();
  });
});

// ─── photos ───────────────────────────────────────────────────────────────────
describe("Schema: photos table", () => {
  it("has id column", () => {
    expect(photos.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(photos.coupleId).toBeDefined();
  });
  it("has url column", () => {
    expect(photos.url).toBeDefined();
  });
  it("has fileKey column", () => {
    expect(photos.fileKey).toBeDefined();
  });
});

// ─── vendors ──────────────────────────────────────────────────────────────────
describe("Schema: vendors table", () => {
  it("has id column", () => {
    expect(vendors.id).toBeDefined();
  });
  it("has name column", () => {
    expect(vendors.name).toBeDefined();
  });
  it("has category column", () => {
    expect(vendors.category).toBeDefined();
  });
  it("has status column", () => {
    expect(vendors.status).toBeDefined();
  });
});

// ─── familyAccess ─────────────────────────────────────────────────────────────
describe("Schema: familyAccess table", () => {
  it("has id column", () => {
    expect(familyAccess.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(familyAccess.coupleId).toBeDefined();
  });
  it("has inviteToken column", () => {
    expect(familyAccess.inviteToken).toBeDefined();
  });
  it("has accessLevel column", () => {
    expect(familyAccess.accessLevel).toBeDefined();
  });
});

// ─── toolSettings ─────────────────────────────────────────────────────────────
describe("Schema: toolSettings table", () => {
  it("has id column", () => {
    expect(toolSettings.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(toolSettings.coupleId).toBeDefined();
  });
  it("has toolName column", () => {
    expect(toolSettings.toolName).toBeDefined();
  });
  it("has enabled column", () => {
    expect(toolSettings.enabled).toBeDefined();
  });
});

// ─── venueShares ──────────────────────────────────────────────────────────────
describe("Schema: venueShares table", () => {
  it("has id column", () => {
    expect(venueShares.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(venueShares.coupleId).toBeDefined();
  });
  it("has shareToken column", () => {
    expect(venueShares.shareToken).toBeDefined();
  });
  it("has revoked column", () => {
    expect(venueShares.revoked).toBeDefined();
  });
});

// ─── leads ────────────────────────────────────────────────────────────────────
describe("Schema: leads table", () => {
  it("has id column", () => {
    expect(leads.id).toBeDefined();
  });
  it("has venueName column", () => {
    expect(leads.venueName).toBeDefined();
  });
  it("has stage column", () => {
    expect(leads.stage).toBeDefined();
  });
});

// ─── accessGrants ─────────────────────────────────────────────────────────────
describe("Schema: accessGrants table", () => {
  it("has id column", () => {
    expect(accessGrants.id).toBeDefined();
  });
  it("has email column", () => {
    expect(accessGrants.email).toBeDefined();
  });
  it("has role column", () => {
    expect(accessGrants.role).toBeDefined();
  });
});

// ─── feedback ─────────────────────────────────────────────────────────────────
describe("Schema: feedback table", () => {
  it("has id column", () => {
    expect(feedback.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(feedback.coupleId).toBeDefined();
  });
  it("has ratings column (JSON)", () => {
    expect(feedback.ratings).toBeDefined();
  });
});

// ─── canvasObjects ────────────────────────────────────────────────────────────
describe("Schema: canvasObjects table", () => {
  it("has id column", () => {
    expect(canvasObjects.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(canvasObjects.coupleId).toBeDefined();
  });
  it("has shape column", () => {
    expect(canvasObjects.shape).toBeDefined();
  });
});

// ─── externalStaff ────────────────────────────────────────────────────────────
describe("Schema: externalStaff table", () => {
  it("has id column", () => {
    expect(externalStaff.id).toBeDefined();
  });
  it("has name column", () => {
    expect(externalStaff.name).toBeDefined();
  });
  it("has role column", () => {
    expect(externalStaff.role).toBeDefined();
  });
});

// ─── tables (seatingTables) ───────────────────────────────────────────────────
describe("Schema: seatingTables table", () => {
  it("has id column", () => {
    expect(tables.id).toBeDefined();
  });
  it("has coupleId column", () => {
    expect(tables.coupleId).toBeDefined();
  });
  it("has label column", () => {
    expect(tables.label).toBeDefined();
  });
  it("has capacity column", () => {
    expect(tables.capacity).toBeDefined();
  });
});

// ─── Relations — structural checks ───────────────────────────────────────────
import {
  venuesRelations,
  couplesRelations,
  weddingsRelations,
  guestsRelations,
  budgetItemsRelations,
  photosRelations,
  familyAccessRelations,
  toolSettingsRelations,
  feedbackRelations,
  messagesRelations,
  externalStaffRelations,
} from "../drizzle/relations";

describe("Relations: structural existence", () => {
  it("venuesRelations is defined", () => {
    expect(venuesRelations).toBeDefined();
  });
  it("couplesRelations is defined", () => {
    expect(couplesRelations).toBeDefined();
  });
  it("weddingsRelations is defined", () => {
    expect(weddingsRelations).toBeDefined();
  });
  it("guestsRelations is defined", () => {
    expect(guestsRelations).toBeDefined();
  });
  it("budgetItemsRelations is defined", () => {
    expect(budgetItemsRelations).toBeDefined();
  });
  it("photosRelations is defined", () => {
    expect(photosRelations).toBeDefined();
  });
  it("familyAccessRelations is defined", () => {
    expect(familyAccessRelations).toBeDefined();
  });
  it("toolSettingsRelations is defined", () => {
    expect(toolSettingsRelations).toBeDefined();
  });
  it("feedbackRelations is defined", () => {
    expect(feedbackRelations).toBeDefined();
  });
  it("messagesRelations is defined", () => {
    expect(messagesRelations).toBeDefined();
  });
  it("externalStaffRelations is defined", () => {
    expect(externalStaffRelations).toBeDefined();
  });
});

// ─── Type inference — $inferSelect / $inferInsert ─────────────────────────────
import type {
  User, InsertUser,
  Venue, InsertVenue,
  Couple, InsertCouple,
  Guest, InsertGuest,
  Wedding, InsertWedding,
  Message, InsertMessage,
  BudgetItem, InsertBudgetItem,
  Photo, InsertPhoto,
  Vendor, InsertVendor,
} from "../drizzle/schema";

describe("Type inference: $inferSelect shapes", () => {
  it("User type has id, openId, email, role", () => {
    const user: User = {
      id: 1,
      openId: "abc",
      name: "Test",
      email: "test@test.com",
      loginMethod: "google",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    expect(user.id).toBe(1);
    expect(user.role).toBe("user");
  });

  it("Venue type has id, userId, name, plan, subStatus", () => {
    const venue: Venue = {
      id: 1,
      userId: 1,
      name: "אולם הגן",
      region: null,
      contact: null,
      phone: null,
      email: null,
      plan: "basic",
      billingCycle: "monthly",
      subStatus: "trial",
      trialEndsAt: null,
      coupleAccess: "free",
      resellPrice: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(venue.name).toBe("אולם הגן");
    expect(venue.subStatus).toBe("trial");
  });

  it("Couple type has name1, name2, type (gender-neutral)", () => {
    const couple: Partial<Couple> = {
      name1: "שם 1",
      name2: "שם 2",
      type: "independent",
    };
    expect(couple.name1).toBe("שם 1");
    expect(couple.name2).toBe("שם 2");
    expect(couple.type).toBe("independent");
  });

  it("Guest type has rsvpStatus enum values", () => {
    const guest: Partial<Guest> = {
      rsvpStatus: "pending",
    };
    expect(["pending", "yes", "no", "maybe"]).toContain(guest.rsvpStatus);
  });

  it("Message type has conversationType enum values", () => {
    const msg: Partial<Message> = {
      conversationType: "venue_couple",
    };
    expect(["venue_couple", "couple_vendor", "venue_vendor"]).toContain(msg.conversationType);
  });

  it("InsertCouple requires name1 and name2", () => {
    const insert: InsertCouple = {
      userId: 1,
      name1: "שם 1",
      name2: "שם 2",
    };
    expect(insert.name1).toBeDefined();
    expect(insert.name2).toBeDefined();
  });

  it("InsertVenue requires userId and name", () => {
    const insert: InsertVenue = {
      userId: 1,
      name: "אולם",
    };
    expect(insert.userId).toBe(1);
    expect(insert.name).toBe("אולם");
  });

  it("InsertMessage requires conversationType, conversationId, senderId, content", () => {
    const insert: InsertMessage = {
      conversationType: "venue_couple",
      conversationId: "wedding_1",
      senderId: 1,
      content: "שלום",
    };
    expect(insert.conversationType).toBe("venue_couple");
    expect(insert.content).toBe("שלום");
  });
});
