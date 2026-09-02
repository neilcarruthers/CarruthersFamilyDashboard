# Carruthers Family Dashboard

A self-hosted, highly aesthetic, warm, and comforting family dashboard web application designed for wall-mounted displays, tablets, and desktop browsers. Built with clean HTML5, CSS3, and vanilla JavaScript using soft earth tones (warm terracotta, olive sage, soft ivory cream, and warm sandstone).

![Dashboard Preview](https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80)

---

## Key Modules & Features

1. **Live CST Clock & Dynamic Greeting**:
   - Real-time timekeeping locked to **America/Winnipeg (Central Standard Time)**.
   - Elegant full date format (`Wednesday, September 2, 2026`).
   - Contextual time-of-day greeting for the Carruthers family (*Good morning*, *Good afternoon*, *Good evening*, *Good night*).

2. **Unified "Today" Card & Calendars**:
   - Seamlessly aggregates and sorts events from both:
     - **Linden Meadows School Calendar**: `https://calendar.google.com/calendar/ical/h0hk60cgc1m0b9hmpjco30k8uoekoviu%40import.calendar.google.com/public/basic.ics`
     - **Family Calendar**: `https://calendar.google.com/calendar/ical/family14618050426993599120%40group.calendar.google.com/private-763f5d8968dcc5f4c04a19178d2e3341/basic.ics`
   - Distinctive visual badges: Olive Sage for **Linden Meadows** and Warm Terracotta for **Family**.
   - Tab switch between **Today** and **Next 7 Days** outlook.
   - Cozy empty state: *"No more events today — enjoy a quiet evening together ✨"*.
   - Multi-tier proxy fallback (Local proxy → Public CORS proxy → Offline seed cache) ensures 100% uptime with zero CORS blocks.

3. **Winnipeg Weather Module**:
   - Location: Winnipeg, Manitoba, Canada (`49.8951° N, 97.1384° W`).
   - Powered by Open-Meteo client API (free, zero API keys required).
   - Current temperature, feels-like, wind speed, humidity, and condition description.
   - Handcrafted warm SVG weather icons matching the palette.
   - 5-Day daily outlook strip with min/max temperatures.

4. **Weekly Meal Planner & Grocery Scratchpad**:
   - Monday-through-Sunday visual meal planner with recipe tags and links directly to recipes in the family [Google Sheet](https://docs.google.com/spreadsheets/d/18zTLMGamINNzKpLDZ8uLBKh9cnVI4n0H4zWfFHOWqVU/edit?usp=drive_link).
   - Click any day card to edit dinner name, recipe URL, or cooking notes.
   - One-click `+🛒` button to export a meal directly to the grocery list.
   - Interactive grocery checklist with categorized items (Produce, Bakery, Dairy, Meat, Pantry, Other), check-off strikethrough, delete, and clear actions.
   - Zero-downtime persistence via `localStorage` with automated Google Sheets sync.

5. **General To-Do List**:
   - Clean, interactive task manager with category tags (`General`, `Home`, `Errand`, `Urgent`).
   - Check off tasks with strikethrough styling, delete individual items, or clear completed.
   - Two-way sync with your [To-Do Google Sheet](https://docs.google.com/spreadsheets/d/1Q1fBDl4xjNHxFl4WVvP9oYj1yytrlkq1E1SUfsGzVkg/edit?usp=drive_link).
   - Starts 100% clean with zero placeholder tasks.

6. **Polaroid "Photo of the Day"**:
   - Framed in a vintage white Polaroid photo card with tape sticker and warm drop shadows.
   - Gentle cross-fade transition when rotating photos.
   - Connected to Google Drive folder (`1f-T8J2NSoASwqeqrZXSY2ROAXJVIhtWy`) via Google Apps Script.
   - Pre-seeded with high-resolution family & nature memories so the display is never blank.
   - Next/shuffle photo button and customizable auto-rotation interval.

---

## File Structure

```
Carruthers Family Dashboard/
├── index.html                  # Semantic dashboard markup & CSS grid shell
├── css/
│   └── styles.css              # Warm earth-tone palette, typography & responsive layouts
├── js/
│   ├── app.js                  # Main controller, header actions & settings modal
│   ├── clock.js                # America/Winnipeg CST clock & dynamic greetings
│   ├── weather.js              # Winnipeg Open-Meteo weather & 5-day forecast
│   ├── calendar.js             # Unified iCalendar (.ics) parser & timeline
│   ├── meals.js                # Weekly meal planner & grocery scratchpad
│   ├── todos.js                # General To-Do list module & Google Sheet sync
│   ├── photos.js               # Polaroid photo module & transitions
│   └── storage.js              # LocalStorage persistence & Google sync engine
├── google-apps-script/
│   └── Code.gs                 # Ready-to-deploy Google Apps Script for Sheets & Drive
├── server.py                   # Lightweight Python server with built-in CORS proxy
├── run_dashboard.bat           # 1-click launcher for Windows
└── README.md                   # Complete documentation & setup instructions
```

---

## Quick Start (Running Locally)

### Option A: 1-Click Windows Launcher (Recommended)
Simply double-click:
```cmd
run_dashboard.bat
```
This starts the local Python server at `http://localhost:8080` and opens your browser automatically.

### Option B: Manual Command Line
Open PowerShell or Command Prompt in this folder and run:
```bash
python server.py
```
Then navigate to `http://localhost:8080` in any browser or tablet on your local network.

---

## Google Sheets & Google Drive Sync Setup

The dashboard works offline immediately using `localStorage`. To enable live two-way synchronization with your Google Sheet and Google Drive photos:

1. Open your [Google Sheet](https://docs.google.com/spreadsheets/d/18zTLMGamINNzKpLDZ8uLBKh9cnVI4n0H4zWfFHOWqVU/edit?usp=drive_link).
2. Click **Extensions** > **Apps Script**.
3. Delete any default code in the editor, and paste the entire contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs).
4. Click the blue **Deploy** button (top right) > **New deployment**.
5. Click the gear icon next to "Select type" and choose **Web app**.
6. Configure the deployment:
   - **Description**: `Carruthers Dashboard Sync`
   - **Execute as**: `Me` (your Google account)
   - **Who has access**: `Anyone` (allows your dashboard display to sync without logging in)
7. Click **Deploy**, click **Authorize access**, and copy the resulting **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).
8. In the Carruthers Family Dashboard:
   - Click the **Settings (gear)** icon in the top-right corner.
   - Paste the Web App URL into the **Google Apps Script Web App URL** field.
   - Click **Save Settings**.
9. The status pill in the header will show **Google Synced** with a green indicator!

---

## Displaying on a Wall Tablet or Smart Display

For wall displays or tablets (iPad, Android tablet, Raspberry Pi touchscreen):
1. Find your computer's local IP address (e.g., `ipconfig` -> `192.168.1.50`).
2. Keep `server.py` running on your local network.
3. On the tablet browser, open `http://192.168.1.50:8080`.
4. In iOS Safari: Tap **Share** > **Add to Home Screen** to run in full-screen kiosk mode.
5. In Android Chrome: Tap **Menu (⋮)** > **Install App** or **Add to Home screen**.

---

## Design Palette Specifications

| Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Cream / Ivory** | `#FBF7F4` | Primary dashboard background |
| **Sandstone White** | `#FFFDF9` | Card surfaces with soft warm shadows |
| **Terracotta** | `#C86D51` | Primary accent, Family events, dinner highlights |
| **Olive Sage** | `#7C8C73` | Secondary accent, Linden Meadows school events |
| **Sandstone Beige** | `#DBC8B6` | Borders, subtle dividers, polaroid tape |
| **Warm Charcoal** | `#3D3A37` | High-contrast comfortable typography |
