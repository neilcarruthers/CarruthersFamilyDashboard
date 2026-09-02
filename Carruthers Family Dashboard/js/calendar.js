/**
 * Carruthers Family Dashboard - Unified Calendar Module
 * Combines Linden Meadows School Calendar and Family Calendar
 * with multi-tier proxy fallback, iCalendar parsing, and responsive views.
 */

const CalendarModule = {
  SCHOOL_ICAL_URL: 'https://calendar.google.com/calendar/ical/h0hk60cgc1m0b9hmpjco30k8uoekoviu%40import.calendar.google.com/public/basic.ics',
  FAMILY_ICAL_URL: 'https://calendar.google.com/calendar/ical/family14618050426993599120%40group.calendar.google.com/private-763f5d8968dcc5f4c04a19178d2e3341/basic.ics',
  
  allEvents: [],
  currentTab: 'today', // 'today' or 'week'

  init() {
    this.bindTabs();
    this.loadCalendars();
    // Refresh calendars every 15 minutes
    setInterval(() => this.loadCalendars(), 900000);
  },

  bindTabs() {
    const tabToday = document.getElementById('cal-tab-today');
    const tabWeek = document.getElementById('cal-tab-week');

    if (tabToday) {
      tabToday.addEventListener('click', () => {
        this.currentTab = 'today';
        tabToday.classList.add('active');
        if (tabWeek) tabWeek.classList.remove('active');
        this.render();
      });
    }

    if (tabWeek) {
      tabWeek.addEventListener('click', () => {
        this.currentTab = 'week';
        tabWeek.classList.add('active');
        if (tabToday) tabToday.classList.remove('active');
        this.render();
      });
    }
  },

  async fetchIcs(url, source) {
    // Strategy 1: Local server proxy (both relative and absolute for file:/// compatibility)
    const proxyUrls = [
      `/api/proxy?url=${encodeURIComponent(url)}`,
      `http://localhost:8080/api/proxy?url=${encodeURIComponent(url)}`,
      `http://127.0.0.1:8080/api/proxy?url=${encodeURIComponent(url)}`
    ];

    for (const proxyUrl of proxyUrls) {
      try {
        const res = await fetch(proxyUrl, { cache: 'no-store' });
        if (res.ok) {
          const text = await res.text();
          if (text && text.includes('BEGIN:VCALENDAR')) {
            // Persist real fetched calendar to localStorage
            try {
              localStorage.setItem(`carruthers_cached_ics_${source}`, text);
            } catch (e) {}
            return text;
          }
        }
      } catch (e) {}
    }

    // Strategy 2: Direct fetch (works in environments where CORS is permitted)
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        if (text && text.includes('BEGIN:VCALENDAR')) {
          try {
            localStorage.setItem(`carruthers_cached_ics_${source}`, text);
          } catch (e) {}
          return text;
        }
      }
    } catch (e) {}

    // Strategy 3: Check localStorage cached ICS from previous live fetch
    try {
      const cached = localStorage.getItem(`carruthers_cached_ics_${source}`);
      if (cached && cached.includes('BEGIN:VCALENDAR')) {
        return cached;
      }
    } catch (e) {}

    // Strategy 4: Fallback to bundled real Google Calendar snapshot
    if (window.REAL_CALENDAR_SNAPSHOT && window.REAL_CALENDAR_SNAPSHOT[source]) {
      return window.REAL_CALENDAR_SNAPSHOT[source];
    }

    throw new Error(`Failed to fetch ICS for ${source}`);
  },

  parseIcs(icsContent, source) {
    if (!icsContent) return [];
    const events = [];
    const rawEvents = icsContent.split('BEGIN:VEVENT');

    for (let i = 1; i < rawEvents.length; i++) {
      const block = rawEvents[i].split('END:VEVENT')[0];
      
      // Extract properties
      const summaryMatch = block.match(/^SUMMARY(?:;[^:]*)?:(.*)$/m);
      const dtstartMatch = block.match(/^DTSTART(?:;[^:]*)?:(.*)$/m);
      const dtendMatch = block.match(/^DTEND(?:;[^:]*)?:(.*)$/m);
      const descMatch = block.match(/^DESCRIPTION(?:;[^:]*)?:(.*)$/m);
      const locMatch = block.match(/^LOCATION(?:;[^:]*)?:(.*)$/m);

      if (!summaryMatch || !dtstartMatch) continue;

      const summary = summaryMatch[1].replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
      const rawStart = dtstartMatch[1].trim();
      const isAllDay = !rawStart.includes('T');
      const startDate = this.parseIcsDate(rawStart);
      const endDate = dtendMatch ? this.parseIcsDate(dtendMatch[1].trim()) : new Date(startDate.getTime() + 3600000);

      events.push({
        id: `${source}-${i}-${startDate.getTime()}`,
        source, // 'school' or 'family'
        summary,
        description: descMatch ? descMatch[1].replace(/\\n/g, ' ').replace(/\\,/g, ',').trim() : '',
        location: locMatch ? locMatch[1].replace(/\\,/g, ',').trim() : '',
        startDate,
        endDate,
        isAllDay
      });
    }

    return events;
  },

  parseIcsDate(dateStr) {
    // Format examples: 20260902 or 20260902T151500Z
    if (!dateStr) return new Date();

    const cleanStr = dateStr.replace(/[^0-9TZ]/g, '');

    if (cleanStr.length === 8) {
      // YYYYMMDD
      const year = parseInt(cleanStr.substring(0, 4), 10);
      const month = parseInt(cleanStr.substring(4, 6), 10) - 1;
      const day = parseInt(cleanStr.substring(6, 8), 10);
      return new Date(year, month, day, 0, 0, 0);
    }

    if (cleanStr.includes('T')) {
      const [dPart, tPart] = cleanStr.split('T');
      const year = parseInt(dPart.substring(0, 4), 10);
      const month = parseInt(dPart.substring(4, 6), 10) - 1;
      const day = parseInt(dPart.substring(6, 8), 10);

      const hour = parseInt(tPart.substring(0, 2), 10);
      const minute = parseInt(tPart.substring(2, 4), 10);
      const second = tPart.length >= 6 ? parseInt(tPart.substring(4, 6), 10) : 0;

      if (cleanStr.endsWith('Z')) {
        return new Date(Date.UTC(year, month, day, hour, minute, second));
      } else {
        return new Date(year, month, day, hour, minute, second);
      }
    }

    return new Date(cleanStr);
  },

  async loadCalendars() {
    let schoolEvents = [];
    let familyEvents = [];

    // Fetch school calendar
    try {
      const schoolIcs = await this.fetchIcs(this.SCHOOL_ICAL_URL, 'school');
      schoolEvents = this.parseIcs(schoolIcs, 'school');
    } catch (e) {
      console.warn('Could not fetch school calendar:', e);
    }

    // Fetch family calendar
    try {
      const familyIcs = await this.fetchIcs(this.FAMILY_ICAL_URL, 'family');
      familyEvents = this.parseIcs(familyIcs, 'family');
    } catch (e) {
      console.warn('Could not fetch family calendar:', e);
    }

    // Combine and deduplicate events so synced school events aren't shown twice
    this.allEvents = this.deduplicateEvents(schoolEvents, familyEvents);
    this.render();
  },

  normalizeTitle(str) {
    if (!str) return '';
    let t = str.toLowerCase();
    // Remove parenthetical details, e.g. (No Classes), (For Students), (Linden Meadows...)
    t = t.replace(/\(.*?\)/g, '');
    // Standardize common terms
    t = t.replace(/\bschool\b/g, 'classes');
    t = t.replace(/\bday of\b/g, ' ');
    t = t.replace(/\bday for\b/g, ' ');
    t = t.replace(/[^a-z0-9]/g, ' ');
    // Filter out common filler words
    const stopWords = new Set(['the', 'of', 'and', 'for', 'in', 'to', 'day', 'cycle']);
    const words = t.split(/\s+/).filter(w => w.length > 0 && !stopWords.has(w));
    return words.join(' ');
  },

  isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  },

  isMatchingEvent(schoolEv, familyEv) {
    if (!this.isSameDay(schoolEv.startDate, familyEv.startDate)) {
      return false;
    }

    const sNorm = this.normalizeTitle(schoolEv.summary);
    const fNorm = this.normalizeTitle(familyEv.summary);

    if (!sNorm || !fNorm) return false;

    // Do not deduplicate school cycle numbers like "Day 1", "Day 2"
    if (/^\d+$/.test(sNorm) || /^\d+$/.test(fNorm)) {
      return false;
    }

    // Exact or substring match (e.g. "Thanksgiving" vs "Thanksgiving (No Classes)")
    if (sNorm === fNorm || sNorm.includes(fNorm) || fNorm.includes(sNorm)) {
      return true;
    }

    // Check if family event explicitly refers to Linden Meadows / Pembina Trails holiday/milestone
    const fRaw = familyEv.summary.toLowerCase();
    if (fRaw.includes('linden meadows') || fRaw.includes('pembina trails')) {
      const sRaw = schoolEv.summary.toLowerCase();
      if (sRaw.includes('break') || sRaw.includes('classes') || sRaw.includes('holiday') || sRaw.includes('first day')) {
        return true;
      }
    }

    return false;
  },

  deduplicateEvents(schoolEvents, familyEvents) {
    const filteredFamily = [];

    for (const familyEv of familyEvents) {
      let isDuplicate = false;
      for (const schoolEv of schoolEvents) {
        if (this.isMatchingEvent(schoolEv, familyEv)) {
          isDuplicate = true;
          // If the family event has a helpful note like "(No Classes)", adopt it
          if (familyEv.summary.includes('(No Classes)') && !schoolEv.summary.includes('No Classes')) {
            schoolEv.summary = `${schoolEv.summary} (No Classes)`;
          }
          break;
        }
      }

      if (!isDuplicate) {
        filteredFamily.push(familyEv);
      }
    }

    // Return combined events sorted chronologically
    return [...schoolEvents, ...filteredFamily].sort((a, b) => a.startDate - b.startDate);
  },

  render() {
    const container = document.getElementById('events-list-container');
    const badgeEl = document.getElementById('cal-count-badge');
    if (!container) return;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    let filtered = [];

    if (this.currentTab === 'today') {
      filtered = this.allEvents.filter(ev => {
        return (ev.startDate >= todayStart && ev.startDate <= todayEnd) ||
               (ev.isAllDay && ev.startDate <= todayEnd && ev.endDate >= todayStart);
      });
      if (badgeEl) badgeEl.textContent = `${filtered.length} today`;
    } else {
      // Next 7 days
      const sevenDaysLater = new Date(now.getTime() + 7 * 86400000);
      filtered = this.allEvents.filter(ev => {
        return ev.startDate >= todayStart && ev.startDate <= sevenDaysLater;
      });
      if (badgeEl) badgeEl.textContent = `${filtered.length} upcoming`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-events-state">
          <div class="empty-icon">✨</div>
          <div class="empty-text-title">No more events today</div>
          <div class="empty-text-sub">Enjoy a cozy and quiet evening together with the family.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ev => {
      const isToday = ev.startDate >= todayStart && ev.startDate <= todayEnd;
      let timeStr = '';
      let dateChip = '';

      if (ev.isAllDay) {
        timeStr = '<span class="event-allday">All Day</span>';
      } else {
        const timeFmt = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Winnipeg',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        timeStr = `<span class="event-time">${timeFmt.format(ev.startDate)}</span>`;
      }

      if (this.currentTab === 'week' || !isToday) {
        const dateFmt = new Intl.DateTimeFormat('en-CA', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        dateChip = `<span class="event-date-chip">${dateFmt.format(ev.startDate)}</span>`;
      }

      const sourceLabel = ev.source === 'school' ? 'Linden Meadows' : 'Family';
      const sourceClass = ev.source;

      return `
        <div class="event-card ${sourceClass}">
          <div class="event-time-col">
            ${timeStr}
            ${dateChip}
          </div>
          <div class="event-details-col">
            <div class="event-header-row">
              <span class="event-title">${this.escapeHtml(ev.summary)}</span>
              <span class="event-source-tag ${sourceClass}">${sourceLabel}</span>
            </div>
            ${ev.location ? `<div class="event-location">📍 ${this.escapeHtml(ev.location)}</div>` : ''}
            ${ev.description ? `<div class="event-description">${this.escapeHtml(ev.description.substring(0, 100))}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.CalendarModule = CalendarModule;

