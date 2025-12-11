/**
 * MoodPad — Main Application
 * Emoji Mood Journal
 */

import { saveMood, getMood, downloadCSV, getAllMoods } from './storage.js';
import { initCalendar, renderCalendar, getCurrentMonth } from './calendar.js';
import { renderStats } from './stats.js';
import { loadDemoData, isDemoMode, setDemoMode } from './demo.js';
import {
    initTheme,
    toggleTheme,
    renderTagsSection,
    renderInsights,
    renderPatterns,
    renderYearReview,
    enableReminder,
    disableReminder,
    isReminderEnabled,
    getAllEmojis,
    addCustomEmoji,
    removeCustomEmoji,
    handleFileImport,
    registerServiceWorker
} from './features.js';

// Available moods - now dynamic
const DEFAULT_MOODS = [
    { emoji: '😊', name: 'happy', label: 'Happy' },
    { emoji: '😢', name: 'sad', label: 'Sad' },
    { emoji: '😠', name: 'angry', label: 'Angry' },
    { emoji: '😴', name: 'tired', label: 'Tired' },
    { emoji: '😍', name: 'love', label: 'Loving' },
    { emoji: '😰', name: 'anxious', label: 'Anxious' },
    { emoji: '😐', name: 'neutral', label: 'Neutral' }
];

// Emoji to mood name mapping
const emojiToMood = {
    '😊': 'happy',
    '😢': 'sad',
    '😠': 'angry',
    '😴': 'tired',
    '😍': 'love',
    '😰': 'anxious',
    '😐': 'neutral'
};

// App state
let selectedEmoji = null;
let selectedDate = null;

/**
 * Initialize the application
 */
function init() {
    // Register service worker for PWA
    registerServiceWorker();

    // Initialize theme
    initTheme();

    // Set today's date
    const today = new Date();
    selectedDate = today.toISOString().split('T')[0];

    // Update header date
    updateDateDisplay();

    // Initialize mood picker
    initMoodPicker();

    // Initialize calendar with day click handler
    initCalendar(handleDayClick);

    // Load today's mood if exists
    loadMoodForDate(selectedDate);

    // Render stats
    const { year, month } = getCurrentMonth();
    renderStats(year, month);

    // Render insights and patterns
    renderInsights('insightsContainer');
    renderPatterns('patternsContainer');

    // Set up event listeners
    setupEventListeners();

    // Check if demo was previously enabled
    if (isDemoMode() && getAllMoods().length === 0) {
        loadDemoData();
        refreshUI();
    }

    // Update reminder toggle state
    updateReminderState();

    console.log('MoodPad initialized!');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Export button
    document.getElementById('exportBtn')?.addEventListener('click', handleExport);

    // Demo button
    document.getElementById('demoBtn')?.addEventListener('click', handleDemo);

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    // Reminder toggle
    document.getElementById('reminderToggle')?.addEventListener('click', handleReminderToggle);

    // Import button
    document.getElementById('importBtn')?.addEventListener('click', () => {
        document.getElementById('importFile')?.click();
    });

    // Import file input
    document.getElementById('importFile')?.addEventListener('change', handleImportFile);

    // Year review button
    document.getElementById('yearReviewBtn')?.addEventListener('click', () => {
        showYearReviewModal();
    });

    // Settings button
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        showSettingsModal();
    });
}

/**
 * Update the date display in header
 */
function updateDateDisplay() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const date = new Date(selectedDate);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = date.toLocaleDateString('en-US', options);
    }
}

/**
 * Initialize mood picker buttons
 */
function initMoodPicker() {
    const grid = document.getElementById('moodGrid');
    if (!grid) return;

    const emojis = getAllEmojis();

    grid.innerHTML = emojis.map(emoji => {
        const moodName = emojiToMood[emoji] || 'custom';
        const moodData = DEFAULT_MOODS.find(m => m.emoji === emoji);
        const label = moodData?.label || 'Custom';

        return `
      <button 
        class="mood-btn" 
        data-mood="${moodName}" 
        data-emoji="${emoji}"
        aria-label="${label}"
        title="${label}"
      >
        ${emoji}
      </button>
    `;
    }).join('');

    // Add click handlers
    grid.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => selectMood(btn.dataset.emoji, btn.dataset.mood));
    });

    // Note textarea save on input
    const noteInput = document.getElementById('moodNote');
    noteInput?.addEventListener('input', debounce(handleSave, 500));
}

/**
 * Select a mood emoji
 */
function selectMood(emoji, moodName) {
    selectedEmoji = emoji;

    // Update UI
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.toggle('mood-btn--selected', btn.dataset.emoji === emoji);
    });

    // Auto-save
    handleSave();
}

/**
 * Handle saving the mood
 */
function handleSave() {
    if (!selectedEmoji || !selectedDate) return;

    const noteInput = document.getElementById('moodNote');
    const note = noteInput?.value || '';

    saveMood(selectedDate, selectedEmoji, note);

    // Show saved indicator
    showSavedIndicator();

    // Refresh calendar and stats
    refreshUI();
}

/**
 * Show "Saved!" indicator
 */
function showSavedIndicator() {
    const indicator = document.getElementById('savedIndicator');
    if (indicator) {
        indicator.classList.add('mood-picker__saved--visible');
        setTimeout(() => {
            indicator.classList.remove('mood-picker__saved--visible');
        }, 2000);
    }
}

/**
 * Refresh calendar and stats
 */
function refreshUI() {
    renderCalendar();
    const { year, month } = getCurrentMonth();
    renderStats(year, month);
    renderInsights('insightsContainer');
    renderPatterns('patternsContainer');

    // Update tags if visible
    if (selectedDate) {
        renderTagsSection('tagsContainer', selectedDate);
    }
}

/**
 * Handle day click in calendar
 */
function handleDayClick(dateStr, moodData) {
    selectedDate = dateStr;
    updateDateDisplay();
    loadMoodForDate(dateStr);

    // Update tags section
    renderTagsSection('tagsContainer', dateStr);

    if (moodData) {
        showMoodModal(dateStr, moodData);
    }
}

/**
 * Load mood for a specific date into the picker
 */
function loadMoodForDate(dateStr) {
    const mood = getMood(dateStr);

    // Reset selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('mood-btn--selected');
    });

    const noteInput = document.getElementById('moodNote');

    if (mood) {
        selectedEmoji = mood.emoji;
        const btn = document.querySelector(`.mood-btn[data-emoji="${mood.emoji}"]`);
        btn?.classList.add('mood-btn--selected');
        if (noteInput) noteInput.value = mood.note || '';
    } else {
        selectedEmoji = null;
        if (noteInput) noteInput.value = '';
    }

    // Update tags
    renderTagsSection('tagsContainer', dateStr);
}

/**
 * Show mood detail modal
 */
function showMoodModal(dateStr, moodData) {
    const overlay = document.getElementById('modalOverlay');
    const modalDate = document.getElementById('modalDate');
    const modalEmoji = document.getElementById('modalEmoji');
    const modalNote = document.getElementById('modalNote');
    const modalTags = document.getElementById('modalTags');

    if (!overlay) return;

    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    if (modalDate) modalDate.textContent = date.toLocaleDateString('en-US', options);
    if (modalEmoji) modalEmoji.textContent = moodData.emoji;
    if (modalNote) {
        modalNote.textContent = moodData.note || 'No note for this day';
        modalNote.style.fontStyle = moodData.note ? 'normal' : 'italic';
    }
    if (modalTags && moodData.tags?.length > 0) {
        modalTags.innerHTML = moodData.tags.map(t => `<span class="tag">#${t}</span>`).join('');
    } else if (modalTags) {
        modalTags.innerHTML = '';
    }

    overlay.classList.add('modal-overlay--visible');

    // Close handlers
    const closeBtn = document.getElementById('modalClose');
    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', handleModalKeydown);
}

/**
 * Close modal
 */
function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay?.classList.remove('modal-overlay--visible');
    document.removeEventListener('keydown', handleModalKeydown);
}

/**
 * Handle modal keydown
 */
function handleModalKeydown(e) {
    if (e.key === 'Escape') closeModal();
}

/**
 * Handle export button click
 */
function handleExport() {
    downloadCSV();
    showToast('Mood data exported to CSV!');
}

/**
 * Handle demo button click
 */
function handleDemo() {
    if (confirm('This will add 3 months of sample mood data. Continue?')) {
        const count = loadDemoData(true);
        setDemoMode(true);
        refreshUI();
        showToast(`Loaded ${count} sample entries!`);
    }
}

/**
 * Handle reminder toggle
 */
async function handleReminderToggle() {
    if (isReminderEnabled()) {
        disableReminder();
        showToast('Daily reminders disabled');
    } else {
        const enabled = await enableReminder();
        if (enabled) {
            showToast('Daily reminders enabled! You\'ll be reminded at 8 PM.');
        } else {
            showToast('Could not enable reminders. Please allow notifications.');
        }
    }
    updateReminderState();
}

/**
 * Update reminder toggle state
 */
function updateReminderState() {
    const toggle = document.getElementById('reminderToggle');
    if (toggle) {
        toggle.classList.toggle('toggle-switch--active', isReminderEnabled());
    }
}

/**
 * Handle file import
 */
async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const count = await handleFileImport(file);
        refreshUI();
        showToast(`Imported ${count} mood entries!`);
    } catch (err) {
        showToast(`Import failed: ${err.message}`);
    }

    // Reset input
    e.target.value = '';
}

/**
 * Show year review modal
 */
function showYearReviewModal() {
    const overlay = document.getElementById('yearReviewOverlay');
    if (!overlay) return;

    renderYearReview('yearReviewContent', new Date().getFullYear());
    overlay.classList.add('modal-overlay--visible');

    const closeBtn = document.getElementById('yearReviewClose');
    closeBtn?.addEventListener('click', () => {
        overlay.classList.remove('modal-overlay--visible');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('modal-overlay--visible');
        }
    });
}

/**
 * Show settings modal
 */
function showSettingsModal() {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return;

    overlay.classList.add('modal-overlay--visible');

    const closeBtn = document.getElementById('settingsClose');
    closeBtn?.addEventListener('click', () => {
        overlay.classList.remove('modal-overlay--visible');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('modal-overlay--visible');
        }
    });
}

/**
 * Show toast notification
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('toast--visible', 'toast--success');

    setTimeout(() => {
        toast.classList.remove('toast--visible', 'toast--success');
    }, 3000);
}

/**
 * Debounce utility
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
