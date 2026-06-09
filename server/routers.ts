import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createCouple,
  createVenue,
  getAccountContext,
  getCoupleByUserId,
  getVenueByUserId,
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
     * Returns: { accountType: 'admin' | 'venue' | 'couple' | 'new' }
     */
    accountContext: protectedProcedure.query(async ({ ctx }) => {
      return getAccountContext(ctx.user.id, ctx.user.role);
    }),
  }),

  // ─── Venue Registration ──────────────────────────────────────────────────
  venue: router({
    /**
     * register: called when a venue owner completes the onboarding form.
     * Creates a venue record linked to the logged-in user.
     * Only allowed if the user has no existing venue.
     */
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
        // Prevent duplicate venue registration
        const existing = await getVenueByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "לחשבון זה כבר קיים אולם רשום",
          });
        }

        // Set trial end date: 14 days from now
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

    /**
     * me: returns the current user's venue profile.
     */
    me: protectedProcedure.query(async ({ ctx }) => {
      const venue = await getVenueByUserId(ctx.user.id);
      if (!venue) {
        throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא אולם לחשבון זה" });
      }
      return venue;
    }),

    /**
     * update: update venue profile fields.
     */
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
        if (!venue) {
          throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא אולם לחשבון זה" });
        }
        await updateVenue(venue.id, input);
        return { success: true };
      }),
  }),

  // ─── Couple Registration ─────────────────────────────────────────────────
  couple: router({
    /**
     * register: called when a couple completes the onboarding form.
     * Creates a couple record linked to the logged-in user.
     * If inviteToken is provided, the couple becomes venue_linked.
     */
    register: protectedProcedure
      .input(
        z.object({
          name1: z.string().min(1).max(255),
          name2: z.string().min(1).max(255),
          phone1: z.string().max(20).optional(),
          phone2: z.string().max(20).optional(),
          primaryContact: z.enum(["1", "2"]).default("1"),
          weddingDate: z.string().optional(), // ISO date string
          sideLabel1: z.string().max(50).optional(),
          sideLabel2: z.string().max(50).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Prevent duplicate couple registration
        const existing = await getCoupleByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "לחשבון זה כבר קיים פרופיל זוג",
          });
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
          type: "independent", // venue_linked is set via wedding invite flow (stage 3)
          sideLabels: input.sideLabel1 && input.sideLabel2
            ? [input.sideLabel1, input.sideLabel2]
            : null,
          plan: "base",
          storageStatus: "active",
        });

        return { success: true, coupleId };
      }),

    /**
     * me: returns the current user's couple profile.
     */
    me: protectedProcedure.query(async ({ ctx }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) {
        throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא פרופיל זוג לחשבון זה" });
      }
      return couple;
    }),

    /**
     * update: update couple profile fields (only non-locked fields).
     */
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
        if (!couple) {
          throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא פרופיל זוג לחשבון זה" });
        }

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
});

export type AppRouter = typeof appRouter;
