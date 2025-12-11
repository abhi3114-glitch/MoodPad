/**
 * MoodPad Demo Module
 * Generates sample data for demonstration
 */

import { saveMood, clearAll } from './storage.js';

const EMOJIS = ['😊', '😢', '😠', '😴', '😍', '😰', '😐'];

const SAMPLE_NOTES = [
    'Had a great day at work!',
    'Feeling a bit under the weather',
    'Productive morning, relaxing evening',
    'Caught up with old friends',
    'Stressful deadline approaching',
    'Good workout session today',
    'Lazy Sunday vibes',
    'Exciting news!',
    'Need more sleep...',
    'Grateful for small things',
    'Movie night was fun',
    'Finished a big project',
    'Missing family',
    'Beautiful weather today',
    'Coffee was perfect this morning',
    ''  // Some days without notes
];

/**
 * Get a weighted random emoji (more neutral/happy, fewer extreme)
 */
function getRandomEmoji() {
    const weights = [30, 10, 5, 15, 15, 10, 15]; // Weights for each emoji
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < EMOJIS.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return EMOJIS[i];
        }
    }

    return EMOJIS[0];
}

/**
 * Get random note (60% chance of having a note)
 */
function getRandomNote() {
    if (Math.random() > 0.6) return '';
    return SAMPLE_NOTES[Math.floor(Math.random() * SAMPLE_NOTES.length)];
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Load demo data for the past 3 months
 * @param {boolean} keepExisting - If true, don't clear existing data
 */
export function loadDemoData(keepExisting = false) {
    if (!keepExisting) {
        clearAll();
    }

    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const currentDate = new Date(threeMonthsAgo);
    let entriesAdded = 0;

    while (currentDate <= today) {
        // 85% chance of logging on any given day (realistic usage)
        if (Math.random() < 0.85) {
            const dateStr = formatDate(currentDate);
            const emoji = getRandomEmoji();
            const note = getRandomNote();

            saveMood(dateStr, emoji, note);
            entriesAdded++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Demo data loaded: ${entriesAdded} entries over 3 months`);
    return entriesAdded;
}

/**
 * Check if demo data is loaded
 */
export function isDemoMode() {
    return localStorage.getItem('moodpad_demo') === 'true';
}

/**
 * Set demo mode flag
 */
export function setDemoMode(enabled) {
    if (enabled) {
        localStorage.setItem('moodpad_demo', 'true');
    } else {
        localStorage.removeItem('moodpad_demo');
    }
}
