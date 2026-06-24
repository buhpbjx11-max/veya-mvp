# VEYA MVP — רשימת משימות

## שלב 1 — מסד נתונים
- [x] הגדרת סכמת Drizzle: venues, couples, weddings, guests, tables, vendors, subscriptions, invoices, leads, access_grants, documents, feedback + budget_items, photos, messages, family_access, tool_settings
- [x] הרצת migration ויישום SQL — 18 טבלאות נוצרו בהצלחה
- [x] בדיקת סכמה (vitest) — בוצע בשלב 11 (schema.test.ts)

## שלב 2 — אימות וניתוב
- [x] דף לוגין אחד עם ניתוב לפי סוג חשבון (venue / couple / admin) — Login.tsx + AuthRedirect.tsx
- [x] Google OAuth + אימייל/סיסמא — דרך Manus OAuth
- [x] גישת אורח עם קישור ייחודי — inviteToken בסכמה (שלב 3)
- [x] הגנת נתיבים לפי role — protectedProcedure + accountContext

## שלב 3 — זרימת חתונה
- [x] האולם פותח חתונה
- [x] שליחת קישור ייחודי לזוג
- [x] הזוג נכנס ונהיה venue_linked
- [x] assignment_locked נאכף ברמת הנתונים
- [x] עריכה ידנית ע"י VEYA HQ — AdminDashboard (שלב 6)

## שלב 4 — שני סוגי זוגות
- [x] venue_linked: צ'אט עם אולם, דוחות אולם, שיוך
- [x] independent: מערכת פרטית ללא אולם
- [x] הפרדת UI לפי couple.type

## שלב 5 — כלי MVP
- [x] אורחים + RSVP (דיאטות → דוח שף)
- [x] הושבה (drag & drop)
- [x] מתנות (פרטי העברה בנקאית בלבד)
- [x] תקציב
- [x] תמונות (גלריה)
- [x] חתימה דיגיטלית — לא בסקופ MVP (הוסר)
- [x] טריגרים אוטומטיים — לא בסקופ MVP (הוסר)

## שלב 6 — VEYA HQ (סופר-אדמין)
- [x] ניהול אולמות
- [x] ניהול זוגות
- [x] ניהול מנויים וחשבוניות
- [x] CRM לידים
- [x] הענקת גישה חיצונית (עורך דין / רואה חשבון)
- [x] kill-switch לכלים
- [x] סטטיסטיקות משוב

## שלב 7 — עיצוב RTL
- [x] RTL מלא, עברית בכל ה-UI — dir="rtl" בכל הדפים
- [x] פלטת צבעים: cream #F8F6F2, greens #DDEAE0/#A8C3B0/#5D6861/#3F4842, sand #D9C5A1
- [x] פונטים: Heebo, Frank Ruhl Libre, Cormorant Garamond — מוטמעים ב-index.html
- [x] נטרליות מגדרית: שם 1 / שם 2 בכל מקום
- [x] בדיקות E2E בסיסיות — לא בסקופ MVP (הוצא מהסקופ)

## תוספת לשלב 1 — צוות חיצוני
- [x] הוספת טבלת external_staff (שם/תפקיד/וואטסאפ/אימייל, שייך לאולם ו/או לחתונה)
- [x] עדכון relations.ts בהתאם
- [x] migration ועדכון DB

## תוספות לשלב 2 — להשלמה בהמשך
- [x] הגנת נתיבים מלאה: protectedProcedure + adminProcedure + FORBIDDEN handling
- [x] גישת אורח (token URL) — /join/:token, /venue-view/:token, /invitation/:token

## שלב 3 — זרימת חתונה (פירוט)
- [x] procedure: wedding.create (אולם יוצר חתונה + inviteToken ייחודי)
- [x] procedure: wedding.list (רשימת חתונות של האולם)
- [x] procedure: wedding.getByToken (קבלת פרטי חתונה לפי token — ציבורי)
- [x] procedure: wedding.acceptInvite (זוג מקבל קישור → couple.type = venue_linked)
- [x] UI: CreateWeddingModal — טופס יצירת חתונה באולם
- [x] UI: WeddingList — רשימת חתונות בדשבורד האולם
- [x] UI: /join/:token — דף קבלת קישור לזוג
- [x] עדכון VenueDashboard — חתונות אמיתיות מה-DB + InviteLinkModal
- [x] עדכון CoupleDashboard — שם האולם אם venue_linked (venue banner בדשבורד)
- [x] בדיקות vitest לזרימה המלאה — 11 בדיקות עוברות

## שלב 4 — שני סוגי זוגות (פירוט)
- [x] procedure: couple.me — מחזיר couple data
- [x] procedure: venue.getById — פרטי האולם (שם, טלפון, איש קשר)
- [x] procedure: message.list + message.send — צ'אט זוג↔אולם (venue_linked בלבד)
- [x] UI: CoupleDashboard — venue_linked: שם האולם, כפתור צ'אט, כפתור "דוחות אולם"
- [x] UI: CoupleDashboard — independent: banner "אין אולם מקושר" + כפתור "קישור לאולם"
- [x] UI: Chat.tsx — דף צ'אט מלא עם האולם (venue_linked בלבד)
- [x] הגנה: כל procedure תלוי-אולם בודק couple.type === venue_linked
- [x] בדיקות vitest לשני סוגי הזוגות

## משימה 2 — Venue Share (שיתוף עם האולם) ✅
- [x] DB: טבלת venue_shares (coupleId, venueName, venuePhone, venueWhatsapp, sharedSections JSON, shareToken unique, revoked)
- [x] migration ויישום SQL
- [x] Server: venueShare.create (independent בלבד — iron rule)
- [x] Server: venueShare.list (רשימת שיתופים של הזוג)
- [x] Server: venueShare.update (עדכון sections / פרטי אולם)
- [x] Server: venueShare.revoke (ביטול גישה מיידי)
- [x] Server: venueShare.getByToken (ציבורי — קריאה בלבד, מחשב guestSummary + mealSummary)
- [x] UI: /couple/venue-share — VenueShareSetup (הגדרת שיתוף, העתקת קישור, WhatsApp, ביטול)
- [x] UI: /venue-view/:token — VenueShareView (קריאה בלבד, ללא auth, ערוץ המרה בתחתית)
- [x] Sidebar CoupleDashboard — "שיתוף עם האולם" רק לindependent
- [x] 15 בדיקות vitest עוברות (סה"כ 46 בדיקות)

## שלב 5 — כלי MVP (פירוט)
- [x] Server: guest.list, guest.create, guest.update, guest.delete
- [x] Server: guest.updateRsvp (RSVP + diet), guest.getChefReport
- [x] Server: seating.getTables, seating.createTable, seating.updateTable, seating.assignGuest
- [x] Server: gift.list, gift.create, gift.update, gift.markThanked
- [x] Server: budget.list, budget.create, budget.update, budget.delete
- [x] Server: photo.list, photo.save, photo.delete
- [x] UI: GuestsPage — רשימת אורחים + RSVP + דיאטות + דוח שף
- [x] UI: SeatingPage — שולחנות drag & drop
- [x] UI: GiftsPage — מעקב מתנות
- [x] UI: BudgetPage — תקציב
- [x] UI: PhotosPage — גלריה + העלאה (דרך /api/upload עם multer + storagePut)
- [x] ניתוב: routes + sidebar links פעילים
- [x] 57 בדיקות vitest עוברות

## שלב 6 — VEYA HQ (סופר-אדמין)
- [x] Server: admin.listVenues (כל האולמות + plan/status/trial)
- [x] Server: admin.listCouples (כל הזוגות + type/venue)
- [x] Server: admin.updateVenueStatus (kill-switch: active/locked/cancelled)
- [x] Server: admin.listLeads + admin.updateLead (CRM)
- [x] Server: admin.listAccessGrants + admin.approveAccessGrant
- [x] Server: admin.getStats (KPIs: venues, couples, active weddings, revenue)
- [x] UI: AdminDashboard — 5 tabs: סטטיסטיקות, אולמות, זוגות, CRM, גישות
- [x] UI: kill-switch per venue (active/locked/cancelled)
- [x] UI: CRM leads table עם stage management
- [x] בדיקות vitest לשלב 6

## שלב 7 — העשרת כלים לפי פרוטוטיפ
- [x] Seating — קנבס ויזואלי מלא: drag/resize/rotate/popover/zoom/undo/objects
- [x] Seating — canvasObjects (אלמנטים דקורטיביים), seatingVenueFrame
- [x] Gifts — פרטי העברה בנקאית/ביט/פייבוקס + תצוגת אורח
- [x] Photos — QR code לאורחים + עמוד ציבורי GuestPhotoUpload + גלריה
- [x] Guests — ייבוא CSV/Excel + ייצוא CSV/Excel + bulkCreate procedure
- [x] Budget — גרף עוגה + progress bars לפי קטגוריה + עריכה inline
- [x] TypeScript ללא שגיאות
- [x] 73 בדיקות vitest עוברות

## שלב 8 — מסכים נוספים בעולם הזוג
- [x] Vendors.tsx — ניהול ספקים (שם, קטגוריה, טלפון, סטטוס)
- [x] Timeline.tsx — לוח זמנים יום האירוע
- [x] FamilyAccess.tsx — שיתוף עם המשפחה (token-based)
- [x] 90 בדיקות vitest עוברות

## שלב 9 — מסכי סיום
- [x] Thanks.tsx — מעקב תודות לאורחים
- [x] FeedbackSurvey.tsx — סקר משוב שבוע אחרי
- [x] AccountSettings.tsx — פרופיל + העדפות + kill-switch כלים
- [x] Sidebar מגיב ל-kill-switch בזמן אמת
- [x] תוצאות משוב זורמות לדשבורד האדמין (טאב "משוב זוגות")

## שלב 10 — צ'אט פנימי + הזמנה דיגיטלית
- [x] Chat.tsx — מסך צ'אט מלא (venue_linked בלבד, polling 5s, RTL)
- [x] Invitation.tsx — הזמנה דיגיטלית (עריכה, תצוגה מקדימה, שיתוף קישור)
- [x] GuestInvitation.tsx — עמוד ציבורי לאורחים (/invitation/:token, ללא auth)
- [x] תיקון TypeScript ב-GuestInvitation.tsx (String() cast)
- [x] routes ב-App.tsx: /couple/chat, /couple/invitation, /invitation/:token
- [x] CoupleDashboard sidebar — הזמנה דיגיטלית + צ'אט עם האולם
- [x] 22 בדיקות vitest חדשות לשלב 10 (סה"כ 112 בדיקות עוברות)
- [x] TypeScript ללא שגיאות

## שלב 11 — vitest לסכמה + שיפורים
- [x] vitest לסכמת Drizzle — 99 בדיקות: עמודות, relations, type inference (schema.test.ts) — סה"כ 211 בדיקות עוברות
- [x] שיפור CoupleDashboard — כפתורי tools grid מנווטים לדפים האמיתיים
- [x] RSVP page (/rsvp?token=...) — טופס אישור הגעה לאורחים (GuestRsvp.tsx) + route /rsvp

## שלב 12 — חיבור RSVP + נייטרליות מגדרית
- [x] תיקון ניסוח נייטרלי מגדרי ב-GuestRsvp.tsx
- [x] חיבור RSVP אמיתי: כפתור קישור RSVP אישי בשורת כל אורח ב-Guests.tsx
- [x] חיבור מ-GuestInvitation: כפתור "אשר הגעה" מנווט ל-/rsvp?token=... עם inviteToken של האורח
