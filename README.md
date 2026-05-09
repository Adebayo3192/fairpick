# 🕌 FairPick — Halaqa Management System

A free, browser-based tool built specifically for Islamic halaqas and madrasahs to manage daily operations fairly and efficiently. No app download, no subscription, no server — runs entirely in your browser.

🔗 **Live at:** [fairpick.netlify.app](https://fairpick.netlify.app)

---

## Features

### 🗓 Student Attendance
- Mark morning and evening sessions separately (Saturday–Wednesday)
- Students categorised as **Active** or **Inactive (Archived)**
- Save attendance records permanently — browse and edit any past date
- Load saved attendance into the sidebar for use with other features

### 📊 Daily Attendance Report Card
- Generates a shareable image showing:
  - Gregorian and Hijri date (manually correctable)
  - Total enrolled, Active, and Inactive student counts
  - Morning and evening: present & absent numbers
  - Malam attendance table with ✓ / ✗ per session
  - Session notes
- WhatsApp caption: totals, attendance, malam ticks, notes — short and clean, no dates
- Share directly to WhatsApp group or download as PNG

### 👨‍🏫 Malam (Teacher) Attendance
- Add malams with name, role, scheduled days and sessions
- Per-malam scheduling — e.g. Malam Nurudeen: Saturday & Sunday, Morning only
- On unscheduled days/sessions they don't appear — no false absents
- Session notes for absence reasons, late arrivals, etc.
- Saved permanently per date and session

### 📅 Monthly Malam Report
- Generated at end of month (last Wednesday)
- Each malam's percentage based on their own scheduled days only
- Colour-coded: 🟢 ≥80% · 🟡 ≥60% · 🔴 <60%
- Share to WhatsApp or download as image

### 🎱 Number Draw (Presentations)
- Students pick a physical number (e.g. 1–30)
- Click the ball → random number drawn → that student presents
- Fair rotation: no number repeats until all have been drawn

### 🧹 Cleaning Duty Rotation
- Only present, non-kid boys are eligible
- Fair round-robin: yesterday's cleaner skipped until everyone has gone
- Resets automatically when all eligible students have had a turn

### 👥 Student Management
- ID auto-assigned, name, category (Boy / Girl / Kid)
- **Archive** students who leave — hidden from attendance, history kept
- Restore archived students anytime
- Active and Inactive counts visible in the header at all times
- Import from CSV / Export as CSV backup

---

## Who Is This For?

Any madrasah or halaqa with:
- Morning & evening sessions, Saturday to Wednesday
- Mixed student body (boys, girls, younger kids)
- Multiple teachers with different schedules
- Fair task and duty rotation needs
- WhatsApp-based staff communication

---

## How to Use

Open [fairpick.netlify.app](https://fairpick.netlify.app) on any browser — phone or desktop. No installation needed.

To self-host: download `index.html`, open in any browser, or drag onto [netlify.com/drop](https://netlify.com/drop).

---

## Data & Privacy

All data is stored in your **browser's localStorage** — it never leaves your device. Export your student list as CSV regularly. Clearing browser data will erase app data.

---

## Tech Stack

Pure HTML + CSS + JavaScript. Zero dependencies. Zero backend. Zero cost.

---

## Deploying Updates

```bash
cd fairpick
copy path\to\updated\file.html index.html
git add index.html
git commit -m "Update"
git push
```

Netlify auto-deploys from GitHub — same link, always up to date.

---

*May Allah make this a sadaqah jariyah for all involved. آمين*
