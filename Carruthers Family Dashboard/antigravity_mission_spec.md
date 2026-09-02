# Mission Briefing & Complete Execution Record: Carruthers Family Dashboard

## 1. Project Overview & Original Specification

Build a self-hosted, highly aesthetic, warm, and comforting family dashboard web application optimized for viewing on local network displays, wall monitors, iPads/tablets, and iPhones/smartphones. The UI utilizes soft earth tones (warm terracotta, muted olive sage, soft ivory/cream, warm sandstone, and gentle charcoal typography) to evoke a cozy, welcoming atmosphere.

---

## 2. Target Features & External Endpoints

### 1. Unified Today Card & School/Family Calendars
- **Linden Meadows School Calendar**: `https://calendar.google.com/calendar/ical/h0hk60cgc1m0b9hmpjco30k8uoekoviu%40import.calendar.google.com/public/basic.ics`
- **Family Calendar**: `https://calendar.google.com/calendar/ical/family14618050426993599120%40group.calendar.google.com/private-763f5d8968dcc5f4c04a19178d2e3341/basic.ics`
- **Unified Timeline**: Merged and sorted chronologically with dedicated badges (Olive Sage for School, Warm Terracotta for Family) and view toggles (**Today** and **Next 7 Days**).

### 2. Live CST Clock & Dynamic Greeting
- **Timezone**: Real-time clock locked to **America/Winnipeg (CST/CDT)** with AM/PM and full date format.
- **Dynamic Greetings**: Contextual family greetings reflecting time of day (*Good morning*, *Good afternoon*, *Good evening*, *Good night*).

### 3. Winnipeg Weather Module
- **Location**: Winnipeg, Manitoba, Canada (`49.8951° N, 97.1384° W`).
- **Data Source**: Open-Meteo client API (free, zero API key required).
- **Features**: Live temperature (°C), feels-like, wind speed, humidity, condition descriptions, handcrafted SVG weather icons, and a 5-day daily forecast strip.

### 4. Weekly Meal Planner & Grocery Scratchpad
- **Recipe & Menu Source**: Family Google Sheet: `https://docs.google.com/spreadsheets/d/18zTLMGamINNzKpLDZ8uLBKh9cnVI4n0H4zWfFHOWqVU/edit?usp=drive_link`
- **Interactive Grid**: Monday through Sunday cards with click-to-edit modal (meal name, recipe link, prep notes).
- **Grocery Scratchpad**: Quick ingredient export button (`+🛒`) from meals, categorization (Produce, Bakery, Dairy, Meat, Pantry, Other), check-off strikethrough, delete, and clear actions.

### 5. General To-Do List
- **To-Do Sheet Source**: Dedicated Google Sheet: `https://docs.google.com/spreadsheets/d/1Q1fBDl4xjNHxFl4WVvP9oYj1yytrlkq1E1SUfsGzVkg/edit?usp=drive_link` (Sheet ID: `1Q1fBDl4xjNHxFl4WVvP9oYj1yytrlkq1E1SUfsGzVkg`).
- **Features**: Task creation, category tagging (`General`, `Home`, `Errand`, `Urgent`), check-off strikethrough, delete, and clear completed.

### 6. Polaroid "Photo of the Day"
- **Photo Source**: Family Google Drive folder: `https://drive.google.com/drive/folders/1f-T8J2NSoASwqeqrZXSY2ROAXJVIhtWy?usp=drive_link` (Folder ID: `1f-T8J2NSoASwqeqrZXSY2ROAXJVIhtWy`).
- **Visual Styling**: Classic white Polaroid card frame with top tape sticker, soft drop shadows, caption, date, shuffle button, and cross-fade animations.

---

## 3. Complete Chronological Execution Log

### Iteration 1: Initial Architecture, UI Scaffold & Local Server
- Built semantic HTML structure (`index.html`) using CSS Custom Properties for warm earth-tone palette:
  - Background: Soft warm cream/ivory (`#FBF7F4`)
  - Card Surfaces: Sandstone white (`#FFFDF9`)
  - Primary Accent: Terracotta (`#C86D51`)
  - Secondary Accent: Olive Sage (`#7C8C73`)
  - Warm Highlight: Honey (`#D4A373`)
  - Typography: Fraunces (serif headings) & Outfit (clean sans-serif body)
- Developed modular JavaScript engine:
  - `js/clock.js`: Central Time real-time clock and dynamic family greeting.
  - `js/weather.js`: Asynchronous fetch to Open-Meteo with custom SVG weather icons and 5-day daily forecast strip.
  - `js/calendar.js`: Client-side iCalendar (`.ics`) parser and unified timeline.
  - `js/meals.js`: 7-day meal planner with click-to-edit modal and interactive grocery scratchpad.
  - `js/photos.js`: Polaroid photo card with cross-fade animations and auto-rotation timer.
  - `js/storage.js`: Local storage persistence and Google Apps Script sync client.
  - `js/app.js`: Main controller, settings modal, and toast notification system.
- Created zero-dependency Python server (`server.py`) on port 8080 with `/api/proxy` endpoint adding CORS headers to bypass Google Calendar browser restrictions.
- Added 1-click Windows launcher (`run_dashboard.bat`) and ready-to-deploy Google Apps Script (`google-apps-script/Code.gs`).

### Iteration 2: Purging Mock/Placeholder Data & Bundling Live Snapshot
- **User Directive**: Removed all synthetic/mock calendar events, placeholder recipes, and dummy grocery items.
- Removed `getSeedSchoolEvents()` and `getSeedFamilyEvents()` from `js/calendar.js`.
- Exported the live parsed Google Calendar ICS feeds into `js/real_calendars.js` as an offline snapshot fallback so zero dummy events ever appear.
- Reset `DEFAULT_MEALS` to empty strings `{ meal: '', link: '', notes: '' }` and `DEFAULT_GROCERIES` to `[]`.
- Added automated `localStorage` cache migration in `js/storage.js` to purge legacy placeholder items on reload.
- Styled unassigned days with an inviting, clickable `+ Plan dinner` dashed action card.

### Iteration 3: Smart Calendar Event Deduplication
- **User Directive**: *"where a family calendar event matches a sync'd linden meadows calendar event, only show one."*
- Implemented `normalizeTitle()`, `isSameDay()`, `isMatchingEvent()`, and `deduplicateEvents()` in `js/calendar.js`:
  - Strips parenthetical tags like `(No Classes)`, `(For Students)`, `(Linden Meadows / Pembina Trails)`.
  - Normalizes common terms (`school` vs `classes`) and removes filler stop-words (`the`, `of`, `and`, `for`, `in`, `to`, `day`, `cycle`).
  - Ignores pure cycle numbers like "Day 1", "Day 2".
  - Automatically merges matching events on the same date (e.g. *First Day of Classes*, *Thanksgiving Day*, *Remembrance Day*, *Good Friday*, *Truth and Reconciliation*, *Louis Riel Day*, *Spring Break*, *Victoria Day*).
  - Preserves informative notes like `(No Classes)` on the unified entry.
  - Retains all distinct personal family events (*Margot Dance*, *Dawson pick up*, *Harris Doctor*, *Peter vet*) with the terracotta `Family` badge.

### Iteration 4: General To-Do List & Secondary Sheet Synchronization
- **User Directive**: *"Add a general To do list card. Data is to be sync'd here https://docs.google.com/spreadsheets/d/1Q1fBDl4xjNHxFl4WVvP9oYj1yytrlkq1E1SUfsGzVkg/edit?usp=drive_link"*
- Created dedicated module `js/todos.js`:
  - Category tags: `General`, `Home`, `Errand`, `Urgent`.
  - Check-off strikethrough, delete button (`✕`), clear completed, and clear all.
  - Starts 100% clean with zero placeholder tasks.
- Extended `js/storage.js` with `getTodos()`, `saveTodos()`, and updated sync payload.
- Extended `google-apps-script/Code.gs` with `TODO_SHEET_ID = '1Q1fBDl4xjNHxFl4WVvP9oYj1yytrlkq1E1SUfsGzVkg'` and `getTodosFromSheet()` / `saveTodosToSheet()` methods.
- Added direct header link button to the Google Sheet.

### Iteration 5: Snapped 4-Column Grid & iPad/iPhone Optimizations
- **User Directive**: *"format the cards so they are snapped to a grid, have the to do list card take up the bottom 2 left side grid spots. Optimize for IPAD/iphone viewing."*
- Dissolved the 3 separate column flex containers and promoted all 6 cards into direct children of `.dashboard-grid`.
- Configured 4-column CSS grid with `align-items: stretch` so cards in each row snap to identical heights:
  - **Row 1 (Top)**:
    - Col 1: Today's Schedule (`.card-schedule`)
    - Cols 2 & 3: Weekly Meal Planner (`.card-meals`)
    - Col 4: Winnipeg Weather (`.card-weather`)
  - **Row 2 (Bottom)**:
    - **Cols 1 & 2 (Bottom 2 Left-Side Spots)**: General To-Do List (`.card-todo`)
    - Col 3: Grocery Scratchpad (`.card-groceries`)
    - Col 4: Polaroid Photo of the Day (`.card-photo`)
- **iPad Landscape (1024px – 1280px)**: Preserves 4-column snapped grid with refined padding and generous touch targets.
- **iPad Portrait (641px – 980px)**: Fluid 2-column grid (Schedule & Weather in Row 1; Meal Planner full width in Row 2; To-Do & Groceries side-by-side in Row 3; Photo in Row 4).
- **iPhone / Mobile (≤ 640px)**:
  - 1-column vertical flow with `-webkit-overflow-scrolling: touch`.
  - Added `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` with `env(safe-area-inset-*)` for iPhone notch, Dynamic Island, and home bar.
  - Locked input font size to `16px` to eliminate iOS Safari auto-zoom on focus.
  - Shifted meal days to a 2-column grid for thumb reachability.
  - Enlarged tap targets to 44px minimum and checkboxes to 22px.

### Iteration 6: Grocery Card Button Overhang Fix
- **User Report & Screenshot**: The `+ Add` button and action buttons overhung the right border of the 1-column Grocery Scratchpad card.
- **Root Cause**: Putting the text input, category dropdown, and `+ Add` button on a single horizontal flex line exceeded the available ~236px width inside a 1-column card, causing flex children with default `min-width: auto` to overflow.
- **Solution Applied**:
  - Restructured `.grocery-input-row` to a clean 2-tier layout using `flex-wrap: wrap`:
    - Top line: Text input taking 100% width (`flex: 1 1 100%; width: 100%; min-width: 0; box-sizing: border-box;`) with unclipped placeholder.
    - Bottom line: Category dropdown (`flex: 1; min-width: 0;`) + single-line `+ Add` button (`flex: 0 0 auto; white-space: nowrap; box-sizing: border-box;`).
  - Added `min-width: 0` and `word-break: break-word` to grocery items.
  - Adjusted `.btn-subtle` padding and `box-sizing: border-box`.
  - Completely eliminated all overhang across all screen sizes.

---

## 4. Final System Architecture & File Manifest

```
Carruthers Family Dashboard/
├── index.html                  # Semantic HTML shell, 6-card snapped grid, iOS meta tags
├── css/
│   └── styles.css              # Earth-tone palette, 4-col snapped grid, responsive iPad/iPhone CSS
├── js/
│   ├── app.js                  # Application controller, settings modal, toast alerts
│   ├── clock.js                # America/Winnipeg Central Time clock & family greetings
│   ├── weather.js              # Winnipeg Open-Meteo client, SVG icons, 5-day forecast
│   ├── real_calendars.js       # Bundled real ICS snapshot for zero-downtime offline fallback
│   ├── calendar.js             # Unified ICS parser & smart school/family event deduplication
│   ├── meals.js                # Weekly meal planner & grocery scratchpad
│   ├── todos.js                # General To-Do list module & Google Sheet sync
│   ├── photos.js               # Polaroid photo module, cross-fade animations, Google Drive link
│   └── storage.js              # LocalStorage engine, automated migrations & 2-way cloud sync
├── google-apps-script/
│   └── Code.gs                 # Google Apps Script Web App (Meals, Groceries, To-Dos, Drive Photos)
├── server.py                   # Lightweight Python HTTP server & CORS bypass proxy (/api/proxy)
├── run_dashboard.bat           # 1-click Windows desktop launcher
├── README.md                   # Complete documentation and setup guide
└── antigravity_mission_spec.md # This briefing, specification, and chronological execution record
```

---

## 5. Verification & Quality Assurance Results

All endpoints, assets, and features have been verified via automated test scripts:

1. **HTTP Status & Asset Integrity**:
   - `/index.html`: `Status 200 OK` (15,868 bytes)
   - `/css/styles.css`: `Status 200 OK` (32,606 bytes)
   - `/js/storage.js`: `Status 200 OK` (7,069 bytes)
   - `/js/clock.js`: `Status 200 OK` (2,756 bytes)
   - `/js/weather.js`: `Status 200 OK` (10,005 bytes)
   - `/js/calendar.js`: `Status 200 OK` (12,687 bytes)
   - `/js/meals.js`: `Status 200 OK` (9,838 bytes)
   - `/js/todos.js`: `Status 200 OK` (4,906 bytes)
   - `/js/photos.js`: `Status 200 OK` (4,238 bytes)
   - `/js/app.js`: `Status 200 OK` (5,405 bytes)
   - `/api/health`: `Status 200 OK`
   - `/api/proxy`: Proxies external APIs with CORS headers.

2. **Deduplication Verification**:
   - Total School Events Parsed: 273
   - Total Original Family Events Parsed: 27
   - Merged Duplicate Events: 8 (synced division holidays unified)
   - Distinct Family Events Retained: 19 (all personal appointments preserved)

3. **Responsive & Grid Verification**:
   - Snapped 4-column layout verified for Desktop & iPad Landscape.
   - Fluid 2-column layout verified for iPad Portrait.
   - 1-column layout with iOS safe-area insets verified for iPhone/Mobile.
   - Zero button overhang or flex blowout verified on the Grocery card.
