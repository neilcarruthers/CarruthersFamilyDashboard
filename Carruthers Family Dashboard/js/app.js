/**
 * Carruthers Family Dashboard - Main Application Controller
 * Orchestrates modules, header actions, settings modal, and toast notifications.
 */

const DashboardApp = {
  init() {
    console.log('Initializing Carruthers Family Dashboard...');

    // Initialize sub-modules
    if (window.ClockModule) window.ClockModule.init();
    if (window.WeatherModule) window.WeatherModule.init();
    if (window.CalendarModule) window.CalendarModule.init();
    if (window.MealPlanner) window.MealPlanner.init();
    if (window.TodoModule) window.TodoModule.init();
    if (window.PhotoModule) window.PhotoModule.init();

    // Check Google Apps Script sync status
    if (window.StorageEngine) {
      window.StorageEngine.syncWithGoogleAppsScript(false);
    }

    this.bindHeaderActions();
    this.bindSettingsModal();
  },

  bindHeaderActions() {
    // Refresh button
    const refreshBtn = document.getElementById('header-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('rotating');
        this.showToast('Refreshing weather & calendars...');
        
        if (window.WeatherModule) window.WeatherModule.fetchWeather();
        if (window.CalendarModule) window.CalendarModule.loadCalendars();
        if (window.StorageEngine) window.StorageEngine.syncWithGoogleAppsScript(true);

        setTimeout(() => refreshBtn.classList.remove('rotating'), 1000);
      });
    }

    // Sync status pill
    const syncPill = document.getElementById('sync-status-pill');
    if (syncPill) {
      syncPill.addEventListener('click', () => {
        if (window.StorageEngine) {
          window.StorageEngine.syncWithGoogleAppsScript(true);
        }
      });
    }

    // Settings button
    const settingsBtn = document.getElementById('header-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openSettingsModal();
      });
    }
  },

  bindSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('settings-modal-close-btn');
    const cancelBtn = document.getElementById('settings-modal-cancel-btn');
    const saveBtn = document.getElementById('settings-modal-save-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeSettingsModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeSettingsModal());

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const gasInput = document.getElementById('setting-gas-endpoint');
        const driveInput = document.getElementById('setting-drive-folder');
        const intervalInput = document.getElementById('setting-photo-interval');

        const newSettings = {
          gasEndpoint: gasInput ? gasInput.value.trim() : '',
          driveFolderId: driveInput ? driveInput.value.trim() : '',
          photoIntervalMinutes: intervalInput ? parseInt(intervalInput.value, 10) || 240 : 240
        };

        window.StorageEngine.saveSettings(newSettings);
        this.closeSettingsModal();
        this.showToast('Settings saved successfully!');

        // Attempt initial sync if GAS endpoint was entered
        if (newSettings.gasEndpoint) {
          window.StorageEngine.syncWithGoogleAppsScript(true);
        }
      });
    }

    // Close on overlay click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeSettingsModal();
      });
    }
  },

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const settings = window.StorageEngine.getSettings();

    const gasInput = document.getElementById('setting-gas-endpoint');
    const driveInput = document.getElementById('setting-drive-folder');
    const intervalInput = document.getElementById('setting-photo-interval');

    if (gasInput) gasInput.value = settings.gasEndpoint || '';
    if (driveInput) driveInput.value = settings.driveFolderId || '';
    if (intervalInput) intervalInput.value = settings.photoIntervalMinutes || 240;

    if (modal) modal.classList.add('active');
  },

  closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('active');
  },

  showToast(message, duration = 3200) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span> <span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
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

window.DashboardApp = DashboardApp;

// Auto-boot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  DashboardApp.init();
});
