# VEYA MVP — רשימת משימות

## שלב 1 — מסד נתונים
- [x] הגדרת סכמת Drizzle: venues, couples, weddings, guests, tables, vendors, subscriptions, invoices, leads, access_grants, documents, feedback + budget_items, photos, messages, family_access, tool_settings
- [x] הרצת migration ויישום SQL — 18 טבלאות נוצרו בהצלחה
- [ ] בדיקת סכמה (vitest)

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
- [ ] עריכה ידנית ע"י VEYA HQ (שלב 6)

## שלב 4 — שני סוגי זוגות
- [ ] venue_linked: צ'אט עם אולם, דוחות אולם, שיוך
- [ ] independent: מערכת פרטית ללא אולם
- [ ] הפרדת UI לפי couple.type

## שלב 5 — כלי MVP
- [ ] אורחים + RSVP (דיאטות → דוח שף)
- [ ] הושבה (drag & drop)
- [ ] מתנות (פרטי העברה בנקאית בלבד)
- [ ] תקציב
- [ ] תמונות (גלריה)
- [ ] חתימה דיגיטלית
- [ ] טריגרים אוטומטיים (דוח שף בבוקר החתונה, storage lifecycle)

## שלב 6 — VEYA HQ (סופר-אדמין)
- [ ] ניהול אולמות
- [ ] ניהול זוגות
- [ ] ניהול מנויים וחשבוניות
- [ ] CRM לידים
- [ ] הענקת גישה חיצונית (עורך דין / רואה חשבון)
- [ ] kill-switch לכלים
- [ ] סטטיסטיקות משוב

## שלב 7 — עיצוב RTL
- [ ] RTL מלא, עברית בכל ה-UI
- [ ] פלטת צבעים: cream #F8F6F2, greens #DDEAE0/#A8C3B0/#5D6861/#3F4842, sand #D9C5A1
- [ ] פונטים: Heebo, Frank Ruhl Libre, Cormorant Garamond
- [ ] נטרליות מגדרית: שם 1 / שם 2 בכל מקום
- [ ] בדיקות E2E בסיסיות

## תוספת לשלב 1 — צוות חיצוני
- [x] הוספת טבלת external_staff (שם/תפקיד/וואטסאפ/אימייל, שייך לאולם ו/או לחתונה)
- [x] עדכון relations.ts בהתאם
- [x] migration ועדכון DB

## תוספות לשלב 2 — להשלמה בהמשך
- [ ] הגנת נתיבים מלאה: admin-only guard, venue/couple guards, FORBIDDEN handling
- [ ] גישת אורח (token URL) — route + token validation + שם מוצג (שלב 3)

## שלב 3 — זרימת חתונה (פירוט)
- [x] procedure: wedding.create (אולם יוצר חתונה + inviteToken ייחודי)
- [x] procedure: wedding.list (רשימת חתונות של האולם)
- [x] procedure: wedding.getByToken (קבלת פרטי חתונה לפי token — ציבורי)
- [x] procedure: wedding.acceptInvite (זוג מקבל קישור → couple.type = venue_linked)
- [x] UI: CreateWeddingModal — טופס יצירת חתונה באולם
- [x] UI: WeddingList — רשימת חתונות בדשבורד האולם
- [x] UI: /join/:token — דף קבלת קישור לזוג
- [x] עדכון VenueDashboard — חתונות אמיתיות מה-DB + InviteLinkModal
- [ ] עדכון CoupleDashboard — שם האולם אם venue_linked (שלב 4)
- [x] בדיקות vitest לזרימה המלאה — 11 בדיקות עוברות
