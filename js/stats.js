/**
 * MoodPad Stats Module
 * Calculates and renders mood statistics
 */

import { getAllMoods, getMoodsForMonth } from './storage.js';

// Emoji to numeric value mapping for trend calculation
const emojiToValue = {
    '😍': 5,  // Love - best
    '😊': 4,  // Happy
    '😐': 3,  // Neutral
    '😴': 2,  // Tired
    '😰': 2,  // Anxious
    '😢': 1,  // Sad
    '😠': 1   // Angry - worst
};

/**
 * Get the most common mood for a month
 */
export function getMostCommonMood(year, month) {
    const moods = getMoodsForMonth(year, month);
    if (moods.length === 0) return null;

    const counts = {};
    moods.forEach(m => {
        counts[m.emoji] = (counts[m.emoji] || 0) + 1;
    });

    let maxCount = 0;
    let mostCommon = null;

    Object.entries(counts).forEach(([emoji, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = emoji;
        }
    });

    return mostCommon;
}

/**
 * Calculate current streak (consecutive days with moods logged)
 */
export function getCurrentStreak() {
    const moods = getAllMoods();
    if (moods.length === 0) return 0;

    // Sort by date descending
    const sorted = [...moods].sort((a, b) => new Date(b.date) - new Date(a.date));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if streak is active (logged today or yesterday)
    const latestDate = new Date(sorted[0].date);
    latestDate.setHours(0, 0, 0, 0);

    if (latestDate < yesterday) {
        return 0; // Streak broken
    }

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
 * Calculate longest streak ever
 */
export function getLongestStreak() {
    const moods = getAllMoods();
    if (moods.length === 0) return 0;

    // Sort by date ascending
    const sorted = [...moods].sort((a, b) => new Date(a.date) - new Date(b.date));

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1].date);
        const currDate = new Date(sorted[i].date);

        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else if (diffDays > 1) {
            currentStreak = 1;
        }
        // diffDays === 0 means same day, ignore duplicate entries
    }

    return maxStreak;
}

/**
 * Get total entries count
 */
export function getTotalEntries() {
    return getAllMoods().length;
}

/**
 * Get mood trend data for chart (last 30 days)
 */
export function getTrendData(days = 30) {
    const moods = getAllMoods();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const mood = moods.find(m => m.date === dateStr);
        data.push({
            date: dateStr,
            value: mood ? (emojiToValue[mood.emoji] || 3) : null,
            emoji: mood?.emoji || null
        });
    }

    return data;
}

/**
 * Render the trend chart as SVG
 */
export function renderTrendChart() {
    const container = document.getElementById('trendChart');
    if (!container) return;

    const data = getTrendData(30);
    const validData = data.filter(d => d.value !== null);

    if (validData.length === 0) {
        container.innerHTML = `
      <div class="trend-chart__empty" style="text-align: center; padding: 20px; color: var(--text-muted);">
        Log some moods to see your trend!
      </div>
    `;
        return;
    }

    const width = container.clientWidth || 300;
    const height = 120;
    const padding = 20;
    const barWidth = Math.max(4, (width - padding * 2) / data.length - 2);

    let svg = `<svg class="trend-chart__svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`;

    // Draw bars
    data.forEach((d, i) => {
        if (d.value !== null) {
            const barHeight = ((d.value / 5) * (height - padding * 2));
            const x = padding + i * ((width - padding * 2) / data.length);
            const y = height - padding - barHeight;

            svg += `
        <rect 
          class="trend-chart__bar" 
          x="${x}" 
          y="${y}" 
          width="${barWidth}" 
          height="${barHeight}"
          rx="2"
        >
          <title>${d.date}: ${d.emoji}</title>
        </rect>
      `;
        }
    });

    svg += '</svg>';
    container.innerHTML = svg;
}

/**
 * Render all stats
 */
export function renderStats(year, month) {
    const mostCommon = getMostCommonMood(year, month);
    const currentStreak = getCurrentStreak();
    const longestStreak = getLongestStreak();
    const totalEntries = getTotalEntries();

    // Update DOM
    const mostCommonEl = document.getElementById('mostCommonMood');
    const currentStreakEl = document.getElementById('currentStreak');
    const longestStreakEl = document.getElementById('longestStreak');
    const totalEntriesEl = document.getElementById('totalEntries');

    if (mostCommonEl) {
        mostCommonEl.textContent = mostCommon || '—';
    }

    if (currentStreakEl) {
        currentStreakEl.textContent = currentStreak;
    }

    if (longestStreakEl) {
        longestStreakEl.textContent = longestStreak;
    }

    if (totalEntriesEl) {
        totalEntriesEl.textContent = totalEntries;
    }

    // Render trend chart
    renderTrendChart();
}
