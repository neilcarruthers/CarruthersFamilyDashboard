/**
 * Carruthers Family Dashboard - Storage & Google Sync Engine
 * Handles offline-first persistence with localStorage and two-way sync
 * with Google Sheets via Google Apps Script Web App endpoints.
 */

const DEFAULT_SETTINGS = {
  gasEndpoint: '', // Configured via settings modal
  driveFolderId: '1f-T8J2NSoASwqeqrZXSY2ROAXJVIhtWy',
  tempUnit: 'celsius',
  clockFormat: '12h',
  photoIntervalMinutes: 240, // 4 hours
  sheetUrl: 'https://docs.google.com/spreadsheets/d/18zTLMGamINNzKpLDZ8uLBKh9cnVI4n0H4zWfFHOWqVU/edit?usp=drive_link',
  todoSheetUrl: 'https://docs.google.com/spreadsheets/d/1Q1fBDl4xjNHxFl4WVvP9oYj1yytrlkq1E1SUfsGzVkg/edit?usp=drive_link'
};

const DEFAULT_MEALS = {
  monday: { meal: '', link: '', notes: '' },
  tuesday: { meal: '', link: '', notes: '' },
  wednesday: { meal: '', link: '', notes: '' },
  thursday: { meal: '', link: '', notes: '' },
  friday: { meal: '', link: '', notes: '' },
  saturday: { meal: '', link: '', notes: '' },
  sunday: { meal: '', link: '', notes: '' }
};

const DEFAULT_GROCERIES = [];
const DEFAULT_TODOS = [];

const StorageEngine = {
  getSettings() {
    try {
      const raw = localStorage.getItem('carruthers_settings');
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn('Error reading settings, using defaults:', e);
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(newSettings) {
    try {
      const merged = { ...this.getSettings(), ...newSettings };
      localStorage.setItem('carruthers_settings', JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error('Error saving settings:', e);
      return null;
    }
  },

  getMeals() {
    try {
      const raw = localStorage.getItem('carruthers_meal_plan');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Automatically purge dummy placeholder data if previously cached
        if (parsed.monday && parsed.monday.meal && parsed.monday.meal.includes('Lemon Herb Roast Chicken')) {
          localStorage.removeItem('carruthers_meal_plan');
          return { ...DEFAULT_MEALS };
        }
        return parsed;
      }
      return { ...DEFAULT_MEALS };
    } catch (e) {
      console.warn('Error reading meal plan:', e);
      return { ...DEFAULT_MEALS };
    }
  },

  saveMeals(meals) {
    try {
      localStorage.setItem('carruthers_meal_plan', JSON.stringify(meals));
      this.triggerBackgroundSync();
      return true;
    } catch (e) {
      console.error('Error saving meal plan:', e);
      return false;
    }
  },

  getGroceries() {
    try {
      const raw = localStorage.getItem('carruthers_groceries');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Automatically purge dummy placeholder groceries if previously cached
        if (Array.isArray(parsed) && parsed.some(i => i.text && i.text.includes('Whole organic milk'))) {
          localStorage.removeItem('carruthers_groceries');
          return [];
        }
        return parsed;
      }
      return [];
    } catch (e) {
      console.warn('Error reading groceries:', e);
      return [];
    }
  },

  saveGroceries(items) {
    try {
      localStorage.setItem('carruthers_groceries', JSON.stringify(items));
      this.triggerBackgroundSync();
      return true;
    } catch (e) {
      console.error('Error saving groceries:', e);
      return false;
    }
  },

  getTodos() {
    try {
      const raw = localStorage.getItem('carruthers_todos');
      return raw ? JSON.parse(raw) : [...DEFAULT_TODOS];
    } catch (e) {
      console.warn('Error reading todos:', e);
      return [...DEFAULT_TODOS];
    }
  },

  saveTodos(items) {
    try {
      localStorage.setItem('carruthers_todos', JSON.stringify(items));
      this.triggerBackgroundSync();
      return true;
    } catch (e) {
      console.error('Error saving todos:', e);
      return false;
    }
  },

  // Trigger Google Apps Script sync if endpoint is configured
  async syncWithGoogleAppsScript(isManual = false) {
    const settings = this.getSettings();
    const endpoint = settings.gasEndpoint && settings.gasEndpoint.trim();

    const statusPill = document.getElementById('sync-status-pill');
    const statusDot = document.getElementById('sync-status-dot');
    const statusText = document.getElementById('sync-status-text');

    if (!endpoint) {
      if (statusText) statusText.textContent = 'Local Cache';
      if (statusDot) statusDot.className = 'status-dot';
      if (isManual && window.DashboardApp) {
        window.DashboardApp.showToast('Using local storage. Add Google Apps Script URL in Settings to sync with Google Sheets.');
      }
      return false;
    }

    try {
      if (statusText) statusText.textContent = 'Syncing...';
      if (statusDot) statusDot.className = 'status-dot syncing';

      // Push current local state and fetch cloud updates
      const payload = {
        action: 'sync',
        timestamp: Date.now(),
        meals: this.getMeals(),
        groceries: this.getGroceries(),
        todos: this.getTodos()
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' }, // Avoid CORS preflight on Google Apps Script
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // If remote returned updated data, merge gracefully
      if (data.meals) {
        localStorage.setItem('carruthers_meal_plan', JSON.stringify(data.meals));
        if (window.MealPlanner) window.MealPlanner.render();
      }
      if (data.groceries) {
        localStorage.setItem('carruthers_groceries', JSON.stringify(data.groceries));
        if (window.MealPlanner) window.MealPlanner.renderGroceries();
      }
      if (data.todos) {
        localStorage.setItem('carruthers_todos', JSON.stringify(data.todos));
        if (window.TodoModule) window.TodoModule.render();
      }

      if (statusText) statusText.textContent = 'Google Synced';
      if (statusDot) statusDot.className = 'status-dot';
      if (isManual && window.DashboardApp) {
        window.DashboardApp.showToast('Successfully synchronized with Google Sheets!');
      }
      return true;
    } catch (err) {
      console.warn('Google Apps Script sync attempt failed, staying on local fallback:', err);
      if (statusText) statusText.textContent = 'Local Cache';
      if (statusDot) statusDot.className = 'status-dot';
      if (isManual && window.DashboardApp) {
        window.DashboardApp.showToast('Could not reach Google Sheets endpoint. Saved to local storage.');
      }
      return false;
    }
  },

  // Debounced background sync
  syncTimeout: null,
  triggerBackgroundSync() {
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncWithGoogleAppsScript(false);
    }, 2000);
  }
};

window.StorageEngine = StorageEngine;
