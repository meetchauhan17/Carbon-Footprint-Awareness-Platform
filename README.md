# CarbonWise — Carbon Footprint Awareness Platform

[![React Version](https://img.shields.io/badge/react-v19.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/build-Vite%20v8.0-fast.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/styling-Tailwind%20v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Tests Status](https://img.shields.io/badge/tests-38%2F38%20passed-success.svg)](#how-to-test)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%20AA%20Compliant-green.svg)](#accessibility--standards)
[![SEO](https://img.shields.io/badge/SEO-100%2F100-brightgreen.svg)](#seo--performance)

A premium, interactive, and responsive web application designed to help individuals track, understand, and reduce their daily carbon footprint. Combining modern data visualization, real-time context integration (weather, quotes, country statistics), and an interactive 3D Globe with gamified achievements, CarbonWise transforms abstract emissions metrics into tangible, actionable daily habits.

Developed for **[Challenge 3] Carbon Footprint Awareness Platform - Hack2Skill Prompt Wars**.

---

## Key Features

### 1. Multi-Category Carbon Calculator
*   Granular tracking across four core pillars of individual carbon footprints:
    *   **Transport:** Log trips by car (petrol/diesel/electric), public transit, or air travel.
    *   **Energy:** Log household electricity, natural gas, or LPG cylinder usage.
    *   **Food:** Log diet types (meat-heavy, vegetarian, vegan) and organic choices.
    *   **Shopping:** Log purchases of clothing, electronics, online deliveries, and general goods.
*   Persistent state and history logs driven by **React Context** and **LocalStorage**.

### 2. Interactive 3D Earth Globe
*   Built with raw **Three.js** and **WebGL**, displaying a rotating 3D Earth with custom ambient atmosphere glows, direction-based lighting, and interactive orange hotspots.
*   Automatically fetches and maps coordinate hotspots based on the user's localized country data.
*   Includes a robust, graceful fallback state to a 2D slate-blue canvas in the event of WebGL unavailability or texture loading failures.

### 3. Code-Split Analytics & Insights
*   **7-Day Emissions Trend:** Interactive Area Chart displaying daily emissions stacked against the user's customized target goal line.
*   **Category Breakdown:** Interactive Pie Chart visualizing weekly emissions distribution.
*   Both charts are lazy-loaded on mount using React code-splitting chunk hooks (`React.lazy()`) to optimize PageSpeed performance.

### 4. Gamified Achievements & Streaks
*   **17 Unlockable Milestones:** Badges earned for low-carbon travel, consistent logging, hitting weekly targets, completing setup, and executing eco-tips.
*   **Flame Streak Counter:** Tracks consecutive daily logs that fall below the user's daily budget.
*   Features a responsive completion meter and badge showcase dialog.

### 5. Action Hub & Eco Tips
*   30+ highly-actionable environmental recommendations categorized by target impact (High, Medium, Low) and theme.
*   Includes daily seeded suggestions, detailed carbon reduction explanations, and interactive completion logs.

---

## Performance & Architecture Highlights

### 3D Globe Mobile Viewport Optimization
*   **The Issue:** Running `Three.js` (WebGL) and compiling complex shaders on mobile viewports blocks CPU threads, degrading the mobile PageSpeed Performance score.
*   **The Solution:** Implemented client-side viewport detection logic (`isMobile` hooks targeting screen widths `< 1024px`) inside [Dashboard.jsx](file:///c:/Meet/xyz/Carbon%20Footprint%20Awareness%20Platform/src/pages/Dashboard.jsx).
*   If a mobile screen is detected, the browser completely bypasses importing and rendering the **~510.92 KB** `Globe3D` module, saving substantial network bandwidth and main-thread processing cycles. The "Settings" button is relocated to the Welcome Card header for accessibility.

### Code-Splitting & Asset Optimization
*   All heavy non-critical components (charts, modals, and WebGL elements) are code-split into distinct dynamic modules via `React.lazy()` and rendered under React `<Suspense>` loaders.
*   Optimized asset sizes: Embedded a highly compressed, low-latency, local Earth texture map (92.57 KB) inside `public/textures/earth.jpg`, resolving external CDN blocks and minimizing load latency.

### Progressive Web App (PWA) & Service Worker Cache Control
*   Configured with service worker caching rules to support full offline accessibility for calculator actions, history logging, and achievement tracking.
*   Includes a custom developer-mode bypass in `index.html` that automatically unregisters caching service workers on `localhost` / `127.0.0.1` to prevent dynamic chunk caching issues during rapid hot reloading.

---

## Real-Time External API Integrations

To provide localized environmental context without blocking critical paint times, CarbonWise integrates three external data streams using a deferred load strategy (fetches are automatically delayed by **2000ms** after mount):

1.  **Weather Context (Open-Meteo API):** 
    *   Fetches current temperature and weather conditions based on the user's configured location.
    *   Translates weather states into actionable suggestions (e.g. suggesting opening windows instead of running air conditioning on mild days).
2.  **Geographic & Population Data (REST Countries API):**
    *   Retrieves country flag metrics, latitudinal/longitudinal coordinates, and per-capita carbon averages.
    *   Provides motivational benchmarks comparing the user's footprint against their nation's per-capita emission rates.
3.  **Environmental Motivation (Quotable API / Local Fallback):**
    *   Integrates a rotating quote carousel featuring environmental wisdom from global leaders and scientists, encouraging user logging streaks.

---

## State Management & Gamification Flow

CarbonWise uses a centralized **React Context** (`CarbonContext`) mapped to **LocalStorage** for secure, local-first data persistence:

*   **Calculator Input Pipeline:** Inputs from `Calculator.jsx` are evaluated using EPA coefficients, transformed into unified kg CO₂ metrics, and pushed to the global `carbonEntries` array.
*   **Real-Time Badge Verification:** Every state transition automatically triggers the badge evaluation pipeline. If the user meets conditions (e.g., logging a vegan meal, logging 5 days in a row, or maintaining a streak), a new badge is pushed to the `badges` array and a visual alert is queued.
*   **Streak Tracking Engine:** Streaks are calculated dynamically on load by sorting historical daily entries and analyzing consecutive daily carbon values against the user's customized carbon budget limits.

---

## High-Performance 3D Interaction & Haptic Rules

CarbonWise features interactive cards with responsive 3D hover tilt and holographic reflections:

*   **RequestAnimationFrame Throttling:** Cursor coordinate tracking in the `use3DTilt` hook runs inside a `requestAnimationFrame` loop. This avoids triggering synchronous layout reflows on high-refresh-rate displays.
*   **Sensory and Motion Accommodation:**
    *   **Haptic Bypass:** The `use3DTilt` hook checks `window.matchMedia('(prefers-reduced-motion: reduce)')`. If reduced motion is requested, all rotations, keyframe animations, and shine overlays are strictly disabled.
    *   **Touch Screen Safeguards:** Touch-only devices automatically skip attaching mousemove and hover listeners, saving battery and CPU usage on mobile devices while providing clean static cards.

---

## Tech Stack

*   **Core Framework:** [React v19](https://react.dev/) + [Vite v8](https://vite.dev/)
*   **Routing:** [React Router v7](https://reactrouter.com/)
*   **Data Visualization:** [Recharts](https://recharts.org/)
*   **Graphics & WebGL:** [Three.js](https://threejs.org/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Testing Suite:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)

---

## Project Structure

```text
Carbon Footprint Awareness Platform/
├── public/
│   └── textures/
│       └── earth.jpg           # Local 3D Earth texture map (92.57 KB)
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── DashboardAreaChart.jsx   # Lazy-loaded trend chart
│   │   │   └── DashboardPieChart.jsx    # Lazy-loaded breakdown chart
│   │   ├── BadgesGrid.jsx
│   │   ├── CarbonCard.jsx
│   │   ├── EmissionGauge.jsx
│   │   ├── Globe3D.jsx         # WebGL Three.js rotating sphere
│   │   ├── GlobeFallback.jsx   # Elegant slate-blue fallback container
│   │   ├── LocationAutocomplete.jsx
│   │   └── Navbar.jsx
│   ├── context/
│   │   └── CarbonContext.jsx   # Central state manager (history, badges, profile)
│   ├── hooks/
│   │   ├── use3DTilt.js        # Throttled 3D card tilt & holo shine effect
│   │   ├── useCountryData.js   # Deferred country statistics fetch hook
│   │   ├── useWeather.js       # Deferred localized weather API integration
│   │   └── useQuote.js         # Deferred Quote carousel integration
│   ├── pages/
│   │   ├── About.jsx
│   │   ├── Calculator.jsx      # Input tracking forms & calculators
│   │   ├── Dashboard.jsx       # Carbon metrics showcase & action panel
│   │   ├── History.jsx         # Historic log tables & data export
│   │   └── Tips.jsx            # Seeded environmental recommendations hub
│   ├── utils/
│   │   ├── carbonCalculator.js # EPA & IPCC coefficients & formulas
│   │   └── calculations.js     # Formats and conversions
│   ├── App.jsx
│   ├── index.css               # Core variables, tailwind directives, custom glassmorphism styles
│   └── main.jsx
├── vercel.json                 # SPA routing and cache control headers
└── package.json
```

---

## Emission Factors & Calculation Methodology

Calculations are aligned with international guidelines from the **US Environmental Protection Agency (EPA) Emission Factors Hub**, **IPCC AR6 Reports**, and **CarbonIndependent.org**:

| Category | Item / Activity | Emission Coefficient | Metric |
| :--- | :--- | :--- | :--- |
| **Transport** | Car (Petrol / Gas) | `0.21` | kg CO₂ per km |
| | Car (Diesel) | `0.23` | kg CO₂ per km |
| | Car (Electric) | `0.05` | kg CO₂ per km (India grid avg) |
| | Public Transit (Bus/Train) | `0.04` | kg CO₂ per km |
| | Flight | `0.15` | kg CO₂ per km |
| **Energy** | Electricity (Grid) | `0.82` | kg CO₂ per kWh (India CEA avg) |
| | Natural Gas | `2.02` | kg CO₂ per m³ |
| | LPG Cylinder | `3.00` | kg CO₂ per kg |
| **Food** | High Meat Diet | `7.20` | kg CO₂ per day |
| | Vegetarian Diet | `3.80` | kg CO₂ per day |
| | Vegan Diet | `2.90` | kg CO₂ per day |
| **Shopping** | Clothing Item | `15.0` | kg CO₂ per item |
| | Electronic Device | `120.0` | kg CO₂ per item |
| | Online Delivery | `0.50` | kg CO₂ per order |

### Key Baselines:
*   **Global Target Baseline:** `11.0 kg CO₂ / day` (~4 tons per capita annually).
*   **Monthly Budget Default:** `150.0 kg CO₂ / month`.

---

## Accessibility & Design Standards

*   **WCAG AA Compliance:** High contrast theme utilizing curated colors (`#F7931A` orange-amber accents, `#10B981` success greens, and `#EF4444` alerts). Every input field includes descriptive `<label>` tags and matching `aria-label` hooks.
*   **Haptic / Motion Rules:** Incorporates the `prefers-reduced-motion` CSS media query and JavaScript event checks. Users with motion sensitivities automatically receive static, non-rotating layouts with tilt hooks and keyframe animations disabled.
*   **Glassmorphic Design System:** Leverages custom CSS backdrop filters, sleek gradient borders, and ambient neon glows.

---

## How to Run Locally

### 1. Installation
Install dependencies via npm:
```bash
npm install
```

### 2. Development Mode (with hot reloading)
Start the development server:
```bash
npm run dev
```
Open `http://localhost:5173` (or the fallback port shown in your terminal) in your browser.

### 3. Production Preview
To compile the application with full tree-shaking, minification, and bundling, then test the real-world performance:
```bash
npm run build
npm run preview
```
Open `http://localhost:4173` to test the production build locally.

---

## How to Test

Run the full automated unit testing suite powered by Vitest:
```bash
npm run test
```

Generate a detailed code coverage report:
```bash
npm run test:coverage
```
