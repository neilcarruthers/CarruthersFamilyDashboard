/**
 * Carruthers Family Dashboard - General To-Do List Module
 * Backed by localStorage and synchronized with Google Sheets:
 * https://docs.google.com/spreadsheets/d/1Q1fBDl4xjNHxFl4WVvP9oYj1yytrlkq1E1SUfsGzVkg/edit?usp=drive_link
 */

const TodoModule = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const listEl = document.getElementById('todo-list-scroll');
    const badgeEl = document.getElementById('todo-count-badge');
    if (!listEl) return;

    const items = window.StorageEngine.getTodos();
    const pendingCount = items.filter(item => !item.completed).length;

    if (badgeEl) {
      badgeEl.textContent = `${pendingCount} pending`;
    }

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="empty-todo-state">
          <div class="empty-icon-sm">✨</div>
          <div class="empty-todo-text">No pending to-dos — all caught up!</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = items.map(item => `
      <div class="todo-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
        <div class="todo-item-left">
          <input type="checkbox" class="todo-checkbox" ${item.completed ? 'checked' : ''} onchange="TodoModule.toggleTodo('${item.id}')">
          <span class="todo-text">${this.escapeHtml(item.text)}</span>
          <span class="todo-cat-tag ${this.getCategoryClass(item.category)}">${this.escapeHtml(item.category || 'General')}</span>
        </div>
        <button class="todo-delete-btn" title="Delete task" onclick="TodoModule.deleteTodo('${item.id}')">
          ✕
        </button>
      </div>
    `).join('');
  },

  getCategoryClass(category) {
    const cat = (category || '').toLowerCase();
    if (cat === 'urgent') return 'cat-urgent';
    if (cat === 'home') return 'cat-home';
    if (cat === 'errand') return 'cat-errand';
    return 'cat-general';
  },

  addTodo(text, category = 'General') {
    if (!text || !text.trim()) return;

    const items = window.StorageEngine.getTodos();
    const newItem = {
      id: 't-' + Date.now(),
      text: text.trim(),
      category: category || 'General',
      completed: false,
      createdAt: Date.now()
    };

    items.unshift(newItem);
    window.StorageEngine.saveTodos(items);
    this.render();
    if (window.DashboardApp) {
      window.DashboardApp.showToast(`Added to-do: "${newItem.text}"`);
    }
  },

  toggleTodo(id) {
    const items = window.StorageEngine.getTodos();
    const item = items.find(i => i.id === id);
    if (item) {
      item.completed = !item.completed;
      window.StorageEngine.saveTodos(items);
      this.render();
    }
  },

  deleteTodo(id) {
    let items = window.StorageEngine.getTodos();
    items = items.filter(i => i.id !== id);
    window.StorageEngine.saveTodos(items);
    this.render();
  },

  clearCompleted() {
    let items = window.StorageEngine.getTodos();
    const before = items.length;
    items = items.filter(i => !i.completed);
    window.StorageEngine.saveTodos(items);
    this.render();
    if (window.DashboardApp && before > items.length) {
      window.DashboardApp.showToast('Cleared completed to-dos.');
    }
  },

  clearAll() {
    if (confirm('Are you sure you want to clear all to-do items?')) {
      window.StorageEngine.saveTodos([]);
      this.render();
      if (window.DashboardApp) {
        window.DashboardApp.showToast('To-do list cleared.');
      }
    }
  },

  bindEvents() {
    const addBtn = document.getElementById('todo-add-btn');
    const inputEl = document.getElementById('todo-new-input');
    const catSelect = document.getElementById('todo-cat-select');
    const clearCompletedBtn = document.getElementById('todo-clear-completed-btn');
    const clearAllBtn = document.getElementById('todo-clear-all-btn');

    if (addBtn && inputEl) {
      addBtn.addEventListener('click', () => {
        const text = inputEl.value;
        const cat = catSelect ? catSelect.value : 'General';
        if (text) {
          this.addTodo(text, cat);
          inputEl.value = '';
          inputEl.focus();
        }
      });

      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = inputEl.value;
          const cat = catSelect ? catSelect.value : 'General';
          if (text) {
            this.addTodo(text, cat);
            inputEl.value = '';
          }
        }
      });
    }

    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAll());
    }
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

window.TodoModule = TodoModule;
