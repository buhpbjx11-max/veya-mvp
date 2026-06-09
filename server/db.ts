import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Couple,
  InsertCouple,
  InsertUser,
  InsertVenue,
  User,
  Venue,
  couples,
  users,
  venues,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
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

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

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

/**
 * Get the venue linked to a user account.
 * Returns null if the user has no venue (not a venue account).
 */
export async function getVenueByUserId(userId: number): Promise<Venue | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(venues).where(eq(venues.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Create a new venue and link it to a user account.
 */
export async function createVenue(data: InsertVenue): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(venues).values(data);
  // @ts-ignore — insertId exists on mysql2 result
  return result[0].insertId as number;
}

/**
 * Update a venue record.
 */
export async function updateVenue(id: number, data: Partial<InsertVenue>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(venues).set(data).where(eq(venues.id, id));
}

// ─── Couples ─────────────────────────────────────────────────────────────────

/**
 * Get the couple linked to a user account.
 * Returns null if the user has no couple record.
 */
export async function getCoupleByUserId(userId: number): Promise<Couple | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(couples).where(eq(couples.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Create a new couple record.
 */
export async function createCouple(data: InsertCouple): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(couples).values(data);
  // @ts-ignore — insertId exists on mysql2 result
  return result[0].insertId as number;
}

/**
 * Update a couple record.
 */
export async function updateCouple(id: number, data: Partial<InsertCouple>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(couples).set(data).where(eq(couples.id, id));
}

/**
 * Get account context for a user — determines which dashboard to show.
 * Returns: { accountType: 'admin' | 'venue' | 'couple' | 'new', venue?, couple? }
 */
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
