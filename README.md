# 🕌 FairPick — Halaqa Management System

A free, cloud-based classroom management tool built specifically for Islamic halaqas and madrasahs. Data syncs across all devices in real time via a PostgreSQL database.

🔗 **Live at:** [fairpick.netlify.app](https://fairpick.netlify.app)

---

## What's New — Cloud Database

FairPick now stores all data in a **cloud database (Neon PostgreSQL)**. This means:

- ✅ Open the app on your phone, tablet, or any browser — same data everywhere
- ✅ Multiple teachers can use the app simultaneously
- ✅ Data is never lost if you clear your browser cache
- ✅ Attendance records, students, malams — all synced instantly

---

## Features

### 🗓 Student Attendance
- Mark morning and evening sessions (Saturday–Wednesday)
- Students categorised as **Active** or **Inactive (Archived)**
- Saves permanently to the cloud — browse and edit any past date
- Load saved attendance into the sidebar for picks and duty rotation

### 📊 Daily Attendance Report Card
- Generates a shareable image showing:
  - Gregorian and Hijri date (manually correctable)
  - Total enrolled, Active, and Inactive student counts
  - Morning and evening: present & absent numbers
  - Malam attendance table ✓ / ✗ per session
  - Session notes
- WhatsApp caption: totals, attendance, malam ticks, notes — short and clean
- Share directly to WhatsApp group or download as PNG

### 👨‍🏫 Malam (Teacher) Attendance
- Add malams with name, role, scheduled days and sessions
- Per-malam scheduling — e.g. Saturday & Sunday, Morning only
- Session notes for absence reasons, late arrivals, etc.
- Monthly report showing each malam's attendance percentage

### 📅 Monthly Malam Report
- Each malam's percentage based on their own scheduled days only
- Colour-coded: 🟢 ≥80% · 🟡 ≥60% · 🔴 <60%
- Share to WhatsApp or download as PNG

### 🎱 Number Draw (Presentations)
- Students hold physical numbers (e.g. 1–30)
- Click the ball → random number drawn → that student presents
- Fair rotation: no number repeats until all have been drawn

### 🧹 Cleaning Duty Rotation
- Only present, non-kid boys are eligible
- Fair round-robin: yesterday's cleaner skipped until everyone has gone

### 👥 Student Management
- ID auto-assigned, name, category (Boy / Girl / Kid)
- Archive inactive students — hidden from attendance, history kept
- Active and Inactive counts always visible in the header
- Import students from CSV — bulk upload
- Export student list as CSV backup

---

## Who Is This For?

Any madrasah or halaqa with:
- Morning & evening sessions, Saturday to Wednesday
- Mixed student body (boys, girls, younger kids)
- Multiple teachers (malams) with different schedules
- WhatsApp-based staff communication

---

## Can Anyone Use This?

**Currently:** The app is live at fairpick.netlify.app but all users share the same database. It is set up for one specific halaqa.

**To use it for your own halaqa:**
1. Fork this repo on GitHub
2. Create a free Neon database at [neon.tech](https://neon.tech)
3. Deploy to Netlify and set `DATABASE_URL` as an environment variable
4. Done — your own private instance, completely free

---

## Tech Stack

- **Frontend:** Pure HTML + CSS + JavaScript (no framework)
- **Backend:** Netlify Serverless Functions (Node.js)
- **Database:** Neon PostgreSQL (free tier)
- **Hosting:** Netlify (free tier)
- **Total cost:** $0

---

## Deploying Updates

```bash
cd fairpick
# update files
git add .
git commit -m "Update description"
git push
```

Netlify auto-deploys from GitHub on every push.

---

*May Allah make this a sadaqah jariyah for all involved. آمين*
