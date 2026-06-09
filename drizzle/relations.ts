import { relations } from "drizzle-orm";
import {
  accessGrants,
  budgetItems,
  couples,
  documents,
  externalStaff,
  familyAccess,
  feedback,
  guests,
  invoices,
  leads,
  messages,
  photos,
  subscriptions,
  tables,
  toolSettings,
  users,
  vendors,
  venues,
  weddings,
} from "./schema";

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one }) => ({
  venue: one(venues, {
    fields: [users.id],
    references: [venues.userId],
  }),
  couple: one(couples, {
    fields: [users.id],
    references: [couples.userId],
  }),
}));

// ─── Venues ───────────────────────────────────────────────────────────────────

export const venuesRelations = relations(venues, ({ one, many }) => ({
  user: one(users, {
    fields: [venues.userId],
    references: [users.id],
  }),
  couples: many(couples),
  weddings: many(weddings),
  vendors: many(vendors),
  subscriptions: many(subscriptions),
  invoices: many(invoices),
  feedback: many(feedback),
  externalStaff: many(externalStaff),
}));

// ─── Couples ──────────────────────────────────────────────────────────────────

export const couplesRelations = relations(couples, ({ one, many }) => ({
  user: one(users, {
    fields: [couples.userId],
    references: [users.id],
  }),
  venue: one(venues, {
    fields: [couples.venueId],
    references: [venues.id],
  }),
  wedding: one(weddings, {
    fields: [couples.id],
    references: [weddings.coupleId],
  }),
  guests: many(guests),
  seatingTables: many(tables),
  vendors: many(vendors),
  budgetItems: many(budgetItems),
  photos: many(photos),
  familyAccess: many(familyAccess),
  toolSettings: many(toolSettings),
  feedback: many(feedback),
}));

// ─── Guests ───────────────────────────────────────────────────────────────────

export const guestsRelations = relations(guests, ({ one }) => ({
  couple: one(couples, {
    fields: [guests.coupleId],
    references: [couples.id],
  }),
  table: one(tables, {
    fields: [guests.tableId],
    references: [tables.id],
  }),
}));

// ─── Seating Tables ───────────────────────────────────────────────────────────

export const tablesRelations = relations(tables, ({ one, many }) => ({
  couple: one(couples, {
    fields: [tables.coupleId],
    references: [couples.id],
  }),
  guests: many(guests),
}));

// ─── Vendors ──────────────────────────────────────────────────────────────────

export const vendorsRelations = relations(vendors, ({ one }) => ({
  venue: one(venues, {
    fields: [vendors.ownerId],
    references: [venues.id],
  }),
  couple: one(couples, {
    fields: [vendors.ownerId],
    references: [couples.id],
  }),
}));

// ─── Weddings ─────────────────────────────────────────────────────────────────

export const weddingsRelations = relations(weddings, ({ one, many }) => ({
  venue: one(venues, {
    fields: [weddings.venueId],
    references: [venues.id],
  }),
  couple: one(couples, {
    fields: [weddings.coupleId],
    references: [couples.id],
  }),
  externalStaff: many(externalStaff),
}));

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  venue: one(venues, {
    fields: [subscriptions.venueId],
    references: [venues.id],
  }),
}));

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoicesRelations = relations(invoices, ({ one }) => ({
  venue: one(venues, {
    fields: [invoices.venueId],
    references: [venues.id],
  }),
}));

// ─── Budget Items ─────────────────────────────────────────────────────────────

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  couple: one(couples, {
    fields: [budgetItems.coupleId],
    references: [couples.id],
  }),
}));

// ─── Photos ───────────────────────────────────────────────────────────────────

export const photosRelations = relations(photos, ({ one }) => ({
  couple: one(couples, {
    fields: [photos.coupleId],
    references: [couples.id],
  }),
  guest: one(guests, {
    fields: [photos.guestId],
    references: [guests.id],
  }),
}));

// ─── Family Access ────────────────────────────────────────────────────────────

export const familyAccessRelations = relations(familyAccess, ({ one }) => ({
  couple: one(couples, {
    fields: [familyAccess.coupleId],
    references: [couples.id],
  }),
}));

// ─── Tool Settings ────────────────────────────────────────────────────────────

export const toolSettingsRelations = relations(toolSettings, ({ one }) => ({
  couple: one(couples, {
    fields: [toolSettings.coupleId],
    references: [couples.id],
  }),
}));

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const feedbackRelations = relations(feedback, ({ one }) => ({
  couple: one(couples, {
    fields: [feedback.coupleId],
    references: [couples.id],
  }),
  venue: one(venues, {
    fields: [feedback.venueId],
    references: [venues.id],
  }),
}));

// ─── Leads (no FK relations — standalone CRM) ─────────────────────────────────
// leads table has no foreign key relations; Bar manages them manually

// ─── Access Grants (no FK relations — standalone HQ access) ───────────────────
// access_grants table has no foreign key relations; Bar manages them manually
// The `approvedByBar` flag is the authorization mechanism

// ─── Documents ────────────────────────────────────────────────────────────────
// documents.ownerId is polymorphic (venue/couple/platform) — no single FK relation
// Queries should filter by ownerType + ownerId

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// ─── External Staff ───────────────────────────────────────────────────────────

export const externalStaffRelations = relations(externalStaff, ({ one }) => ({
  venue: one(venues, {
    fields: [externalStaff.venueId],
    references: [venues.id],
  }),
  wedding: one(weddings, {
    fields: [externalStaff.weddingId],
    references: [weddings.id],
  }),
}));

// ─── Venues (extended with externalStaff) ─────────────────────────────────────
// Note: venuesRelations already defined above; externalStaff added via externalStaffRelations
