import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * VEYA MVP — Database Schema
 * Based on VEYA-SPEC.md §7.2 and VEYA-knowledge-full.md
 * Updated: June 2026
 *
 * Iron rules:
 * 1. Gender-neutral: name1/name2, never חתן/כלה
 * 2. No white-label — always VEYA brand
 * 3. VEYA does NOT process payments — gift fields are transfer details only
 * 4. No invented prices — all amounts from VEYA-knowledge-full.md
 * 5. assignment_locked — only Bar (VEYA HQ) can change manually
 * 6. couple.type set automatically: venue invite → venue_linked; direct signup → independent
 */

// ─── Users (Auth) ────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /**
   * role: "user" = regular, "admin" = VEYA HQ (Bar only)
   * Venue and couple roles are determined by the venues/couples tables.
   */
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Venues (B2B — אולמות) ───────────────────────────────────────────────────

export const venues = mysqlTable("venues", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id — the venue owner's user account */
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  region: varchar("region", { length: 100 }),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  /**
   * plan: basic=5 weddings/month, business=15, pro=28
   * Prices from VEYA-knowledge-full.md §2
   */
  plan: mysqlEnum("plan", ["basic", "business", "pro"]).notNull().default("basic"),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).notNull().default("monthly"),
  /**
   * sub_status:
   * trial = 14-day free trial
   * active = paying subscriber
   * locked = trial ended without payment / overdue
   * cancelled = cancelled subscription
   */
  subStatus: mysqlEnum("subStatus", ["trial", "active", "locked", "cancelled"])
    .notNull()
    .default("trial"),
  trialEndsAt: timestamp("trialEndsAt"),
  /**
   * coupleAccess: how the venue provides access to couples
   * free = venue pays, couple gets free access (default, recommended)
   * resell = venue charges couple directly; VEYA not involved in that money
   * Note: always VEYA brand — no white-label
   */
  coupleAccess: mysqlEnum("coupleAccess", ["free", "resell"]).notNull().default("free"),
  /** resellPrice: price the venue charges the couple (venue's business, VEYA not involved) */
  resellPrice: decimal("resellPrice", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = typeof venues.$inferInsert;

// ─── Couples (B2C — זוגות) ───────────────────────────────────────────────────

export const couples = mysqlTable("couples", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → users.id — the couple's user account (primary contact logs in) */
  userId: int("userId").notNull(),
  /** Gender-neutral: שם 1 */
  name1: varchar("name1", { length: 255 }).notNull(),
  phone1: varchar("phone1", { length: 20 }),
  /** Gender-neutral: שם 2 */
  name2: varchar("name2", { length: 255 }).notNull(),
  phone2: varchar("phone2", { length: 20 }),
  /** primaryContact: 1 = name1 is primary, 2 = name2 is primary */
  primaryContact: mysqlEnum("primaryContact", ["1", "2"]).notNull().default("1"),
  email: varchar("email", { length: 320 }),
  weddingDate: timestamp("weddingDate"),
  /**
   * type: set automatically — NEVER by the couple
   * venue_linked = arrived via venue invite link
   * independent = signed up directly
   * Only Bar (VEYA HQ) can override manually
   */
  type: mysqlEnum("type", ["venue_linked", "independent"]).notNull().default("independent"),
  /** FK → venues.id — null for independent couples */
  venueId: int("venueId"),
  /**
   * assignmentLocked: only Bar can change this
   * When true, automatic re-assignment is blocked; Bar can still change manually
   */
  assignmentLocked: boolean("assignmentLocked").notNull().default(false),
  /**
   * plan: base = ₪299 one-time (500 photos, 2GB, 2 months storage)
   *       premium = +₪199 (unlimited photos, 10GB, 6 months storage)
   * No storage extensions — from VEYA-knowledge-full.md §1
   */
  plan: mysqlEnum("plan", ["base", "premium"]).notNull().default("base"),
  /**
   * storageStatus:
   * active = within storage period
   * readonly = storage period ended, export only
   * deleted = all data deleted
   */
  storageStatus: mysqlEnum("storageStatus", ["active", "readonly", "deleted"])
    .notNull()
    .default("active"),
  /** deleteAt: scheduled deletion date (2 months after wedding for base, 6 for premium) */
  deleteAt: timestamp("deleteAt"),
  /**
   * sideLabels: JSON array [label for side 1, label for side 2]
   * e.g. ["צד עדן", "צד נועה"] — set by couple, gender-neutral
   */
    sideLabels: json("sideLabels").$type<[string, string]>(),
  /**
   * giftSettings: JSON — transfer details shown to guests on the gift page
   * VEYA does NOT process payments — these are display-only fields
   */
  /**
   * photoQrToken: unique token for guest photo upload QR code
   * Guests scan this QR to upload photos without an account
   */
  photoQrToken: varchar("photoQrToken", { length: 64 }).unique(),
  giftSettings: json("giftSettings").$type<{
    displayName?: string;
    bankAccount?: string;   // e.g. "בנק לאומי · 10-805-432109"
    bitPhone?: string;      // e.g. "050-432-1246"
    payboxUser?: string;    // e.g. "@morAviv-wedding"
    paypalEmail?: string;
    thankYouMessage?: string;
    enabledMethods?: string[]; // ["bit","bank","paybox","paypal"]
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Couple = typeof couples.$inferSelect;
export type InsertCouple = typeof couples.$inferInsert;

// ─── Guests (אורחים) ─────────────────────────────────────────────────────────

export const guests = mysqlTable("guests", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → couples.id */
  coupleId: int("coupleId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  /** count: number of people this guest entry represents */
  count: int("count").notNull().default(1),
  /**
   * side: which side of the couple this guest belongs to
   * Stored as free text matching couple's sideLabels, or "shared"
   */
  side: varchar("side", { length: 100 }),
  /** group: e.g. משפחה/חברים/עבודה */
  group: varchar("group", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  rsvpStatus: mysqlEnum("rsvpStatus", ["pending", "yes", "no", "maybe"])
    .notNull()
    .default("pending"),
  /**
   * diet: JSON object with meal preferences and allergies
   * e.g. { type: "vegan", allergies: "אגוזים", childMeal: false }
   * Flows automatically to venue's chef report (SPEC §7.1 point 6)
   */
  diet: json("diet").$type<{
    type?: "regular" | "vegetarian" | "vegan" | "child";
    allergies?: string;
  }>(),
  /** FK → tables.id — null until seated */
  tableId: int("tableId"),
  /**
   * giftAmount: amount guest reported sending (NOT processed by VEYA)
   * Guest transfers directly to couple via Bit/PayBox/bank
   */
  giftAmount: decimal("giftAmount", { precision: 10, scale: 2 }),
  giftNote: text("giftNote"),
  /** thanked: couple has sent thank-you to this guest */
  thanked: boolean("thanked").notNull().default(false),
  /** inviteToken: unique token for guest's personal link (no password needed) */
  inviteToken: varchar("inviteToken", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;

// ─── Tables (שולחנות הושבה) ───────────────────────────────────────────────────

export const tables = mysqlTable("seatingTables", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → couples.id */
  coupleId: int("coupleId").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  capacity: int("capacity").notNull().default(10),
  shape: mysqlEnum("shape", ["round", "rect", "couple"]).notNull().default("round"),
  /** tableNumber: display number (null for couple table) */
  tableNumber: int("tableNumber"),
  /** name: optional table name */
  name: varchar("name", { length: 100 }),
  /** customW, customH: manual resize override (null = auto-calculated) */
  customW: decimal("customW", { precision: 8, scale: 2 }),
  customH: decimal("customH", { precision: 8, scale: 2 }),
  /** x, y: position on seating canvas */
  x: decimal("x", { precision: 8, scale: 2 }).notNull().default("0"),
  y: decimal("y", { precision: 8, scale: 2 }).notNull().default("0"),
  /** w, h: dimensions on seating canvas */
  w: decimal("w", { precision: 8, scale: 2 }).notNull().default("100"),
  h: decimal("h", { precision: 8, scale: 2 }).notNull().default("100"),
  rotation: decimal("rotation", { precision: 6, scale: 2 }).notNull().default("0"),
  /** assignedGuests: JSON array of guest IDs seated at this table */
  assignedGuests: json("assignedGuests").$type<number[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeatingTable = typeof tables.$inferSelect;
export type InsertSeatingTable = typeof tables.$inferInsert;

// ─── Canvas Objects (במה / בר / עמוד / אובייקטים על הקנבס) ──────────────────
export const canvasObjects = mysqlTable("canvasObjects", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  shape: mysqlEnum("shape", ["rect", "circle"]).notNull().default("rect"),
  name: varchar("name", { length: 100 }),
  x: decimal("x", { precision: 8, scale: 2 }).notNull().default("0"),
  y: decimal("y", { precision: 8, scale: 2 }).notNull().default("0"),
  w: decimal("w", { precision: 8, scale: 2 }).notNull().default("160"),
  h: decimal("h", { precision: 8, scale: 2 }).notNull().default("70"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CanvasObject = typeof canvasObjects.$inferSelect;
export type InsertCanvasObject = typeof canvasObjects.$inferInsert;

// ─── Seating Venue Frame (מסגרת אולם) ─────────────────────────────────────────
export const seatingVenueFrame = mysqlTable("seatingVenueFrame", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull().unique(),
  widthM: int("widthM").notNull().default(20),
  heightM: int("heightM").notNull().default(30),
  x: decimal("x", { precision: 8, scale: 2 }).notNull().default("0"),
  y: decimal("y", { precision: 8, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SeatingVenueFrame = typeof seatingVenueFrame.$inferSelect;

// ─── Vendors (ספקים) ─────────────────────────────────────────────────────────

export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  /**
   * ownerType: who owns this vendor record
   * venue = venue's vendor (chef, DJ, security, etc.)
   * couple = couple's vendor (photographer, band, etc.)
   */
  ownerType: mysqlEnum("ownerType", ["venue", "couple"]).notNull(),
  /** ownerId: FK → venues.id or couples.id depending on ownerType */
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  /** category: e.g. צלם/DJ/קייטרינג/פרחים/תאורה */
  category: varchar("category", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  /** contact: email, WhatsApp, or other contact info */
  contact: varchar("contact", { length: 320 }),
  status: varchar("status", { length: 50 }).default("active"),
  /** recommended: venue can mark vendors as recommended for couples */
  recommended: boolean("recommended").notNull().default(false),
  /** docs: JSON array of document references { type, fileKey, status } */
  docs: json("docs").$type<Array<{ type: string; fileKey: string; status: string }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

// ─── Weddings / Events (חתונות — ישות מרכזית) ────────────────────────────────

export const weddings = mysqlTable("weddings", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → venues.id — the venue hosting this wedding */
  venueId: int("venueId").notNull(),
  /** FK → couples.id — null until couple is linked */
  coupleId: int("coupleId"),
  date: timestamp("date"),
  /**
   * status:
   * prep = in preparation
   * active = wedding day
   * done = completed
   */
  status: mysqlEnum("status", ["prep", "active", "done"]).notNull().default("prep"),
  /** balanceDue: amount couple still owes the venue */
  balanceDue: decimal("balanceDue", { precision: 10, scale: 2 }).default("0"),
  /**
   * timeline: JSON array of timeline events
   * e.g. [{ time: "18:00", label: "הקמה", addedBy: "venue" }]
   * Venue sets skeleton, couple adds their own items
   */
  timeline: json("timeline").$type<
    Array<{ time: string; label: string; addedBy: "venue" | "couple" }>
  >(),
  /**
   * documents: JSON array of document references
   * { type, fileKey, status, signed, signedAt }
   */
  documents: json("documents").$type<
    Array<{
      type: string;
      fileKey: string;
      status: string;
      signed: boolean;
      signedAt?: string;
    }>
  >(),
  /**
   * inviteToken: unique token for couple's invite link
   * Venue sends this to couple → couple clicks → auto-linked as venue_linked
   */
  inviteToken: varchar("inviteToken", { length: 64 }).unique(),
  /** guestPhotoUploadClosedAt: 2 weeks after wedding, guest photo upload closes */
  guestPhotoUploadClosedAt: timestamp("guestPhotoUploadClosedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wedding = typeof weddings.$inferSelect;
export type InsertWedding = typeof weddings.$inferInsert;

// ─── Subscriptions (מנויים) ───────────────────────────────────────────────────

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → venues.id */
  venueId: int("venueId").notNull(),
  plan: mysqlEnum("plan", ["basic", "business", "pro"]).notNull(),
  /**
   * monthlyAmount: actual amount charged per month
   * For yearly billing: effective monthly rate (12% discount applied)
   * Values from VEYA-knowledge-full.md §2
   */
  monthlyAmount: decimal("monthlyAmount", { precision: 10, scale: 2 }).notNull(),
  nextBillingAt: timestamp("nextBillingAt"),
  /** auto: whether automatic billing is enabled */
  auto: boolean("auto").notNull().default(true),
  status: mysqlEnum("status", ["active", "paused", "cancelled"]).notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Invoices (חשבוניות) ──────────────────────────────────────────────────────

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  /** Formatted invoice number e.g. "VEYA-2026-001" */
  number: varchar("number", { length: 50 }).notNull().unique(),
  /** FK → venues.id */
  venueId: int("venueId").notNull(),
  plan: mysqlEnum("plan", ["basic", "business", "pro"]).notNull(),
  /** amount: pre-VAT amount */
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  /** vat: VAT amount (17% in Israel) */
  vat: decimal("vat", { precision: 10, scale: 2 }).notNull(),
  /** total: amount + vat */
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue"]).notNull().default("draft"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── Leads (CRM — לידים) ─────────────────────────────────────────────────────

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  venueName: varchar("venueName", { length: 255 }),
  contact: varchar("contact", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  /**
   * source: how this lead arrived
   * contact_form = from website contact form (auto-created)
   * manual = Bar created manually
   * outreach = Bar initiated outreach
   */
  source: mysqlEnum("source", ["contact_form", "manual", "outreach"])
    .notNull()
    .default("manual"),
  /**
   * stage: CRM pipeline stage
   * lead → meeting → proposal → closed
   */
  stage: mysqlEnum("stage", ["lead", "meeting", "proposal", "closed"])
    .notNull()
    .default("lead"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Access Grants (גישות HQ — עו"ד/רו"ח/יועץ מס) ────────────────────────────

export const accessGrants = mysqlTable("access_grants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  /**
   * role: type of external access
   * legal = עורך דין
   * cpa = רואה חשבון
   * tax = יועץ מס
   */
  role: mysqlEnum("role", ["legal", "cpa", "tax"]).notNull(),
  /** scope: which area/module this grant applies to */
  scope: varchar("scope", { length: 255 }),
  permission: mysqlEnum("permission", ["view", "download", "edit"]).notNull().default("view"),
  status: mysqlEnum("status", ["pending", "active", "revoked"]).notNull().default("pending"),
  /** approvedByBar: only Bar (VEYA HQ admin) can grant access */
  approvedByBar: boolean("approvedByBar").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccessGrant = typeof accessGrants.$inferSelect;
export type InsertAccessGrant = typeof accessGrants.$inferInsert;

// ─── Documents (מסמכים) ───────────────────────────────────────────────────────

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  /**
   * ownerType: who owns this document
   * venue = venue document (contract with couple, etc.)
   * couple = couple document
   * platform = VEYA platform document (terms, etc.)
   */
  ownerType: mysqlEnum("ownerType", ["venue", "couple", "platform"]).notNull(),
  /** ownerId: FK → venues.id or couples.id depending on ownerType */
  ownerId: int("ownerId"),
  /** type: e.g. contract/invoice/terms/id */
  type: varchar("type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("active"),
  /** fileKey: S3 storage key */
  fileKey: varchar("fileKey", { length: 500 }),
  /** signed: whether this document has been digitally signed */
  signed: boolean("signed").notNull().default(false),
  signedAt: timestamp("signedAt"),
  /** signatureData: JSON with signature metadata */
  signatureData: json("signatureData").$type<{
    signedBy?: string;
    method?: "handwritten" | "typed";
    ipAddress?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Feedback (משוב לאחר חתונה) ──────────────────────────────────────────────

export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → couples.id */
  coupleId: int("coupleId").notNull(),
  /** FK → venues.id — null for independent couples */
  venueId: int("venueId"),
  /**
   * ratings: JSON object with category ratings
   * e.g. { overall: 5, venue: 4, service: 5, food: 4, coordination: 5 }
   * Sent automatically 1 week after wedding (SPEC §7.1 point 7)
   */
  ratings: json("ratings").$type<Record<string, number>>(),
  /** systemFeedback: free-text feedback about the VEYA platform */
  systemFeedback: text("systemFeedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

// ─── Family Access (גישת בני משפחה) ──────────────────────────────────────────

export const familyAccess = mysqlTable("family_access", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → couples.id */
  coupleId: int("coupleId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  /**
   * accessLevel:
   * view_only = can see planning, cannot edit
   * limited_edit = can edit only the assigned area
   */
  accessLevel: mysqlEnum("accessLevel", ["view_only", "limited_edit"])
    .notNull()
    .default("view_only"),
  /** assignedArea: for limited_edit — which area they can edit (e.g. "guests_side1") */
  assignedArea: varchar("assignedArea", { length: 100 }),
  /** inviteToken: unique token for family member's access link */
  inviteToken: varchar("inviteToken", { length: 64 }).unique(),
  status: mysqlEnum("status", ["pending", "active", "revoked"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FamilyAccess = typeof familyAccess.$inferSelect;
export type InsertFamilyAccess = typeof familyAccess.$inferInsert;

// ─── Budget Items (תקציב) ─────────────────────────────────────────────────────

export const budgetItems = mysqlTable("budget_items", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → couples.id */
  coupleId: int("coupleId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  /** estimatedAmount: planned budget for this item */
  estimatedAmount: decimal("estimatedAmount", { precision: 10, scale: 2 }),
  /** actualAmount: actual amount paid */
  actualAmount: decimal("actualAmount", { precision: 10, scale: 2 }),
  paid: boolean("paid").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;

// ─── Photos (תמונות) ──────────────────────────────────────────────────────────

export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → couples.id */
  coupleId: int("coupleId").notNull(),
  /** fileKey: S3 storage key */
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  /** url: served URL */
  url: varchar("url", { length: 1000 }).notNull(),
  /** uploadedBy: "couple" or guest invite token */
  uploadedBy: varchar("uploadedBy", { length: 100 }).notNull().default("couple"),
  /** guestId: FK → guests.id if uploaded by a guest */
  guestId: int("guestId"),
  caption: text("caption"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// ─── Messages / Chat (הודעות) ─────────────────────────────────────────────────

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  /**
   * conversationType: type of conversation
   * venue_couple = between venue and couple (only for venue_linked couples)
   * couple_vendor = between couple and their vendor
   * venue_vendor = between venue and their vendor
   */
  conversationType: mysqlEnum("conversationType", [
    "venue_couple",
    "couple_vendor",
    "venue_vendor",
  ]).notNull(),
  /** conversationId: composite key (e.g. "wedding_123" or "vendor_456") */
  conversationId: varchar("conversationId", { length: 100 }).notNull(),
  /** senderId: FK → users.id */
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 255 }),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── External Staff (צוות חיצוני — שף/DJ/אבטחה) ────────────────────────────────
// External staff are NOT users — they receive reports via WhatsApp/email without login.
// They belong to a venue and optionally to a specific wedding.

export const externalStaff = mysqlTable("external_staff", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → venues.id — the venue this staff member belongs to */
  venueId: int("venueId").notNull(),
  /**
   * weddingId: FK → weddings.id — optional, if assigned to a specific wedding
   * null = belongs to venue generally (available for all weddings)
   */
  weddingId: int("weddingId"),
  name: varchar("name", { length: 255 }).notNull(),
  /**
   * role: staff role
   * e.g. שף/DJ/אבטחה/מלצרות/תאורה/קייטרינג
   * Free text to allow flexibility
   */
  role: varchar("role", { length: 100 }).notNull(),
  /** whatsapp: WhatsApp number for sending reports */
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  /**
   * receiveReports: whether this staff member receives automated reports
   * Chef report sent automatically on wedding morning (SPEC §7.1 point 8)
   */
  receiveReports: boolean("receiveReports").notNull().default(true),
  /**
   * reportTypes: JSON array of report types this staff member receives
   * e.g. ["chef_report", "staff_schedule", "guest_list"]
   */
  reportTypes: json("reportTypes").$type<string[]>(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExternalStaff = typeof externalStaff.$inferSelect;
export type InsertExternalStaff = typeof externalStaff.$inferInsert;

// ─── Tool Settings (הגדרות כלים — כיבוי/הדלקה ע"י הזוג) ─────────────────────

export const toolSettings = mysqlTable("tool_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → couples.id */
  coupleId: int("coupleId").notNull(),
  /**
   * toolName: identifier for the tool
   * e.g. "guests", "seating", "budget", "photos", "gifts", "signature"
   */
  toolName: varchar("toolName", { length: 100 }).notNull(),
  /** enabled: couple can toggle tools on/off for personal organization */
  enabled: boolean("enabled").notNull().default(true),
  /** sortOrder: position in sidebar (disabled tools pushed to end) */
  sortOrder: int("sortOrder").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ToolSetting = typeof toolSettings.$inferSelect;
export type InsertToolSetting = typeof toolSettings.$inferInsert;

// ─── Venue Shares (שיתוף עם האולם — רק לזוג independent) ─────────────────────
/**
 * venue_shares: allows an independent couple to share a read-only view
 * of their wedding data with their venue (without giving the venue edit access).
 *
 * Iron rules:
 * - Only independent couples can create venue shares (venue_linked don't need this)
 * - The venue gets a read-only token link — zero edit capability
 * - The couple controls what sections are shared (checklist)
 * - The couple can revoke at any time
 * - Live data: the venue always sees the current state
 */
export const venueShares = mysqlTable("venue_shares", {
  id: int("id").autoincrement().primaryKey(),
  /** FK → couples.id — the independent couple who created this share */
  coupleId: int("coupleId").notNull(),
  /** Venue contact info (not a VEYA account — just contact details) */
  venueName: varchar("venueName", { length: 255 }).notNull(),
  venuePhone: varchar("venuePhone", { length: 20 }),
  venueWhatsapp: varchar("venueWhatsapp", { length: 20 }),
  /**
   * sharedSections: which sections the couple chose to share
   * {
   *   guests: boolean,   — RSVP summary (confirmed/pending/declined/total)
   *   meals: boolean,    — meal types & dietary breakdown
   *   seating: boolean,  — seating chart (locked, read-only)
   *   schedule: boolean, — wedding day timeline (optional)
   *   vendors: boolean,  — vendor contact list (optional)
   * }
   */
  sharedSections: json("sharedSections")
    .$type<{
      guests: boolean;
      meals: boolean;
      seating: boolean;
      schedule: boolean;
      vendors: boolean;
    }>()
    .notNull(),
  /**
   * shareToken: unique random token for the read-only URL
   * Format: /venue-view/[shareToken]
   * The venue opens this URL — no login required
   */
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  /** revoked: couple can revoke access at any time */
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VenueShare = typeof venueShares.$inferSelect;
export type InsertVenueShare = typeof venueShares.$inferInsert;
