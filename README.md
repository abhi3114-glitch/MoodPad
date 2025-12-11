# MoodPad

A minimal-friction mood logging application where users pick an emoji each day, add optional notes, and visualize their emotional patterns through a calendar and statistics.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Technical Architecture](#technical-architecture)
- [Data Storage](#data-storage)
- [Customization](#customization)
- [Browser Support](#browser-support)
- [Development](#development)
- [License](#license)

## Features

### Core Functionality

- **Daily Mood Logging**: Select from seven mood emojis with optional notes
- **Calendar View**: Month-by-month visualization with mood-colored cells
- **Statistics Dashboard**: Track streaks, most common moods, and 30-day trends
- **Data Persistence**: All data stored locally in your browser

### Enhanced Features

- **Theme Toggle**: Switch between dark and light modes with automatic system preference detection
- **Progressive Web App (PWA)**: Install on desktop or mobile, works offline
- **Daily Reminders**: Optional browser notifications at 8 PM if mood not logged
- **Mood Tags**: Add custom tags like work, health, or social to entries
- **Weekly Insights**: AI-generated insights about your mood patterns
- **Mood Patterns**: Analyze which days of the week you feel best
- **Year in Review**: Comprehensive annual mood visualization
- **CSV Export/Import**: Backup and restore your mood history
- **Custom Emojis**: Add your own mood emojis beyond the defaults

### Accessibility

- Large touch targets for easy mobile interaction
- Keyboard navigation support
- High contrast color scheme
- Reduced motion support for users who prefer it
- Screen reader compatible with proper ARIA labels

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- For local development: Node.js (optional, for running a local server)

### Running the Application

#### Option 1: Direct File Access

Open `index.html` directly in Chrome, Firefox, or Edge. Note that some browsers may have restrictions on ES6 modules from file:// URLs.

#### Option 2: Local Server (Recommended)

```bash
cd MoodPad
npx serve . -p 3000
```

Then open http://localhost:3000 in your browser.

#### Option 3: Install as PWA

1. Open the app in your browser
2. Click the install button in the address bar (or use browser menu)
3. The app will be available from your desktop or home screen

## Usage Guide

### Logging Your Mood

1. Open the application
2. Click on the emoji that represents your current mood
3. Optionally add a note describing your day
4. Your mood is automatically saved

### Adding Tags

1. After selecting a mood, type a tag in the tag input field
2. Press Enter to add the tag
3. Click on popular tags to quickly add them
4. Click on a tag with an X to remove it

### Viewing the Calendar

- Use the arrow buttons to navigate between months
- Days with logged moods display the emoji with a colored background
- Click on any day to view the full mood entry

### Using Statistics

The stats panel shows:
- Most common mood for the current month
- Current logging streak (consecutive days)
- Longest streak ever achieved
- Total number of entries
- 30-day mood trend chart
- Mood patterns by day of week

### Exporting Data

1. Click the "Export CSV" button
2. A CSV file will download containing all your mood entries
3. The file includes date, emoji, and note columns

### Importing Data

1. Click the "Import" button
2. Select a CSV file with Date, Emoji, and optionally Note columns
3. Entries will be merged with existing data

### Year in Review

1. Click the "Year Review" button
2. View a 12-month grid showing dominant moods per month
3. See annual statistics including total days logged

### Theme Toggle

Click the sun/moon icon in the header to switch between dark and light modes.

### Daily Reminders

1. Navigate to the Settings section
2. Toggle "Daily Reminder" on
3. Allow browser notifications when prompted
4. You will receive a reminder at 8 PM if you have not logged your mood

## Technical Architecture

### Project Structure

```
MoodPad/
|-- index.html          # Main application entry point
|-- manifest.json       # PWA manifest for installable app
|-- sw.js               # Service worker for offline support
|-- css/
|   |-- styles.css      # Complete design system (1200+ lines)
|-- js/
|   |-- app.js          # Main application controller
|   |-- storage.js      # localStorage CRUD operations
|   |-- calendar.js     # Calendar rendering and navigation
|   |-- stats.js        # Statistics calculations and charts
|   |-- demo.js         # Sample data generator
|   |-- features.js     # Enhanced features module
|-- icons/
|   |-- icon-192.png    # PWA icon (192x192)
|   |-- icon-512.png    # PWA icon (512x512)
|-- README.md           # This documentation
```

### Technology Stack

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Styling**: Custom CSS with CSS Variables for theming
- **Storage**: Browser localStorage
- **Charts**: SVG-based custom implementation
- **PWA**: Service Worker with Cache-First strategy

### Module Descriptions

#### app.js
Main application controller that initializes the app, manages state, coordinates between modules, and handles user interactions.

#### storage.js
Handles all localStorage operations including CRUD operations for mood entries, CSV export functionality, and data validation.

#### calendar.js
Renders the month calendar grid, handles navigation between months, and manages date selection with mood color mapping.

#### stats.js
Calculates statistics including streaks, most common moods, and trend data. Renders the SVG-based trend chart.

#### demo.js
Generates realistic sample data for demonstration purposes, creating three months of mood entries with weighted random distribution.

#### features.js
Contains all enhanced features including:
- Theme management (light/dark toggle)
- Tag system (add, remove, popular tags)
- Weekly insights generation
- Mood pattern analysis
- Year in review calculations
- Daily reminder scheduling
- Custom emoji management
- CSV import functionality
- Service worker registration

## Data Storage

All data is stored in browser localStorage under the following keys:

### Mood Entries

Key: `moodpad_moods`

```json
[
  {
    "date": "2024-12-08",
    "emoji": "happy-emoji",
    "note": "Great day!",
    "tags": ["work", "productive"],
    "timestamp": "2024-12-08T10:30:00.000Z"
  }
]
```

### Settings

- `moodpad_theme`: Current theme ("dark" or "light")
- `moodpad_reminder`: Reminder enabled ("true" or not set)
- `moodpad_custom_emojis`: Array of custom emoji additions
- `moodpad_demo`: Demo mode flag

### Data Format for Import/Export

CSV format with columns:
```
Date,Emoji,Note
2024-12-08,happy-emoji,"Had a great day!"
```

## Customization

### Adding New Emojis

Edit `js/app.js` and add entries to the `DEFAULT_MOODS` array:

```javascript
const DEFAULT_MOODS = [
  { emoji: 'happy-emoji', name: 'happy', label: 'Happy' },
  { emoji: 'excited-emoji', name: 'excited', label: 'Excited' },
  // Add more here
];
```

Then add corresponding styles in `css/styles.css`:

```css
.mood-btn[data-mood="excited"].mood-btn--selected { 
  border-color: #FFD700; 
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); 
}

.calendar__day--mood-excited { 
  background: rgba(255, 215, 0, 0.2); 
}
```

### Customizing Colors

All colors are defined as CSS custom properties in `css/styles.css`:

```css
:root {
  --bg-primary: #0f0f1a;
  --accent-primary: #667eea;
  --mood-happy: #ffd93d;
  /* Modify values here */
}
```

### Adding Cloud Sync

Replace the storage module with an API-backed implementation:

```javascript
export async function saveMood(date, emoji, note, tags) {
  const response = await fetch('/api/moods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, emoji, note, tags })
  });
  return response.json();
}
```

### Changing Reminder Time

In `js/features.js`, modify the `shouldSendReminder` function:

```javascript
function shouldSendReminder() {
  const now = new Date();
  const hour = now.getHours();
  // Change from 20-21 (8-9 PM) to your preferred time
  if (hour >= 20 && hour < 21) {
    // ...
  }
}
```

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome  | 80+             |
| Firefox | 75+             |
| Safari  | 14+             |
| Edge    | 80+             |

### Feature Support Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core App | Yes | Yes | Yes | Yes |
| PWA Install | Yes | Limited | Limited | Yes |
| Push Notifications | Yes | Yes | Limited | Yes |
| Offline Mode | Yes | Yes | Yes | Yes |

## Development

### Local Development

1. Clone the repository
2. Open `index.html` in a browser or run a local server
3. Make changes to source files
4. Refresh to see updates

### Code Style

- ES6+ JavaScript with modules
- BEM methodology for CSS class naming
- Semantic HTML5 elements
- Accessibility-first approach

### Testing

Manual testing checklist:
1. Load application and verify UI renders
2. Log a mood and verify it appears in calendar
3. Navigate between months
4. Verify statistics update correctly
5. Test CSV export and import
6. Toggle theme and verify colors change
7. Enable reminders and verify permission request
8. Test keyboard navigation
9. Verify PWA installation works

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
