# 🥜 אגוזי הקרב — Brawlhalla Session Tracker

טראקר עברי חד־קובץ למשחקי Brawlhalla עם חברים. נפתח ישירות בדפדפן, ללא בנייה וללא שרת — עם סנכרון ענן בזמן אמת בין כל המכשירים.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML](https://img.shields.io/badge/single--file-HTML-orange.svg)
![Realtime](https://img.shields.io/badge/sync-Supabase%20Realtime-3ECF8E.svg)
![RTL](https://img.shields.io/badge/lang-Hebrew%20RTL-yellow.svg)

---

## ✨ פיצ'רים

- 🥷 **בריכת לוחמים** עם אווטארי אמוג'י וניהול שמות.
- 🏟️ **סשנים מקבילים** עם מעבר בצ'יפים, לוח תהילה חי וארכיון מלא.
- 🌈 **מדד ההומואים** — לוח ייעודי עם גרף נרות צבעוני.
- ☁️ **סנכרון ענן בזמן אמת** דרך Supabase Realtime, עם פולינג של 15ש' כגיבוי.
- 🟢 **חיווי חברים מחוברים** — פיל חי בראש המסך עם ספירת מכשירים אונליין דרך Supabase Presence.
- 📡 **חשיפת רול במכשירים מרוחקים** — overlay + toast + גלילה אוטומטית.
- 🎲 **מודים אינטראקטיביים** — הגרלה לפני כל משחק עם אנימציה (2.8–5.0ש') וחשיפה דרמטית עם קונפטי.
- 🧪 **מצב בדיקות אפמרלי** — מרחב עבודה מבודד עם טבלת ענן נפרדת.

---

## 🚀 התחלה מהירה

### דרישות מקדימות

- דפדפן מודרני (Chrome / Edge / Firefox / Safari).
- אין צורך ב־Node.js, build או שרת מקומי.
- חשבון [Supabase](https://supabase.com) עם הטבלאות `kv_store` ו־`kv_store_test` (אופציונלי — האפליקציה עובדת גם offline).

### הפעלה

1. שכפל או הורד את המאגר:
   ```bash
   git clone https://github.com/<user>/BrawlhallaTracker.git
   cd BrawlhallaTracker
   ```

2. פתח את `index.html` ישירות בדפדפן — או דחוף ל־GitHub Pages לגישה מכל מכשיר.

3. בלשונית ⚙️ הגדרות, הוסף לוחמים, התחל סשן, בחר משתתפים ואסטרטגיית הגרלה.

4. ▶️ התחל משחק → סדר מקומות → בחר הומו → מלא נוקאאוטים → אשר.

### מצב בדיקות

- הפעלה דרך לשונית ⚙️ הגדרות (כפתור `🧪 הפעל מצב בדיקות`) או בידנית עם `?test=1` ב־URL.
- שומר ב־`localStorage` נפרד ומסנכרן לטבלה נפרדת (`kv_store_test`).
- באנר אדום־כתום מוצג בראש המסך לסימון ברור.

---

## 🎮 מודים אינטראקטיביים

| מוד | בונוס |
|---|---|
| ⚔️ רגיל | ניקוד דירוג בלבד |
| 🇵🇸 Welcome to Palestine | +1 לכל לוחם על נוקאאוט של ההומו |
| 🎯 Hunted | יעד רנדומלי (חשיפה שכבתית +3ש'); +1 על נוקאאוט שלו |
| 👑 Kingslayer | +1 על נוקאאוט של מוביל הסשן |
| 💀 Underdog Rage | +1 לכל נוקאאוט של המקום האחרון |
| 🤝 קרב זוגות | 4 שחקנים — זוג מנצח מקבל +2 לכל אחד |
| 🥊 3VS1 / 2VS1 | 3–4 שחקנים — בודד עם 2HP/3HP נגד השאר. ניצח: +3 לבודד · הפסיד: +1 לכל יריב |

**אסטרטגיות הגרלה:** 🎲 רנדומלית · 📋 מסודרת (כל N משחקים) · ⚔️ ללא מודים. ניתן לבחור אילו מודים פעילים ולערוך תוך כדי סשן.

---

## 🏗️ ארכיטקטורה

קובץ HTML יחיד עם CSS ו־JavaScript inline — ללא תלויות בנייה. CDN חיצוני יחיד: `@supabase/supabase-js@2`.

### אחסון ומצב

- `localStorage` שומר את כל המצב המקומי (לוחמים, סשנים פעילים, ארכיון).
- שכבת `LOCAL_ONLY` מאפשרת עבודה אופליין מלאה.
- מצב `EPHEMERAL` (URL `?test=1`) משתמש במרחב נפרד: prefix `brawl_test_` ב־`localStorage` וטבלת `kv_store_test` ב־Supabase, ללא נגיעה בדאטה האמיתי.
- מיגרציות מצב inline (ברירות מחדל ל־`currentPairs`, `modeStrategy`, `modePatternEvery`).

### סנכרון ענן (Supabase)

- טבלת state JSON עם `upsert` בכל שינוי מקומי: `kv_store` במצב רגיל, `kv_store_test` במצב בדיקות.
- `kv_store_test` חייבת מבנה והרשאות Realtime זהים ל־`kv_store`.
- ערוץ `Realtime` ל־postgres_changes → פוש מיידי בין מכשירים.
- ערוץ Presence נפרד (`${SYNC_TABLE}_presence`) keyed ב־`CLIENT_ID` — מזין את חיווי "חברים מחוברים" (sync/join/leave → ספירה חיה, untrack ב־`pagehide`).
- פולינג fallback כל 15 שניות.
- חשיפת רול מרחוק: זיהוי `currentMode` חדש → הפעלת overlay + toast + scroll גם במכשיר שלא הגריל.

### לוגיקת מודים

- `SPECIAL_MODE_IDS` עם פילטר זכאות פר־סשן (`pairs` רק ב־4 שחקנים, `solo` רק ב־3 או 4).
- `getModeDef(id, fighterCount)` מחזיר תווית דינמית למוד `solo` (`3VS1` / `2VS1`).
- אסטרטגיית `random`: 40% למשחק רגיל, השאר מתחלק בין המודים הנבחרים.
- אסטרטגיית `pattern`: מדלגת על ההגרלה במשחקים רגילים ומפעילה רק כל N.
- אסטרטגיית `none`: כופה משחק רגיל.
- חישוב בונוסים פר־מוד ב־`computeModeBonus(game)` — pairs מבוסס זוג מנצח, solo מבוסס תוצאה (3 לבודד / 1 לכל יריב), שאר המודים מבוססים נוקאאוטים מתויגים.
- `soloHp` קבוע ל־2 (אין UI לבחירה).

### UI

RTL בעברית, פונטים Cinzel + Heebo, אנימציות CSS (קונפטי, layered reveal, toasts), modals לעריכת אסטרטגיה ומודים תוך כדי סשן.

---

## 🌐 פריסה

### GitHub Pages

1. דחוף את הריפו ל־GitHub.
2. Settings → Pages → Source: `main` / root.
3. הקובץ `index.html` יוגש מ־`https://<user>.github.io/BrawlhallaTracker/`.

### שרת סטטי מקומי

```bash
python -m http.server 8000
# או
npx serve .
```

---

## 📁 מבנה הפרויקט

```
BrawlhallaTracker/
├── index.html    # האפליקציה כולה — HTML + CSS + JS
└── README.md     # קובץ זה
```

---

## 📜 רישיון

MIT
