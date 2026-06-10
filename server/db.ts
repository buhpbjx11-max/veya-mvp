import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Couple,
  InsertCouple,
  InsertUser,
  InsertVenue,
  InsertWedding,
  User,
  Venue,
  Wedding,
  couples,
  users,
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
