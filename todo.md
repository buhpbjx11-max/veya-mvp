# VEYA MVP — רשימת משימות

## שלב 1 — מסד נתונים
- [x] הגדרת סכמת Drizzle: venues, couples, weddings, guests, tables, vendors, subscriptions, invoices, leads, access_grants, documents, feedback + budget_items, photos, messages, family_access, tool_settings
- [x] הרצת migration ויישום SQL — 18 טבלאות נוצרו בהצלחה
- [ ] בדיקת סכמה (vitest)

## שלב 2 — אימות וניתוב
- [ ] דף לוגין אחד עם ניתוב לפי סוג חשבון (venue / couple / admin)
- [ ] Google OAuth + אימייל/סיסמה
- [ ] גישת אורח עם קישור ייחודי (token + שם מוצג)
- [ ] הגנת נתיבים לפי role

## שלב 3 — זרימת חתונה
- [ ] האולם פותח חתונה
- [ ] שליחת קישור ייחודי לזוג
- [ ] הזוג נכנס ונהיה venue_linked
- [ ] assignment_locked נאכף ברמת הנתונים
- [ ] עריכה ידנית ע"י VEYA HQ

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
