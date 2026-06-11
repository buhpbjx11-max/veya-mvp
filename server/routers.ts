import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  acceptWeddingInvite,
  createCouple,
  createMessage,
  createVenue,
  createWedding,
  getAccountContext,
  getCoupleByUserId,
  getMessagesByConversation,
  getVenueById,
  getVenueByUserId,
  getWeddingByToken,
  getWeddingsByVenueId,
  updateCouple,
  updateVenue,
} from "./db";

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
});

export type AppRouter = typeof appRouter;
