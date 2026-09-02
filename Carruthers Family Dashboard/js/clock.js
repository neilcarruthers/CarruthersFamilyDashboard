/**
 * Carruthers Family Dashboard - Live CST Clock & Dynamic Greeting
 * Timezone: America/Winnipeg (Central Standard Time / Central Daylight Time)
 */

const ClockModule = {
  timeEl: null,
  periodEl: null,
  dateEl: null,
  greetingEl: null,
  timerId: null,

  init() {
    this.timeEl = document.getElementById('live-time');
    this.periodEl = document.getElementById('live-period');
    this.dateEl = document.getElementById('live-date');
    this.greetingEl = document.getElementById('live-greeting');

    this.update();
    this.timerId = setInterval(() => this.update(), 1000);
  },

  getWinnipegDate() {
    // Return a Date object representing the current moment
    return new Date();
  },

  update() {
    const now = this.getWinnipegDate();

    // Time formatting in America/Winnipeg
    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Winnipeg',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const parts = timeFormatter.formatToParts(now);
    const hour = parts.find(p => p.type === 'hour')?.value || '12';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || 'AM';

    if (this.timeEl) {
      this.timeEl.textContent = `${hour}:${minute}`;
    }
    if (this.periodEl) {
      this.periodEl.textContent = dayPeriod.toUpperCase();
    }

    // Date formatting: "Wednesday, September 2, 2026"
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Winnipeg',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    if (this.dateEl) {
      this.dateEl.textContent = dateFormatter.format(now);
    }

    // Warm dynamic greeting based on Central Time
    const hourFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Winnipeg',
      hour: 'numeric',
      hour12: false
    });
    const currentHour = parseInt(hourFormatter.format(now), 10);

    let greeting = 'Welcome, Carruthers Family';
    let icon = '🏡';

    if (currentHour >= 5 && currentHour < 12) {
      greeting = 'Good morning, Carruthers Family';
      icon = '☀️';
    } else if (currentHour >= 12 && currentHour < 17) {
      greeting = 'Good afternoon, Carruthers Family';
      icon = '🌤️';
    } else if (currentHour >= 17 && currentHour < 22) {
      greeting = 'Good evening, Carruthers Family';
      icon = '🌙';
    } else {
      greeting = 'Good night, Carruthers Family';
      icon = '✨';
    }

    if (this.greetingEl) {
      this.greetingEl.innerHTML = `<span>${icon}</span> <span>${greeting}</span>`;
    }
  }
};

window.ClockModule = ClockModule;
