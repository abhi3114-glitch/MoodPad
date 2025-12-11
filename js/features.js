/**
 * MoodPad Enhanced Features Module
 * Theme toggle, tags, insights, patterns, year review, reminders, custom emojis
 */

import { getAllMoods, getMoodsForMonth, saveMood, getMood } from './storage.js';

// ==========================================
// THEME TOGGLE
// ==========================================

const THEME_KEY = 'moodpad_theme';

/**
 * Initialize theme from localStorage or system preference
 */
export function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');

    setTheme(theme);
    updateThemeIcon();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
            updateThemeIcon();
        }
    });
}

/**
 * Set theme
 */
export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    updateThemeIcon();
}

/**
 * Update theme toggle button icon
 */
function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (btn) {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        btn.textContent = current === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

// ==========================================
// TAGS SYSTEM
// ==========================================

const TAGS_KEY = 'moodpad_tags';

/**
 * Get all used tags
 */
export function getAllTags() {
    const moods = getAllMoods();
    const tagCounts = {};

    moods.forEach(m => {
        if (m.tags && Array.isArray(m.tags)) {
            m.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => ({ tag, count }));
}

/**
 * Get popular tags (top 5)
 */
export function getPopularTags() {
    return getAllTags().slice(0, 5);
}

/**
 * Add tag to a mood entry
 */
export function addTagToMood(date, tag) {
    const mood = getMood(date);
    if (!mood) return null;

    const tags = mood.tags || [];
    if (!tags.includes(tag)) {
        tags.push(tag);
        saveMood(date, mood.emoji, mood.note, tags);
    }
    return tags;
}

/**
 * Remove tag from a mood entry
 */
export function removeTagFromMood(date, tag) {
    const mood = getMood(date);
    if (!mood || !mood.tags) return null;

    const tags = mood.tags.filter(t => t !== tag);
    saveMood(date, mood.emoji, mood.note, tags);
    return tags;
}

/**
 * Render tags input and display
 */
export function renderTagsSection(containerId, date) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const mood = getMood(date);
    const currentTags = mood?.tags || [];
    const popularTags = getPopularTags();

    container.innerHTML = `
    <div class="tags-section">
      <div class="tags-input-wrapper">
        <input type="text" class="tags-input" id="tagInput" 
               placeholder="Add tag (e.g., #work, #health)" 
               aria-label="Add a tag">
      </div>
      <div class="tags-container" id="currentTags">
        ${currentTags.map(tag => `
          <span class="tag tag--removable" data-tag="${tag}">#${tag}</span>
        `).join('')}
      </div>
      ${popularTags.length > 0 ? `
        <div class="popular-tags">
          <div class="popular-tags__title">Popular tags:</div>
          <div class="tags-container">
            ${popularTags.map(({ tag }) => `
              <span class="tag" data-tag="${tag}">#${tag}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

    // Event handlers
    const input = document.getElementById('tagInput');
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            const tag = input.value.trim().replace(/^#/, '').toLowerCase();
            addTagToMood(date, tag);
            input.value = '';
            renderTagsSection(containerId, date);
        }
    });

    container.querySelectorAll('.tag--removable').forEach(el => {
        el.addEventListener('click', () => {
            removeTagFromMood(date, el.dataset.tag);
            renderTagsSection(containerId, date);
        });
    });

    container.querySelectorAll('.popular-tags .tag').forEach(el => {
        el.addEventListener('click', () => {
            addTagToMood(date, el.dataset.tag);
            renderTagsSection(containerId, date);
        });
    });
}

// ==========================================
// WEEKLY INSIGHTS
// ==========================================

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EMOJI_NAMES = {
    '😊': 'happy',
    '😢': 'sad',
    '😠': 'angry',
    '😴': 'tired',
    '😍': 'loving',
    '😰': 'anxious',
    '😐': 'neutral'
};

/**
 * Generate weekly insights
 */
export function generateWeeklyInsights() {
    const moods = getAllMoods();
    if (moods.length < 7) return [];

    const insights = [];

    // Analyze mood by day of week
    const dayStats = {};
    WEEKDAYS.forEach(day => dayStats[day] = { total: 0, count: 0 });

    const emojiToValue = {
        '😍': 5, '😊': 4, '😐': 3, '😴': 2, '😰': 2, '😢': 1, '😠': 1
    };

    moods.forEach(m => {
        const day = WEEKDAYS[new Date(m.date).getDay()];
        dayStats[day].total += emojiToValue[m.emoji] || 3;
        dayStats[day].count++;
    });

    // Find best and worst days
    let bestDay = null, worstDay = null;
    let bestAvg = 0, worstAvg = 5;

    Object.entries(dayStats).forEach(([day, stats]) => {
        if (stats.count >= 2) {
            const avg = stats.total / stats.count;
            if (avg > bestAvg) { bestAvg = avg; bestDay = day; }
            if (avg < worstAvg) { worstAvg = avg; worstDay = day; }
        }
    });

    if (bestDay) {
        insights.push({
            type: 'positive',
            text: `You tend to feel happiest on <span class="insight-card__highlight">${bestDay}s</span>!`
        });
    }

    if (worstDay && worstDay !== bestDay) {
        insights.push({
            type: 'info',
            text: `<span class="insight-card__highlight">${worstDay}s</span> tend to be tougher. Consider planning something nice!`
        });
    }

    // Most common mood
    const emojiCounts = {};
    moods.forEach(m => {
        emojiCounts[m.emoji] = (emojiCounts[m.emoji] || 0) + 1;
    });

    const mostCommon = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
        const percentage = Math.round((mostCommon[1] / moods.length) * 100);
        insights.push({
            type: 'stat',
            text: `Your most frequent mood is ${mostCommon[0]} (<span class="insight-card__highlight">${percentage}%</span> of entries)`
        });
    }

    // Streak insight
    const streak = getCurrentStreakDays(moods);
    if (streak >= 7) {
        insights.push({
            type: 'achievement',
            text: `Amazing! You've logged your mood for <span class="insight-card__highlight">${streak} days</span> in a row!`
        });
    }

    return insights;
}

function getCurrentStreakDays(moods) {
    if (moods.length === 0) return 0;

    const sorted = [...moods].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestDate = new Date(sorted[0].date);
    latestDate.setHours(0, 0, 0, 0);

    if (latestDate < yesterday) return 0;

    let streak = 1;
    let expectedDate = new Date(sorted[0].date);

    for (let i = 1; i < sorted.length; i++) {
        expectedDate.setDate(expectedDate.getDate() - 1);
        const currentDate = new Date(sorted[i].date);
        currentDate.setHours(0, 0, 0, 0);
        expectedDate.setHours(0, 0, 0, 0);

        if (currentDate.getTime() === expectedDate.getTime()) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Render insights panel
 */
export function renderInsights(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const insights = generateWeeklyInsights();

    if (insights.length === 0) {
        container.innerHTML = `
      <div class="insights">
        <div class="insight-card">
          <p class="insight-card__text">Log moods for at least a week to see personalized insights!</p>
        </div>
      </div>
    `;
        return;
    }

    container.innerHTML = `
    <div class="insights">
      <div class="insights__title">Weekly Insights</div>
      ${insights.map(insight => `
        <div class="insight-card">
          <p class="insight-card__text">${insight.text}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// ==========================================
// MOOD PATTERNS
// ==========================================

/**
 * Analyze mood patterns by day of week
 */
export function getMoodPatterns() {
    const moods = getAllMoods();
    const patterns = WEEKDAYS.map(() => ({ emojis: {}, count: 0 }));

    moods.forEach(m => {
        const dayIndex = new Date(m.date).getDay();
        patterns[dayIndex].emojis[m.emoji] = (patterns[dayIndex].emojis[m.emoji] || 0) + 1;
        patterns[dayIndex].count++;
    });

    return patterns.map((p, i) => {
        const mostCommon = Object.entries(p.emojis).sort((a, b) => b[1] - a[1])[0];
        return {
            day: WEEKDAYS[i].slice(0, 3),
            emoji: mostCommon ? mostCommon[0] : '—',
            count: p.count
        };
    });
}

/**
 * Render patterns grid
 */
export function renderPatterns(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const patterns = getMoodPatterns();
    const maxCount = Math.max(...patterns.map(p => p.count));

    container.innerHTML = `
    <div class="patterns-grid">
      ${patterns.map(p => {
        const isHighlight = p.count === maxCount && p.count > 0;
        return `
          <div class="pattern-day ${isHighlight ? 'pattern-day--highlight' : ''}">
            <span class="pattern-day__label">${p.day}</span>
            ${p.emoji}
          </div>
        `;
    }).join('')}
    </div>
  `;
}

// ==========================================
// YEAR IN REVIEW
// ==========================================

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Get year review data
 */
export function getYearReview(year = new Date().getFullYear()) {
    const moods = getAllMoods();
    const yearMoods = moods.filter(m => new Date(m.date).getFullYear() === year);

    const monthData = MONTHS.map((name, i) => {
        const monthMoods = yearMoods.filter(m => new Date(m.date).getMonth() === i);
        const emojiCounts = {};
        monthMoods.forEach(m => {
            emojiCounts[m.emoji] = (emojiCounts[m.emoji] || 0) + 1;
        });
        const dominant = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1])[0];

        return {
            name,
            count: monthMoods.length,
            emoji: dominant ? dominant[0] : null
        };
    });

    // Calculate year stats
    const emojiCounts = {};
    yearMoods.forEach(m => {
        emojiCounts[m.emoji] = (emojiCounts[m.emoji] || 0) + 1;
    });
    const topEmoji = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1])[0];

    return {
        year,
        months: monthData,
        totalEntries: yearMoods.length,
        topEmoji: topEmoji ? topEmoji[0] : null,
        daysLogged: yearMoods.length
    };
}

/**
 * Render year review modal content
 */
export function renderYearReview(containerId, year) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = getYearReview(year);

    container.innerHTML = `
    <div class="year-review">
      <div class="year-grid">
        ${data.months.map(m => `
          <div class="year-month ${m.emoji ? 'year-month--has-data' : ''}" 
               title="${m.name}: ${m.count} entries">
            ${m.emoji || m.name.slice(0, 1)}
          </div>
        `).join('')}
      </div>
      <div class="year-stats">
        <div class="year-stat">
          <div class="year-stat__value">${data.totalEntries}</div>
          <div class="year-stat__label">Days Logged</div>
        </div>
        <div class="year-stat">
          <div class="year-stat__value">${data.topEmoji || '—'}</div>
          <div class="year-stat__label">Top Mood</div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// DAILY REMINDERS
// ==========================================

const REMINDER_KEY = 'moodpad_reminder';

/**
 * Check if notifications are supported and enabled
 */
export function canNotify() {
    return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Check if reminder is enabled
 */
export function isReminderEnabled() {
    return localStorage.getItem(REMINDER_KEY) === 'true';
}

/**
 * Enable daily reminder
 */
export async function enableReminder() {
    const granted = await requestNotificationPermission();
    if (granted) {
        localStorage.setItem(REMINDER_KEY, 'true');
        scheduleReminder();
        return true;
    }
    return false;
}

/**
 * Disable reminder
 */
export function disableReminder() {
    localStorage.removeItem(REMINDER_KEY);
}

/**
 * Schedule reminder check
 */
function scheduleReminder() {
    // Check every hour if we need to send reminder
    setInterval(() => {
        if (isReminderEnabled() && shouldSendReminder()) {
            sendReminder();
        }
    }, 60 * 60 * 1000); // Every hour
}

/**
 * Check if reminder should be sent
 */
function shouldSendReminder() {
    const now = new Date();
    const hour = now.getHours();

    // Send reminder between 8 PM and 9 PM if no mood logged today
    if (hour >= 20 && hour < 21) {
        const today = now.toISOString().split('T')[0];
        const todayMood = getMood(today);
        return !todayMood;
    }

    return false;
}

/**
 * Send reminder notification
 */
function sendReminder() {
    if (canNotify()) {
        new Notification('MoodPad Reminder', {
            body: 'How are you feeling today? Take a moment to log your mood.',
            icon: '/icons/icon-192.png',
            tag: 'moodpad-reminder'
        });
    }
}

// ==========================================
// CUSTOM EMOJIS
// ==========================================

const CUSTOM_EMOJIS_KEY = 'moodpad_custom_emojis';
const DEFAULT_EMOJIS = ['😊', '😢', '😠', '😴', '😍', '😰', '😐'];

/**
 * Get all emojis (default + custom)
 */
export function getAllEmojis() {
    const custom = getCustomEmojis();
    return [...DEFAULT_EMOJIS, ...custom];
}

/**
 * Get custom emojis
 */
export function getCustomEmojis() {
    try {
        const data = localStorage.getItem(CUSTOM_EMOJIS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Add custom emoji
 */
export function addCustomEmoji(emoji) {
    const custom = getCustomEmojis();
    if (!custom.includes(emoji) && !DEFAULT_EMOJIS.includes(emoji)) {
        custom.push(emoji);
        localStorage.setItem(CUSTOM_EMOJIS_KEY, JSON.stringify(custom));
    }
    return getAllEmojis();
}

/**
 * Remove custom emoji
 */
export function removeCustomEmoji(emoji) {
    const custom = getCustomEmojis().filter(e => e !== emoji);
    localStorage.setItem(CUSTOM_EMOJIS_KEY, JSON.stringify(custom));
    return getAllEmojis();
}

// ==========================================
// CSV IMPORT
// ==========================================

/**
 * Import moods from CSV content
 */
export function importFromCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    const header = lines[0].toLowerCase();
    if (!header.includes('date') || !header.includes('emoji')) {
        throw new Error('CSV must have Date and Emoji columns');
    }

    const headers = header.split(',').map(h => h.trim());
    const dateIndex = headers.indexOf('date');
    const emojiIndex = headers.indexOf('emoji');
    const noteIndex = headers.indexOf('note');

    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle quoted values
        const values = parseCSVLine(line);

        const date = values[dateIndex];
        const emoji = values[emojiIndex];
        const note = noteIndex >= 0 ? values[noteIndex] || '' : '';

        if (date && emoji && isValidDate(date)) {
            saveMood(date, emoji, note.replace(/^"|"$/g, ''));
            imported++;
        }
    }

    return imported;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());

    return values;
}

function isValidDate(dateStr) {
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d);
}

/**
 * Handle file import
 */
export function handleFileImport(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const count = importFromCSV(e.target.result);
                resolve(count);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// ==========================================
// PWA / SERVICE WORKER
// ==========================================

/**
 * Register service worker for PWA support
 */
export async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('MoodPad: Service Worker registered', registration.scope);
            return registration;
        } catch (err) {
            console.error('MoodPad: Service Worker registration failed', err);
        }
    }
}

/**
 * Check if app is installed as PWA
 */
export function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}
