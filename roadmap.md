# FX Checker - Future Roadmap

Here are the planned feature enhancements to take the Foreign Exchange Checker to the next level:

## 1. Click-to-Convert Shortcuts (Navigation Shortcuts)
- **Objective**: Improve workflow efficiency by making cards clickable in both the **Favorites** and **Compare** lists.
- **Details**:
  - Clicking a card (e.g., `USD → EUR`) automatically sets the converter dropdowns (SEND to `USD`, RECEIVE to `EUR`).
  - Swaps the active tab to the **History** view.
  - Automatically loads and renders the rate history chart for that pair.

## 2. Dynamic Chart Range Selectors (`7D`, `1M`, `3M`, `1Y`)
- **Objective**: Allow users to explore historical trends over different time intervals.
- **Details**:
  - Render range buttons (`7D`, `1M`, `3M`, `1Y`) above the line chart in the **History** tab.
  - Clicking a button recalculates the start date and queries the Frankfurter API.
  - Re-renders the line chart dynamically.

## 3. Rate Threshold Alerts
- **Objective**: Let users actively monitor rates and get notified when target thresholds are crossed.
- **Details**:
  - Add a slider or input box on the Favorites cards to set target exchange thresholds (e.g., *"USD to EUR > 0.90"*).
  - Verify rates against thresholds during live syncing or on page reload.
  - Display a premium toast alert in the UI when a target rate is hit.

## 4. Live Updates Pulse Ticker
- **Objective**: Make the dashboard feel real-time and active.
- **Details**:
  - Introduce an auto-refresh toggle that fetches rates periodically (e.g., every 60 seconds).
  - Add a status row showing a neon-green pulse indicator stating: `"Live rates synced 12s ago"`.
  - Include a spinner manual refresh button.

## 5. CSV/PDF Logs Export
- **Objective**: Enable travel expense tracking or accounting logging.
- **Details**:
  - Add an `EXPORT CSV` button in the **Conversion Log** header.
  - Download a clean sheet detailing transaction dates, currency codes, and exact converted amounts.

## 6. Theme Changer (Dark, Light, and System Modes)
- **Objective**: Enhance user choice and visual comfort by supporting different themes.
- **Details**:
  - Add a theme switcher icon/dropdown button in the **Header** component.
  - Support three modes:
    - **Dark Mode**: The current default premium slate/neon-lime layout.
    - **Light Mode**: A clean, high-contrast theme utilizing harmonized slate/light grey values, while maintaining the signature lime accents.
    - **System Mode**: Automatically queries the user's OS preference (`prefers-color-scheme`) and switches accordingly.
  - Implement using a `.light` / `.dark` body class mapping CSS variables, and persist the preference in `localStorage`.
