import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  acceptWeddingInvite,
  adminCreateAccessGrant,
  adminCreateLead,
  adminDeleteLead,
  adminGetStats,
  adminListAccessGrants,
  adminListCouples,
  adminListLeads,
  adminListVenues,
  adminUpdateAccessGrant,
  adminUpdateLead,
  adminUpdateVenueStatus,
  createBudgetItem,
  createCanvasObject,
  createCouple,
  createGuest,
  createMessage,
  createPhoto,
  createTable,
  createVenue,
  createVenueShare,
  createWedding,
  deleteBudgetItem,
  deleteCanvasObject,
  deleteGuest,
  deletePhoto,
  deleteTable,
  deleteSeatingVenueFrame,
  getAccountContext,
  getBudgetItemsByCoupleId,
  getCanvasObjectsByCoupleId,
  getCoupleByUserId,
  getGuestById,
  getGuestsByCoupleId,
  getMessagesByConversation,
  getCoupleByPhotoToken,
  getPhotosByCoupleId,
  getSeatingVenueFrame,
  getTablesByCoupleId,
  getVenueById,
  getVenueByUserId,
  getVenueShareByToken,
  getVenueSharesByCoupleId,
  getWeddingByToken,
  getWeddingsByVenueId,
  revokeVenueShare,
  updateBudgetItem,
  updateCanvasObject,
  updateCouple,
  updateGuest,
  updateTable,
  updateVenue,
  updateVenueShare,
  upsertSeatingVenueFrame,
} from "./db";

// ─── Admin procedure ──────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "VEYA HQ only" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    /**
     * accountContext: returns what type of account the logged-in user has.
     * Used by the router to redirect to the correct dashboard.
     */
    accountContext: protectedProcedure.query(async ({ ctx }) => {
      return getAccountContext(ctx.user.id, ctx.user.role);
    }),
  }),

  // ─── Venue ───────────────────────────────────────────────────────────────
  venue: router({
    register: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(255),
          region: z.string().max(100).optional(),
          contact: z.string().max(255).optional(),
          phone: z.string().max(20).optional(),
          email: z.string().email().optional(),
          plan: z.enum(["basic", "business", "pro"]).default("basic"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getVenueByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "לחשבון זה כבר קיים אולם רשום" });
        }
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const venueId = await createVenue({
          userId: ctx.user.id,
          name: input.name,
          region: input.region ?? null,
          contact: input.contact ?? null,
          phone: input.phone ?? null,
          email: input.email ?? ctx.user.email ?? null,
          plan: input.plan,
          billingCycle: "monthly",
          subStatus: "trial",
          trialEndsAt,
          coupleAccess: "free",
        });
        return { success: true, venueId };
      }),

    me: protectedProcedure.query(async ({ ctx }) => {
      const venue = await getVenueByUserId(ctx.user.id);
      if (!venue) throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא אולם לחשבון זה" });
      return venue;
    }),

    update: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(255).optional(),
          region: z.string().max(100).optional(),
          contact: z.string().max(255).optional(),
          phone: z.string().max(20).optional(),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const venue = await getVenueByUserId(ctx.user.id);
        if (!venue) throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא אולם לחשבון זה" });
        await updateVenue(venue.id, input);
        return { success: true };
      }),

    /**
     * getById: get venue info by id (for couple to see their linked venue).
     * Public-ish: only returns safe fields.
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const venue = await getVenueById(input.id);
        if (!venue) throw new TRPCError({ code: "NOT_FOUND", message: "אולם לא נמצא" });
        // Return safe public fields only
        return {
          id: venue.id,
          name: venue.name,
          region: venue.region,
          phone: venue.phone,
          email: venue.email,
        };
      }),
  }),

  // ─── Couple ───────────────────────────────────────────────────────────────
  couple: router({
    register: protectedProcedure
      .input(
        z.object({
          name1: z.string().min(1).max(255),
          name2: z.string().min(1).max(255),
          phone1: z.string().max(20).optional(),
          phone2: z.string().max(20).optional(),
          primaryContact: z.enum(["1", "2"]).default("1"),
          weddingDate: z.string().optional(),
          sideLabel1: z.string().max(50).optional(),
          sideLabel2: z.string().max(50).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getCoupleByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "לחשבון זה כבר קיים פרופיל זוג" });
        }
        const coupleId = await createCouple({
          userId: ctx.user.id,
          name1: input.name1,
          name2: input.name2,
          phone1: input.phone1 ?? null,
          phone2: input.phone2 ?? null,
          primaryContact: input.primaryContact,
          email: ctx.user.email ?? null,
          weddingDate: input.weddingDate ? new Date(input.weddingDate) : null,
          type: "independent", // venue_linked only via wedding invite
          sideLabels: input.sideLabel1 && input.sideLabel2
            ? [input.sideLabel1, input.sideLabel2]
            : null,
          plan: "base",
          storageStatus: "active",
        });
        return { success: true, coupleId };
      }),

    me: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא פרופיל זוג לחשבון זה" });
      return couple;
    }),

    update: protectedProcedure
      .input(
        z.object({
          name1: z.string().min(1).max(255).optional(),
          name2: z.string().min(1).max(255).optional(),
          phone1: z.string().max(20).optional(),
          phone2: z.string().max(20).optional(),
          weddingDate: z.string().optional(),
          sideLabel1: z.string().max(50).optional(),
          sideLabel2: z.string().max(50).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא פרופיל זוג לחשבון זה" });

        const updateData: Record<string, unknown> = {};
        if (input.name1) updateData.name1 = input.name1;
        if (input.name2) updateData.name2 = input.name2;
        if (input.phone1 !== undefined) updateData.phone1 = input.phone1;
        if (input.phone2 !== undefined) updateData.phone2 = input.phone2;
        if (input.weddingDate) updateData.weddingDate = new Date(input.weddingDate);
        if (input.sideLabel1 && input.sideLabel2) {
          updateData.sideLabels = [input.sideLabel1, input.sideLabel2];
        }

                await updateCouple(couple.id, updateData as Parameters<typeof updateCouple>[1]);
        return { success: true };
      }),
    updateGiftSettings: protectedProcedure
      .input(z.object({
        displayName: z.string().max(100).optional(),
        bankAccount: z.string().max(200).optional(),
        bitPhone: z.string().max(20).optional(),
        payboxUser: z.string().max(100).optional(),
        paypalEmail: z.string().max(320).optional(),
        thankYouMessage: z.string().max(500).optional(),
        enabledMethods: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
        const current = (couple.giftSettings as Record<string, unknown>) ?? {};
        const updated = { ...current, ...input };
        await updateCouple(couple.id, { giftSettings: updated } as Parameters<typeof updateCouple>[1]);
        return { success: true };
      }),
  }),
  // ─── Messages (venue ↔ couple chat) ────────────────────────────────────────
  message: router({
    /**
     * list: get messages for the couple↔venue conversation.
     * Only available to venue_linked couples and their venue.
     */
    list: protectedProcedure
      .input(z.object({ weddingId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        // Allow both couple and venue to read messages
        const couple = await getCoupleByUserId(ctx.user.id);
        const venue = await getVenueByUserId(ctx.user.id);

        if (couple) {
          if (couple.type !== "venue_linked") {
            throw new TRPCError({ code: "FORBIDDEN", message: "צ'אט זמין רק לזוגות מקושרים לאולם" });
          }
        } else if (!venue) {
          throw new TRPCError({ code: "FORBIDDEN", message: "גישה נדחתה" });
        }

        const conversationId = `wedding_${input.weddingId}`;
        return getMessagesByConversation(conversationId, "venue_couple");
      }),

    /**
     * send: send a message in the couple↔venue conversation.
     * Only venue_linked couples and their venue can send.
     */
    send: protectedProcedure
      .input(
        z.object({
          weddingId: z.number().int().positive(),
          content: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        const venue = await getVenueByUserId(ctx.user.id);

        let senderType: "couple" | "venue";
        if (couple) {
          if (couple.type !== "venue_linked") {
            throw new TRPCError({ code: "FORBIDDEN", message: "צ'אט זמין רק לזוגות מקושרים לאולם" });
          }
          senderType = "couple";
        } else if (venue) {
          senderType = "venue";
        } else {
          throw new TRPCError({ code: "FORBIDDEN", message: "גישה נדחתה" });
        }

        const conversationId = `wedding_${input.weddingId}`;
        const messageId = await createMessage({
          conversationId,
          senderId: ctx.user.id,
          conversationType: "venue_couple",
          content: input.content,
        });
        return { success: true, messageId };
      }),
  }),

  // ─── Wedding ──────────────────────────────────────────────────────────────
  wedding: router({
    /**
     * create: venue creates a new wedding.
     * Generates a unique inviteToken for the couple's invite link.
     * Returns the wedding id and the invite URL.
     */
    create: protectedProcedure
      .input(
        z.object({
          name1: z.string().min(1).max(255),
          name2: z.string().min(1).max(255),
          date: z.string().optional(), // ISO date string
          guestCount: z.number().int().min(1).max(5000).optional(),
          notes: z.string().max(1000).optional(),
          origin: z.string().url(), // frontend origin for building invite URL
        })
      )
      .mutation(async ({ ctx, input }) => {
        const venue = await getVenueByUserId(ctx.user.id);
        if (!venue) {
          throw new TRPCError({ code: "FORBIDDEN", message: "רק אולמות יכולים ליצור חתונות" });
        }

        // Generate a cryptographically random invite token
        const inviteToken = randomBytes(32).toString("hex");

        const weddingId = await createWedding({
          venueId: venue.id,
          coupleId: null,
          date: input.date ? new Date(input.date) : null,
          status: "prep",
          inviteToken,
          // Store couple names in timeline as a note (until couple links)
          timeline: [
            {
              time: "00:00",
              label: `${input.name1} & ${input.name2}${input.guestCount ? ` — ${input.guestCount} אורחים` : ""}`,
              addedBy: "venue",
            },
          ],
        });

        const inviteUrl = `${input.origin}/join/${inviteToken}`;
        return { success: true, weddingId, inviteToken, inviteUrl };
      }),

    /**
     * list: get all weddings for the current venue.
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const venue = await getVenueByUserId(ctx.user.id);
      if (!venue) {
        throw new TRPCError({ code: "FORBIDDEN", message: "רק אולמות יכולים לראות חתונות" });
      }
      const weddingList = await getWeddingsByVenueId(venue.id);
      return weddingList;
    }),

    /**
     * getByToken: public procedure — get wedding details by invite token.
     * Used by the couple's invite page before they log in.
     */
    getByToken: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .query(async ({ input }) => {
        const wedding = await getWeddingByToken(input.token);
        if (!wedding) {
          throw new TRPCError({ code: "NOT_FOUND", message: "קישור לא תקין או פג תוקף" });
        }
        // Return safe subset (no internal IDs exposed to unauthenticated users)
        return {
          id: wedding.id,
          date: wedding.date,
          status: wedding.status,
          timeline: wedding.timeline,
          alreadyLinked: wedding.coupleId !== null,
          inviteToken: wedding.inviteToken,
        };
      }),

    /**
     * forCouple: get the wedding linked to the current couple.
     * Only works for venue_linked couples.
     */
    forCouple: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple || couple.type !== "venue_linked") return null;
      // Find the wedding where coupleId = couple.id
      const db = await (await import("./db")).getDb();
      if (!db) return null;
      const { weddings } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const result = await db.select().from(weddings).where(eq(weddings.coupleId, couple.id)).limit(1);
      return result.length > 0 ? result[0] : null;
    }),

    /**
     * acceptInvite: couple accepts the venue's invite.
     * Marks couple as venue_linked and links them to the wedding.
     *
     * Iron rules:
     * - couple.assignmentLocked must be false
     * - couple.type is set automatically (not by user choice)
     * - wedding must not already have a different couple
     */
    acceptInvite: protectedProcedure
      .input(z.object({ token: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "יש להשלים הרשמה כזוג לפני קבלת הזמנה",
          });
        }

        const wedding = await getWeddingByToken(input.token);
        if (!wedding) {
          throw new TRPCError({ code: "NOT_FOUND", message: "קישור לא תקין או פג תוקף" });
        }

        if (couple.assignmentLocked) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "השיוך נעול — פנו ל-VEYA לשינוי",
          });
        }

        if (wedding.coupleId && wedding.coupleId !== couple.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "קישור זה כבר שויך לזוג אחר",
          });
        }

        await acceptWeddingInvite(wedding.id, couple.id, wedding.venueId);
        return { success: true, weddingId: wedding.id };
      }),
  }),

  // ─── Venue Share (שיתוף עם האולם — רק לזוג independent) ───────────────────
  venueShare: router({
    /**
     * create: independent couple creates a share link for their venue.
     * Iron rule: only independent couples can create venue shares.
     */
    create: protectedProcedure
      .input(
        z.object({
          venueName: z.string().min(1).max(255),
          venuePhone: z.string().max(20).optional(),
          venueWhatsapp: z.string().max(20).optional(),
          sharedSections: z.object({
            guests: z.boolean(),
            meals: z.boolean(),
            seating: z.boolean(),
            schedule: z.boolean(),
            vendors: z.boolean(),
          }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) {
          throw new TRPCError({ code: "FORBIDDEN", message: "יש להשלים הרשמה כזוג" });
        }
        // Iron rule: only independent couples can create venue shares
        if (couple.type !== "independent") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "זוגות מקושרים לאולם לא זקוקים לשיתוף — האולם שלכם כבר במערכת",
          });
        }

        const shareToken = randomBytes(32).toString("hex");

        const shareId = await createVenueShare({
          coupleId: couple.id,
          venueName: input.venueName,
          venuePhone: input.venuePhone ?? null,
          venueWhatsapp: input.venueWhatsapp ?? null,
          sharedSections: input.sharedSections,
          shareToken,
          revoked: false,
        });

        return { success: true, shareId, shareToken };
      }),

    /**
     * list: get all venue shares for the current couple.
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) return [];
      return getVenueSharesByCoupleId(couple.id);
    }),

    /**
     * update: update shared sections or venue contact info.
     */
    update: protectedProcedure
      .input(
        z.object({
          shareId: z.number(),
          sharedSections: z.object({
            guests: z.boolean(),
            meals: z.boolean(),
            seating: z.boolean(),
            schedule: z.boolean(),
            vendors: z.boolean(),
          }).optional(),
          venueName: z.string().min(1).max(255).optional(),
          venuePhone: z.string().max(20).optional(),
          venueWhatsapp: z.string().max(20).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const updateData: Record<string, unknown> = {};
        if (input.sharedSections) updateData.sharedSections = input.sharedSections;
        if (input.venueName) updateData.venueName = input.venueName;
        if (input.venuePhone !== undefined) updateData.venuePhone = input.venuePhone;
        if (input.venueWhatsapp !== undefined) updateData.venueWhatsapp = input.venueWhatsapp;
        await updateVenueShare(input.shareId, couple.id, updateData);
        return { success: true };
      }),

    /**
     * revoke: couple revokes the share — venue loses access immediately.
     */
    revoke: protectedProcedure
      .input(z.object({ shareId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        await revokeVenueShare(input.shareId, couple.id);
        return { success: true };
      }),

    /**
     * getByToken: PUBLIC — venue opens the read-only share link.
     * No login required. Returns null if token is invalid or revoked.
     *
     * Returns a snapshot of the couple's wedding data based on sharedSections.
     * The venue gets ZERO edit capability.
     */
    getByToken: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .query(async ({ input }) => {
        const share = await getVenueShareByToken(input.token);
        if (!share) {
          throw new TRPCError({ code: "NOT_FOUND", message: "קישור לא תקין, פג תוקף, או בוטל" });
        }

        // Fetch couple data
        const db = await (await import("./db")).getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const { couples, guests, weddings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const [couple] = await db.select().from(couples).where(eq(couples.id, share.coupleId)).limit(1);
        if (!couple) throw new TRPCError({ code: "NOT_FOUND" });

        const result: {
          share: typeof share;
          couple: { name1: string; name2: string; weddingDate: Date | null };
          guestSummary?: { total: number; confirmed: number; pending: number; declined: number };
          mealSummary?: Record<string, number>;
        } = {
          share,
          couple: { name1: couple.name1, name2: couple.name2, weddingDate: couple.weddingDate },
        };

        // Guests summary (if shared)
        if (share.sharedSections.guests || share.sharedSections.meals) {
          const guestList = await db.select().from(guests).where(eq(guests.coupleId, share.coupleId));
          if (share.sharedSections.guests) {
            result.guestSummary = {
              total: guestList.length,
              confirmed: guestList.filter(g => g.rsvpStatus === "yes").length,
              pending: guestList.filter(g => g.rsvpStatus === "pending").length,
              declined: guestList.filter(g => g.rsvpStatus === "no").length,
            };
          }
          if (share.sharedSections.meals) {
            const mealCounts: Record<string, number> = {};
            for (const g of guestList) {
              if (g.rsvpStatus !== "yes") continue;
              const diet = (g.diet as { type?: string } | null)?.type ?? "standard";
              mealCounts[diet] = (mealCounts[diet] ?? 0) + 1;
            }
            result.mealSummary = mealCounts;
          }
        }

        return result;
      }),
  }),

  // ─── Guests ─────────────────────────────────────────────────────────────────
  guest: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "FORBIDDEN", message: "רק זוגות יכולים לראות אורחים" });
      return getGuestsByCoupleId(couple.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        count: z.number().int().min(1).max(20).default(1),
        side: z.string().max(100).optional(),
        group: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
        diet: z.object({
          type: z.enum(["regular", "vegetarian", "vegan", "child"]).optional(),
          allergies: z.string().max(500).optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN", message: "רק זוגות יכולים להוסיף אורחים" });
        const { randomBytes } = await import("crypto");
        const inviteToken = randomBytes(16).toString("hex");
        const id = await createGuest({
          coupleId: couple.id,
          name: input.name,
          count: input.count,
          side: input.side ?? null,
          group: input.group ?? null,
          phone: input.phone ?? null,
          diet: input.diet ?? null,
          inviteToken,
        });
        return { success: true, id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        count: z.number().int().min(1).max(20).optional(),
        side: z.string().max(100).optional(),
        group: z.string().max(100).optional(),
        phone: z.string().max(20).optional(),
        rsvpStatus: z.enum(["pending", "yes", "no", "maybe"]).optional(),
        diet: z.object({
          type: z.enum(["regular", "vegetarian", "vegan", "child"]).optional(),
          allergies: z.string().max(500).optional(),
        }).optional(),
        tableId: z.number().int().positive().nullable().optional(),
        giftAmount: z.string().optional(),
        giftNote: z.string().max(500).optional(),
        thanked: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateGuest(id, couple.id, data as Parameters<typeof updateGuest>[2]);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteGuest(input.id, couple.id);
        return { success: true };
      }),

    /** updateRsvp: guest updates their own RSVP via invite token (no auth) */
    updateRsvp: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        rsvpStatus: z.enum(["yes", "no", "maybe"]),
        diet: z.object({
          type: z.enum(["regular", "vegetarian", "vegan", "child"]).optional(),
          allergies: z.string().max(500).optional(),
        }).optional(),
        name: z.string().max(255).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await (await import("./db")).getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { guests: guestsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const result = await db.select().from(guestsTable).where(eq(guestsTable.inviteToken, input.token)).limit(1);
        if (!result.length) throw new TRPCError({ code: "NOT_FOUND", message: "קישור לא תקין" });
        const guest = result[0];
        const updateData: Record<string, unknown> = { rsvpStatus: input.rsvpStatus };
        if (input.diet) updateData.diet = input.diet;
        if (input.name) updateData.name = input.name;
        await db.update(guestsTable).set(updateData).where(eq(guestsTable.id, guest.id));
        return { success: true, guestName: guest.name };
      }),

    /** bulkCreate: import multiple guests at once (CSV/Excel import) */
    bulkCreate: protectedProcedure
      .input(z.object({
        guests: z.array(z.object({
          name: z.string().min(1).max(255),
          count: z.number().int().min(1).max(20).default(1),
          side: z.string().max(100).optional(),
          group: z.string().max(100).optional(),
          phone: z.string().max(20).optional(),
          rsvpStatus: z.enum(["pending", "yes", "no", "maybe"]).default("pending"),
        })).min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const { randomBytes } = await import("crypto");
        let created = 0;
        for (const g of input.guests) {
          const inviteToken = randomBytes(16).toString("hex");
          await createGuest({
            coupleId: couple.id,
            name: g.name,
            count: g.count ?? 1,
            side: g.side ?? null,
            group: g.group ?? null,
            phone: g.phone ?? null,
            diet: null,
            inviteToken,
          });
          created++;
        }
        return { success: true, created };
      }),
    /** chefReport: aggregated meal summary for venue (venue_linked only) */
    chefReport: protectedProcedure
      .input(z.object({ weddingId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const venue = await getVenueByUserId(ctx.user.id);
        if (!venue) throw new TRPCError({ code: "FORBIDDEN", message: "רק אולמות יכולים לראות דוח שף" });
        // Find the couple linked to this wedding
        const db = await (await import("./db")).getDb();
        if (!db) return { meals: {}, total: 0, confirmed: 0 };
        const { weddings: weddingsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const weddingResult = await db.select().from(weddingsTable).where(eq(weddingsTable.id, input.weddingId)).limit(1);
        if (!weddingResult.length || weddingResult[0].venueId !== venue.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "חתונה לא שייכת לאולם זה" });
        }
        const wedding = weddingResult[0];
        if (!wedding.coupleId) return { meals: {}, total: 0, confirmed: 0 };
        const guestList = await getGuestsByCoupleId(wedding.coupleId);
        const confirmed = guestList.filter(g => g.rsvpStatus === "yes");
        const meals: Record<string, number> = {};
        for (const g of confirmed) {
          const diet = (g.diet as { type?: string } | null)?.type ?? "regular";
          meals[diet] = (meals[diet] ?? 0) + (g.count ?? 1);
        }
        return { meals, total: confirmed.reduce((s, g) => s + (g.count ?? 1), 0), confirmed: confirmed.length };
      }),
  }),

  // ─── Seating ─────────────────────────────────────────────────────────────────
  seating: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
      const [tableList, guestList] = await Promise.all([
        getTablesByCoupleId(couple.id),
        getGuestsByCoupleId(couple.id),
      ]);
      return { tables: tableList, guests: guestList };
    }),

    createTable: protectedProcedure
      .input(z.object({
        label: z.string().min(1).max(100),
        capacity: z.number().int().min(1).max(100).default(10),
        shape: z.enum(["round", "rect"]).default("round"),
        x: z.number().default(0),
        y: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const id = await createTable({
          coupleId: couple.id,
          label: input.label,
          capacity: input.capacity,
          shape: input.shape,
          x: String(input.x),
          y: String(input.y),
          w: "120",
          h: "120",
          rotation: "0",
        });
        return { success: true, id };
      }),

    updateTable: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        label: z.string().min(1).max(100).optional(),
        capacity: z.number().int().min(1).max(100).optional(),
        shape: z.enum(["round", "rect"]).optional(),
        x: z.number().optional(),
        y: z.number().optional(),
        assignedGuests: z.array(z.number().int()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...rest } = input;
        const data: Record<string, unknown> = {};
        if (rest.label !== undefined) data.label = rest.label;
        if (rest.capacity !== undefined) data.capacity = rest.capacity;
        if (rest.shape !== undefined) data.shape = rest.shape;
        if (rest.x !== undefined) data.x = String(rest.x);
        if (rest.y !== undefined) data.y = String(rest.y);
        if (rest.assignedGuests !== undefined) data.assignedGuests = rest.assignedGuests;
        await updateTable(id, couple.id, data as Parameters<typeof updateTable>[2]);
        return { success: true };
      }),

    deleteTable: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteTable(input.id, couple.id);
        return { success: true };
      }),

    assignGuest: protectedProcedure
      .input(z.object({
        guestId: z.number().int().positive(),
        tableId: z.number().int().positive().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        await updateGuest(input.guestId, couple.id, { tableId: input.tableId });
        return { success: true };
      }),
    // Full layout save (tables + objects + venueFrame in one call)
    saveLayout: protectedProcedure
      .input(z.object({
        tables: z.array(z.object({
          id: z.number().int().positive().optional(),
          label: z.string().max(100).default(""),
          capacity: z.number().int().min(1).max(100),
          shape: z.enum(["round", "rect", "couple"]),
          tableNumber: z.number().int().nullable().optional(),
          name: z.string().max(100).optional(),
          x: z.number(),
          y: z.number(),
          customW: z.number().nullable().optional(),
          customH: z.number().nullable().optional(),
          assignedGuests: z.array(z.number().int()).optional(),
        })),
        objects: z.array(z.object({
          id: z.number().int().positive().optional(),
          shape: z.enum(["rect", "circle"]),
          name: z.string().max(100).optional(),
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
        })),
        venueFrame: z.object({
          widthM: z.number().int().min(3).max(100),
          heightM: z.number().int().min(3).max(100),
          x: z.number(),
          y: z.number(),
        }).nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        // Save tables
        const existingTables = await getTablesByCoupleId(couple.id);
        const incomingTableIds = new Set(input.tables.filter(t => t.id).map(t => t.id!));
        // Delete removed tables
        for (const et of existingTables) {
          if (!incomingTableIds.has(et.id)) {
            await deleteTable(et.id, couple.id);
          }
        }
        const tableIdMap: Record<number, number> = {};
        for (const t of input.tables) {
          const data = {
            coupleId: couple.id,
            label: t.label || "",
            capacity: t.capacity,
            shape: t.shape,
            tableNumber: t.tableNumber ?? null,
            name: t.name ?? null,
            x: String(t.x),
            y: String(t.y),
            w: t.customW ? String(t.customW) : "120",
            h: t.customH ? String(t.customH) : "120",
            customW: t.customW ? String(t.customW) : null,
            customH: t.customH ? String(t.customH) : null,
            rotation: "0",
            assignedGuests: t.assignedGuests ?? [],
          };
          if (t.id) {
            await updateTable(t.id, couple.id, data as Parameters<typeof updateTable>[2]);
            tableIdMap[t.id] = t.id;
          } else {
            const newId = await createTable(data as Parameters<typeof createTable>[0]);
            tableIdMap[-(input.tables.indexOf(t))] = newId;
          }
        }
        // Save canvas objects
        const existingObjects = await getCanvasObjectsByCoupleId(couple.id);
        const incomingObjectIds = new Set(input.objects.filter(o => o.id).map(o => o.id!));
        for (const eo of existingObjects) {
          if (!incomingObjectIds.has(eo.id)) {
            await deleteCanvasObject(eo.id, couple.id);
          }
        }
        for (const o of input.objects) {
          const data = {
            coupleId: couple.id,
            shape: o.shape,
            name: o.name ?? null,
            x: String(o.x),
            y: String(o.y),
            w: String(o.w),
            h: String(o.h),
          };
          if (o.id) {
            await updateCanvasObject(o.id, couple.id, data as Parameters<typeof updateCanvasObject>[2]);
          } else {
            await createCanvasObject(data as Parameters<typeof createCanvasObject>[0]);
          }
        }
        // Save venue frame
        if (input.venueFrame) {
          await upsertSeatingVenueFrame(couple.id, input.venueFrame);
        } else {
          await deleteSeatingVenueFrame(couple.id);
        }
        return { success: true };
      }),
    // Load full canvas state
    loadCanvas: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
      const [tableList, guestList, objectList, venueFrame] = await Promise.all([
        getTablesByCoupleId(couple.id),
        getGuestsByCoupleId(couple.id),
        getCanvasObjectsByCoupleId(couple.id),
        getSeatingVenueFrame(couple.id),
      ]);
      return { tables: tableList, guests: guestList, objects: objectList, venueFrame };
    }),
  }),

  // ─── Budget ──────────────────────────────────────────────────────────────────
  budget: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
      return getBudgetItemsByCoupleId(couple.id);
    }),

    create: protectedProcedure
      .input(z.object({
        category: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        estimatedAmount: z.string().optional(),
        actualAmount: z.string().optional(),
        paid: z.boolean().default(false),
        notes: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const id = await createBudgetItem({
          coupleId: couple.id,
          category: input.category,
          description: input.description ?? null,
          estimatedAmount: input.estimatedAmount ?? null,
          actualAmount: input.actualAmount ?? null,
          paid: input.paid,
          notes: input.notes ?? null,
        });
        return { success: true, id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        category: z.string().min(1).max(100).optional(),
        description: z.string().max(255).optional(),
        estimatedAmount: z.string().optional(),
        actualAmount: z.string().optional(),
        paid: z.boolean().optional(),
        notes: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateBudgetItem(id, couple.id, data as Parameters<typeof updateBudgetItem>[2]);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteBudgetItem(input.id, couple.id);
        return { success: true };
      }),
  }),

  // ─── Photos ──────────────────────────────────────────────────────────────────
  photo: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
      return getPhotosByCoupleId(couple.id);
    }),

    /** getUploadUrl: get a presigned S3 URL for direct upload */
    getUploadUrl: protectedProcedure
      .input(z.object({
        filename: z.string().min(1).max(255),
        contentType: z.string().min(1).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const { storagePut } = await import("./storage");
        const ext = input.filename.split(".").pop() ?? "jpg";
        const key = `photos/${couple.id}/${Date.now()}.${ext}`;
        // Create a placeholder entry and return the key for upload
        return { key, uploadPath: `/api/upload/photo?key=${encodeURIComponent(key)}` };
      }),

    /** save: after upload, save the photo record */
    save: protectedProcedure
      .input(z.object({
        fileKey: z.string().min(1).max(500),
        url: z.string().min(1).max(1000),
        caption: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        const id = await createPhoto({
          coupleId: couple.id,
          fileKey: input.fileKey,
          url: input.url,
          uploadedBy: "couple",
          caption: input.caption ?? null,
        });
                return { success: true, id };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const couple = await getCoupleByUserId(ctx.user.id);
        if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
        await deletePhoto(input.id, couple.id);
        return { success: true };
      }),
    /** getOrCreateQrToken: returns (and creates if needed) the couple's photo QR token */
    getOrCreateQrToken: protectedProcedure.mutation(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "FORBIDDEN" });
      if (couple.photoQrToken) return { token: couple.photoQrToken };
      const token = randomBytes(24).toString("hex");
      await updateCouple(couple.id, { photoQrToken: token } as Parameters<typeof updateCouple>[1]);
      return { token };
    }),
    /** guestUpload: public endpoint — guest uploads a photo via QR token */
    guestUpload: publicProcedure
      .input(z.object({
        token: z.string().min(1).max(64),
        fileKey: z.string().min(1).max(500),
        url: z.string().min(1).max(1000),
        caption: z.string().max(500).optional(),
      }))
      .mutation(async ({ input }) => {
        const couple = await getCoupleByPhotoToken(input.token);
        if (!couple) throw new TRPCError({ code: "NOT_FOUND", message: "קישור לא תקין" });
        await createPhoto({
          coupleId: couple.id,
          fileKey: input.fileKey,
          url: input.url,
          uploadedBy: "guest",
          caption: input.caption ?? null,
        });
        return { success: true };
      }),
  }),
  // ─── Admin (VEYA HQ) ────────────────────────────────────────────────────
  admin: router({
    getStats: adminProcedure.query(async () => {
      return adminGetStats();
    }),

    listVenues: adminProcedure.query(async () => {
      return adminListVenues();
    }),

    updateVenueStatus: adminProcedure
      .input(z.object({
        venueId: z.number().int().positive(),
        subStatus: z.enum(["trial", "active", "locked", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await adminUpdateVenueStatus(input.venueId, input.subStatus);
        return { success: true };
      }),

    listCouples: adminProcedure.query(async () => {
      return adminListCouples();
    }),

    listLeads: adminProcedure.query(async () => {
      return adminListLeads();
    }),

    createLead: adminProcedure
      .input(z.object({
        venueName: z.string().optional(),
        contact: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        source: z.enum(["contact_form", "manual", "outreach"]).default("manual"),
        stage: z.enum(["lead", "meeting", "proposal", "closed"]).default("lead"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await adminCreateLead(input);
        return { success: true, id };
      }),

    updateLead: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        venueName: z.string().optional(),
        contact: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        source: z.enum(["contact_form", "manual", "outreach"]).optional(),
        stage: z.enum(["lead", "meeting", "proposal", "closed"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await adminUpdateLead(id, data);
        return { success: true };
      }),

    deleteLead: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await adminDeleteLead(input.id);
        return { success: true };
      }),

    listAccessGrants: adminProcedure.query(async () => {
      return adminListAccessGrants();
    }),

    createAccessGrant: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["legal", "cpa", "tax"]),
        scope: z.string().optional(),
        permission: z.enum(["view", "download", "edit"]).default("view"),
      }))
      .mutation(async ({ input }) => {
        const id = await adminCreateAccessGrant({
          ...input,
          status: "active",
          approvedByBar: true,
        });
        return { success: true, id };
      }),

    updateAccessGrant: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["pending", "active", "revoked"]).optional(),
        permission: z.enum(["view", "download", "edit"]).optional(),
        approvedByBar: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await adminUpdateAccessGrant(id, data);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
