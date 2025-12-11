/**
 * MoodPad Calendar Module
 * Handles calendar rendering and navigation
 */

import { getMoodsForMonth, getMood } from './storage.js';

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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

let currentYear;
let currentMonth;
let onDayClickCallback = null;

/**
 * Initialize calendar with current date
 */
export function initCalendar(onDayClick) {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    onDayClickCallback = onDayClick;

    // Set up navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => navigateMonth(1));

    renderCalendar();
}

/**
 * Navigate to previous or next month
 */
function navigateMonth(delta) {
    currentMonth += delta;

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    renderCalendar();
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week for the first day of month (0 = Sunday)
 */
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Check if a date is today
 */
function isToday(year, month, day) {
    const now = new Date();
    return now.getFullYear() === year &&
        now.getMonth() === month &&
        now.getDate() === day;
}

/**
 * Render the calendar
 */
export function renderCalendar() {
    const container = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('currentMonth');

    if (!container) return;

    // Update month label
    if (monthLabel) {
        monthLabel.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
    }

    // Get moods for this month
    const moods = getMoodsForMonth(currentYear, currentMonth);
    const moodMap = new Map(moods.map(m => [m.date, m]));

    // Build calendar HTML
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    let html = '';

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar__day calendar__day--empty"></div>';
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(currentYear, currentMonth, day);
        const mood = moodMap.get(dateStr);
        const todayClass = isToday(currentYear, currentMonth, day) ? 'calendar__day--today' : '';

        let moodClass = '';
        let content = day;

        if (mood) {
            const moodName = emojiToMood[mood.emoji] || 'neutral';
            moodClass = `calendar__day--has-mood calendar__day--mood-${moodName}`;
            content = `<span class="calendar__day-number">${day}</span>${mood.emoji}`;
        }

        html += `
      <div class="calendar__day ${todayClass} ${moodClass}" 
           data-date="${dateStr}"
           role="button"
           tabindex="0"
           aria-label="${MONTHS[currentMonth]} ${day}${mood ? ', mood: ' + mood.emoji : ''}">
        ${content}
      </div>
    `;
    }

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.calendar__day:not(.calendar__day--empty)').forEach(el => {
        el.addEventListener('click', () => handleDayClick(el.dataset.date));
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleDayClick(el.dataset.date);
            }
        });
    });
}

/**
 * Handle day click
 */
function handleDayClick(dateStr) {
    if (onDayClickCallback) {
        const mood = getMood(dateStr);
        onDayClickCallback(dateStr, mood);
    }
}

/**
 * Get current calendar state
 */
export function getCurrentMonth() {
    return { year: currentYear, month: currentMonth };
}

/**
 * Navigate to a specific month
 */
export function goToMonth(year, month) {
    currentYear = year;
    currentMonth = month;
    renderCalendar();
}
