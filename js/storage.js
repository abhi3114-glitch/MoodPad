/**
 * MoodPad Storage Module
 * Handles localStorage operations for mood data
 */

const STORAGE_KEY = 'moodpad_moods';

/**
 * Get all mood entries from localStorage
 * @returns {Array} Array of mood objects
 */
export function getAllMoods() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error reading moods from storage:', e);
        return [];
    }
}

/**
 * Save all moods to localStorage
 * @param {Array} moods - Array of mood objects
 */
function saveMoods(moods) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(moods));
    } catch (e) {
        console.error('Error saving moods to storage:', e);
    }
}

/**
 * Get mood for a specific date
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Object|null} Mood object or null if not found
 */
export function getMood(date) {
    const moods = getAllMoods();
    return moods.find(m => m.date === date) || null;
}

/**
 * Save or update a mood entry
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {string} emoji - The emoji representing the mood
 * @param {string} note - Optional note text
 * @param {Array} tags - Optional array of tags
 */
export function saveMood(date, emoji, note = '', tags = null) {
    const moods = getAllMoods();
    const existingIndex = moods.findIndex(m => m.date === date);

    // Preserve existing tags if not provided
    const existingMood = existingIndex >= 0 ? moods[existingIndex] : null;
    const moodTags = tags !== null ? tags : (existingMood?.tags || []);

    const moodEntry = {
        date,
        emoji,
        note: note.trim(),
        tags: moodTags,
        timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        moods[existingIndex] = moodEntry;
    } else {
        moods.push(moodEntry);
    }

    // Sort by date descending
    moods.sort((a, b) => new Date(b.date) - new Date(a.date));

    saveMoods(moods);
    return moodEntry;
}

/**
 * Delete a mood entry
 * @param {string} date - Date string in YYYY-MM-DD format
 */
export function deleteMood(date) {
    const moods = getAllMoods();
    const filtered = moods.filter(m => m.date !== date);
    saveMoods(filtered);
}

/**
 * Clear all mood data
 */
export function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get moods for a specific month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Array} Array of mood objects for that month
 */
export function getMoodsForMonth(year, month) {
    const moods = getAllMoods();
    return moods.filter(m => {
        const d = new Date(m.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });
}

/**
 * Export moods to CSV format
 * @returns {string} CSV string
 */
export function exportToCSV() {
    const moods = getAllMoods();
    if (moods.length === 0) return '';

    const headers = ['Date', 'Emoji', 'Note'];
    const rows = moods.map(m => [
        m.date,
        m.emoji,
        `"${(m.note || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV() {
    const csv = exportToCSV();
    if (!csv) {
        alert('No mood data to export!');
        return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `moodpad_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
