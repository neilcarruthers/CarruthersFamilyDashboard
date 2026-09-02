/**
 * Carruthers Family Dashboard - Weekly Meal Planner & Grocery Scratchpad
 * Monday-Sunday rotation with recipe links, click-to-edit modal,
 * one-click ingredient export, and categorized grocery checklist.
 */

const MealPlanner = {
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  dayLabels: {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  },
  
  editingDay: null,

  init() {
    this.render();
    this.renderGroceries();
    this.bindEvents();
  },

  getCurrentDayKey() {
    const dayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ...
    const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return map[dayIndex];
  },

  render() {
    const gridEl = document.getElementById('meal-days-grid');
    if (!gridEl) return;

    const meals = window.StorageEngine.getMeals();
    const currentDay = this.getCurrentDayKey();

    gridEl.innerHTML = this.days.map(dayKey => {
      const dayData = meals[dayKey] || { meal: '', link: '', notes: '' };
      const hasMeal = dayData.meal && dayData.meal.trim().length > 0;
      const isToday = dayKey === currentDay;
      const dayLabel = this.dayLabels[dayKey];

      return `
        <div class="meal-day-card ${isToday ? 'today' : ''} ${!hasMeal ? 'empty-day' : ''}" data-day="${dayKey}">
          <div class="day-header">
            <span class="day-name">${dayLabel}</span>
            <span class="day-edit-hint">✏️</span>
          </div>
          <div class="meal-title">
            ${hasMeal ? this.escapeHtml(dayData.meal) : '<span class="meal-empty-hint">+ Plan dinner</span>'}
          </div>
          <div class="meal-meta">
            ${dayData.link ? `
              <a href="${this.escapeHtml(dayData.link)}" target="_blank" rel="noopener noreferrer" class="recipe-link-btn" title="View recipe in Google Sheet" onclick="event.stopPropagation()">
                📖 Recipe
              </a>
            ` : '<span></span>'}
            ${hasMeal ? `
              <button class="meal-quick-add-btn" title="Add meal to grocery scratchpad" onclick="event.stopPropagation(); MealPlanner.addMealToGroceries('${dayKey}')">
                +🛒
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Bind click to edit
    gridEl.querySelectorAll('.meal-day-card').forEach(card => {
      card.addEventListener('click', () => {
        const day = card.getAttribute('data-day');
        this.openEditModal(day);
      });
    });
  },

  openEditModal(dayKey) {
    this.editingDay = dayKey;
    const meals = window.StorageEngine.getMeals();
    const data = meals[dayKey] || { meal: '', link: '', notes: '' };

    const titleEl = document.getElementById('meal-modal-title');
    const inputMeal = document.getElementById('edit-meal-name');
    const inputLink = document.getElementById('edit-meal-link');
    const inputNotes = document.getElementById('edit-meal-notes');
    const modal = document.getElementById('meal-edit-modal');

    if (titleEl) titleEl.textContent = `Edit ${dayKey.charAt(0).toUpperCase() + dayKey.slice(1)} Dinner`;
    if (inputMeal) inputMeal.value = data.meal || '';
    if (inputLink) inputLink.value = data.link || '';
    if (inputNotes) inputNotes.value = data.notes || '';

    if (modal) modal.classList.add('active');
  },

  closeEditModal() {
    const modal = document.getElementById('meal-edit-modal');
    if (modal) modal.classList.remove('active');
    this.editingDay = null;
  },

  saveModalChanges() {
    if (!this.editingDay) return;

    const inputMeal = document.getElementById('edit-meal-name');
    const inputLink = document.getElementById('edit-meal-link');
    const inputNotes = document.getElementById('edit-meal-notes');

    const meals = window.StorageEngine.getMeals();
    meals[this.editingDay] = {
      meal: inputMeal ? inputMeal.value.trim() : '',
      link: inputLink ? inputLink.value.trim() : '',
      notes: inputNotes ? inputNotes.value.trim() : ''
    };

    window.StorageEngine.saveMeals(meals);
    this.render();
    this.closeEditModal();
    if (window.DashboardApp) {
      window.DashboardApp.showToast(`Updated dinner for ${this.editingDay}!`);
    }
  },

  addMealToGroceries(dayKey) {
    const meals = window.StorageEngine.getMeals();
    const data = meals[dayKey];
    if (!data || !data.meal) return;

    this.addGroceryItem(`Ingredients for: ${data.meal}`, 'Other');
    if (window.DashboardApp) {
      window.DashboardApp.showToast(`Added "${data.meal}" to grocery scratchpad!`);
    }
  },

  /* ==========================================================
     Grocery Scratchpad Methods
     ========================================================== */
  renderGroceries() {
    const listEl = document.getElementById('grocery-list-scroll');
    const countBadge = document.getElementById('grocery-remaining-badge');
    if (!listEl) return;

    const items = window.StorageEngine.getGroceries();
    const remainingCount = items.filter(i => !i.completed).length;

    if (countBadge) {
      countBadge.textContent = `${remainingCount} needed`;
    }

    if (items.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 0.85rem;">
          Grocery scratchpad is clean. Add items above or click +🛒 on any planned meal.
        </div>
      `;
      return;
    }

    listEl.innerHTML = items.map(item => `
      <div class="grocery-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
        <div class="grocery-item-left">
          <input type="checkbox" class="grocery-checkbox" ${item.completed ? 'checked' : ''} onchange="MealPlanner.toggleGrocery('${item.id}')">
          <span class="grocery-text">${this.escapeHtml(item.text)}</span>
          <span class="grocery-cat-tag">${this.escapeHtml(item.category || 'Pantry')}</span>
        </div>
        <button class="grocery-delete-btn" title="Delete item" onclick="MealPlanner.deleteGrocery('${item.id}')">
          ✕
        </button>
      </div>
    `).join('');
  },

  addGroceryItem(text, category = 'Other') {
    if (!text || !text.trim()) return;

    const items = window.StorageEngine.getGroceries();
    const newItem = {
      id: 'g-' + Date.now(),
      text: text.trim(),
      category: category,
      completed: false,
      createdAt: Date.now()
    };

    items.unshift(newItem);
    window.StorageEngine.saveGroceries(items);
    this.renderGroceries();
  },

  toggleGrocery(id) {
    const items = window.StorageEngine.getGroceries();
    const item = items.find(i => i.id === id);
    if (item) {
      item.completed = !item.completed;
      window.StorageEngine.saveGroceries(items);
      this.renderGroceries();
    }
  },

  deleteGrocery(id) {
    let items = window.StorageEngine.getGroceries();
    items = items.filter(i => i.id !== id);
    window.StorageEngine.saveGroceries(items);
    this.renderGroceries();
  },

  clearCompletedGroceries() {
    let items = window.StorageEngine.getGroceries();
    const beforeCount = items.length;
    items = items.filter(i => !i.completed);
    window.StorageEngine.saveGroceries(items);
    this.renderGroceries();
    if (window.DashboardApp && beforeCount > items.length) {
      window.DashboardApp.showToast('Cleared completed grocery items.');
    }
  },

  clearAllGroceries() {
    if (confirm('Are you sure you want to clear all grocery items?')) {
      window.StorageEngine.saveGroceries([]);
      this.renderGroceries();
      if (window.DashboardApp) {
        window.DashboardApp.showToast('Grocery list cleared.');
      }
    }
  },

  bindEvents() {
    const addBtn = document.getElementById('grocery-add-btn');
    const inputEl = document.getElementById('grocery-new-input');
    const catSelect = document.getElementById('grocery-cat-select');
    const clearCheckedBtn = document.getElementById('grocery-clear-completed-btn');
    const clearAllBtn = document.getElementById('grocery-clear-all-btn');

    if (addBtn && inputEl) {
      addBtn.addEventListener('click', () => {
        const text = inputEl.value;
        const cat = catSelect ? catSelect.value : 'Pantry';
        if (text) {
          this.addGroceryItem(text, cat);
          inputEl.value = '';
          inputEl.focus();
        }
      });

      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = inputEl.value;
          const cat = catSelect ? catSelect.value : 'Pantry';
          if (text) {
            this.addGroceryItem(text, cat);
            inputEl.value = '';
          }
        }
      });
    }

    if (clearCheckedBtn) {
      clearCheckedBtn.addEventListener('click', () => this.clearCompletedGroceries());
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAllGroceries());
    }

    // Modal buttons
    const saveModalBtn = document.getElementById('meal-modal-save-btn');
    const closeModalBtn = document.getElementById('meal-modal-close-btn');
    const cancelModalBtn = document.getElementById('meal-modal-cancel-btn');

    if (saveModalBtn) saveModalBtn.addEventListener('click', () => this.saveModalChanges());
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeEditModal());
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', () => this.closeEditModal());
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

window.MealPlanner = MealPlanner;
