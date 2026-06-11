import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Couple,
  InsertCouple,
  InsertMessage,
  InsertUser,
  InsertVenue,
  InsertVenueShare,
  InsertWedding,
  Message,
  User,
  Venue,
  VenueShare,
  Wedding,
  couples,
  messages,
  users,
  venueShares,
  venues,
  weddings,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Venues ───────────────────────────────────────────────────────────────────

export async function getVenueByUserId(userId: number): Promise<Venue | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(venues).where(eq(venues.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getVenueById(id: number): Promise<Venue | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createVenue(data: InsertVenue): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(venues).values(data);
  // @ts-ignore — insertId exists on mysql2 result
  return result[0].insertId as number;
}

export async function updateVenue(id: number, data: Partial<InsertVenue>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(venues).set(data).where(eq(venues.id, id));
}

// ─── Couples ─────────────────────────────────────────────────────────────────

export async function getCoupleByUserId(userId: number): Promise<Couple | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(couples).where(eq(couples.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getCoupleById(id: number): Promise<Couple | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(couples).where(eq(couples.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCouple(data: InsertCouple): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(couples).values(data);
  // @ts-ignore — insertId exists on mysql2 result
  return result[0].insertId as number;
}

export async function updateCouple(id: number, data: Partial<InsertCouple>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(couples).set(data).where(eq(couples.id, id));
}

// ─── Weddings ─────────────────────────────────────────────────────────────────

/**
 * Create a new wedding for a venue.
 * Generates a unique inviteToken for the couple's invite link.
 */
export async function createWedding(data: InsertWedding): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(weddings).values(data);
  // @ts-ignore — insertId exists on mysql2 result
  return result[0].insertId as number;
}

/**
 * Get all weddings for a venue, ordered by date ascending.
 */
export async function getWeddingsByVenueId(venueId: number): Promise<Wedding[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weddings).where(eq(weddings.venueId, venueId));
}

/**
 * Get a single wedding by its invite token (public — no auth required).
 * Used by the couple's invite link: /join/[token]
 */
export async function getWeddingByToken(token: string): Promise<Wedding | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(weddings)
    .where(eq(weddings.inviteToken, token))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get a wedding by its ID.
 */
export async function getWeddingById(id: number): Promise<Wedding | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(weddings).where(eq(weddings.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Link a couple to a wedding and mark them as venue_linked.
 * Called when a couple clicks their invite link and confirms.
 *
 * Iron rules enforced here:
 * 1. assignmentLocked check — if already locked, reject
 * 2. couple.type is set to venue_linked (automatic, not by user choice)
 * 3. couple.venueId is set to the wedding's venue
 */
export async function acceptWeddingInvite(
  weddingId: number,
  coupleId: number,
  venueId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check assignment lock
  const couple = await getCoupleById(coupleId);
  if (!couple) throw new Error("Couple not found");
  if (couple.assignmentLocked) {
    throw new Error("ASSIGNMENT_LOCKED");
  }

  // Check if wedding already has a couple
  const wedding = await getWeddingById(weddingId);
  if (!wedding) throw new Error("Wedding not found");
  if (wedding.coupleId && wedding.coupleId !== coupleId) {
    throw new Error("WEDDING_ALREADY_LINKED");
  }

  // Link couple → wedding
  await db
    .update(weddings)
    .set({ coupleId })
    .where(and(eq(weddings.id, weddingId), eq(weddings.venueId, venueId)));

  // Update couple: type = venue_linked, venueId set
  await db
    .update(couples)
    .set({ type: "venue_linked", venueId })
    .where(eq(couples.id, coupleId));
}

// ─── Messages ──────────────────────────────────────────────────────────────

export async function createMessage(data: InsertMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  // @ts-ignore — insertId exists on mysql2 result
  return result[0].insertId as number;
}

/**
 * Get messages for a conversation.
 * conversationId format: "wedding_{weddingId}" for venue↔couple chat
 */
export async function getMessagesByConversation(
  conversationId: string,
  conversationType: Message["conversationType"]
): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.conversationType, conversationType)
      )
    );
}

// ─── Account Context ──────────────────────────────────────────────────────────

export async function getAccountContext(userId: number, userRole: string) {
  if (userRole === 'admin') {
    return { accountType: 'admin' as const };
  }

  const venue = await getVenueByUserId(userId);
  if (venue) {
    return { accountType: 'venue' as const, venue };
  }

  const couple = await getCoupleByUserId(userId);
  if (couple) {
    return { accountType: 'couple' as const, couple };
  }

  return { accountType: 'new' as const };
}

// ─── Venue Shares ─────────────────────────────────────────────────────────────

/**
 * Create a venue share for an independent couple.
 * Generates a unique shareToken for the read-only URL.
 */
export async function createVenueShare(data: InsertVenueShare): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(venueShares).values(data);
  // @ts-ignore — insertId exists on mysql2 result
  return result[0].insertId as number;
}

/**
 * Get a venue share by its token (public — no auth required).
 * Returns null if not found or revoked.
 */
export async function getVenueShareByToken(token: string): Promise<VenueShare | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(venueShares)
    .where(and(eq(venueShares.shareToken, token), eq(venueShares.revoked, false)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get all venue shares for a couple (including revoked).
 */
export async function getVenueSharesByCoupleId(coupleId: number): Promise<VenueShare[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(venueShares).where(eq(venueShares.coupleId, coupleId));
}

/**
 * Revoke a venue share — couple can call this at any time.
 */
export async function revokeVenueShare(id: number, coupleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(venueShares)
    .set({ revoked: true })
    .where(and(eq(venueShares.id, id), eq(venueShares.coupleId, coupleId)));
}

/**
 * Update shared sections for a venue share.
 */
export async function updateVenueShare(id: number, coupleId: number, data: Partial<InsertVenueShare>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(venueShares)
    .set(data)
    .where(and(eq(venueShares.id, id), eq(venueShares.coupleId, coupleId)));
}

// ─── Guests ───────────────────────────────────────────────────────────────────

import {
  BudgetItem,
  Guest,
  InsertBudgetItem,
  InsertGuest,
  InsertPhoto,
  InsertSeatingTable,
  Photo,
  SeatingTable,
  budgetItems,
  guests,
  photos,
  tables as seatingTables,
} from "../drizzle/schema";

export async function getGuestsByCoupleId(coupleId: number): Promise<Guest[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guests).where(eq(guests.coupleId, coupleId));
}

export async function getGuestById(id: number): Promise<Guest | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createGuest(data: InsertGuest): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(guests).values(data);
  // @ts-ignore
  return result[0].insertId as number;
}

export async function updateGuest(id: number, coupleId: number, data: Partial<InsertGuest>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(guests).set(data).where(and(eq(guests.id, id), eq(guests.coupleId, coupleId)));
}

export async function deleteGuest(id: number, coupleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { sql } = await import("drizzle-orm");
  await db.delete(guests).where(and(eq(guests.id, id), eq(guests.coupleId, coupleId)));
}

// ─── Seating Tables ───────────────────────────────────────────────────────────

export async function getTablesByCoupleId(coupleId: number): Promise<SeatingTable[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seatingTables).where(eq(seatingTables.coupleId, coupleId));
}

export async function createTable(data: InsertSeatingTable): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(seatingTables).values(data);
  // @ts-ignore
  return result[0].insertId as number;
}

export async function updateTable(id: number, coupleId: number, data: Partial<InsertSeatingTable>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(seatingTables).set(data).where(and(eq(seatingTables.id, id), eq(seatingTables.coupleId, coupleId)));
}

export async function deleteTable(id: number, coupleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(seatingTables).where(and(eq(seatingTables.id, id), eq(seatingTables.coupleId, coupleId)));
}

// ─── Budget Items ─────────────────────────────────────────────────────────────

export async function getBudgetItemsByCoupleId(coupleId: number): Promise<BudgetItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(budgetItems).where(eq(budgetItems.coupleId, coupleId));
}

export async function createBudgetItem(data: InsertBudgetItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(budgetItems).values(data);
  // @ts-ignore
  return result[0].insertId as number;
}

export async function updateBudgetItem(id: number, coupleId: number, data: Partial<InsertBudgetItem>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(budgetItems).set(data).where(and(eq(budgetItems.id, id), eq(budgetItems.coupleId, coupleId)));
}

export async function deleteBudgetItem(id: number, coupleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(budgetItems).where(and(eq(budgetItems.id, id), eq(budgetItems.coupleId, coupleId)));
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function getPhotosByCoupleId(coupleId: number): Promise<Photo[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(photos).where(eq(photos.coupleId, coupleId));
}

export async function createPhoto(data: InsertPhoto): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(photos).values(data);
  // @ts-ignore
  return result[0].insertId as number;
}

export async function deletePhoto(id: number, coupleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(photos).where(and(eq(photos.id, id), eq(photos.coupleId, coupleId)));
}

// ─── Admin (VEYA HQ) ──────────────────────────────────────────────────────────

import {
  Lead,
  InsertLead,
  AccessGrant,
  InsertAccessGrant,
  leads,
  accessGrants,
  subscriptions,
} from "../drizzle/schema";

export async function adminListVenues(): Promise<Venue[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(venues).orderBy(venues.createdAt);
}

export async function adminListCouples(): Promise<Couple[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(couples).orderBy(couples.createdAt);
}

export async function adminUpdateVenueStatus(
  venueId: number,
  subStatus: "trial" | "active" | "locked" | "cancelled",
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(venues).set({ subStatus }).where(eq(venues.id, venueId));
}

export async function adminGetStats(): Promise<{
  totalVenues: number;
  activeVenues: number;
  trialVenues: number;
  lockedVenues: number;
  totalCouples: number;
  venueLinkedCouples: number;
  independentCouples: number;
  totalWeddings: number;
}> {
  const db = await getDb();
  if (!db) return {
    totalVenues: 0, activeVenues: 0, trialVenues: 0, lockedVenues: 0,
    totalCouples: 0, venueLinkedCouples: 0, independentCouples: 0, totalWeddings: 0,
  };
  const allVenues = await db.select().from(venues);
  const allCouples = await db.select().from(couples);
  const allWeddings = await db.select().from(weddings);
  return {
    totalVenues: allVenues.length,
    activeVenues: allVenues.filter(v => v.subStatus === "active").length,
    trialVenues: allVenues.filter(v => v.subStatus === "trial").length,
    lockedVenues: allVenues.filter(v => v.subStatus === "locked").length,
    totalCouples: allCouples.length,
    venueLinkedCouples: allCouples.filter(c => c.type === "venue_linked").length,
    independentCouples: allCouples.filter(c => c.type === "independent").length,
    totalWeddings: allWeddings.length,
  };
}

// Leads (CRM)
export async function adminListLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(leads.createdAt);
}

export async function adminCreateLead(data: InsertLead): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(data);
  // @ts-ignore
  return result[0].insertId as number;
}

export async function adminUpdateLead(
  id: number,
  data: Partial<InsertLead>,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function adminDeleteLead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leads).where(eq(leads.id, id));
}

// Access Grants
export async function adminListAccessGrants(): Promise<AccessGrant[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessGrants).orderBy(accessGrants.createdAt);
}

export async function adminCreateAccessGrant(data: InsertAccessGrant): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accessGrants).values(data);
  // @ts-ignore
  return result[0].insertId as number;
}

export async function adminUpdateAccessGrant(
  id: number,
  data: Partial<InsertAccessGrant>,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(accessGrants).set(data).where(eq(accessGrants.id, id));
}
