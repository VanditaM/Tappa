# Tappa — Project Brief

## What it is
A mobile-first PWA (progressive web app) — an AI credit card co-pilot + family finance hub. No framework, no build step. Pure vanilla HTML/CSS/JS.

**Tagline:** Tap smarter. Keep more.

---

## How to run locally
```bash
cd /Users/vanditam/Desktop/Tappa
python3 -m http.server 3000
# then open http://localhost:3000
```
Must use a local server (not file://) because the app fetches CSV data files on boot.

## How to deploy
Push to a feature branch → open PR on GitHub → merge.
```bash
git checkout -b my-changes
git add .
git commit -m "describe change"
git push origin csv-data-files   # or any branch name
```
Repo: https://github.com/VanditaM/Tappa (private)
Branch protection on `main` — all changes must go through a PR.

---

## File structure
```
Tappa/
  index.html          — shell, loads app.css + app.js
  app.js              — entire app (~2600 lines)
  app.css             — design system + all styles
  manifest.json       — PWA manifest
  icon.svg            — app icon
  data/               — all mock data as CSV (loaded via fetch on boot)
    cards.csv         — 15 credit cards with reward rates per category
    categories.csv    — spending categories (dining, groceries, gas…)
    history.csv       — transaction history (hoursAgo, merchant, cardId…)
    budget.csv        — monthly budget categories
    subscriptions.csv — household subscriptions
    returns.csv       — return tracker
    suggestions.csv   — card upgrade/downgrade/new suggestions
```

---

## app.js architecture

### Sections (in order)
0. **DataLoader** — fetches all CSV files, parses them, populates global arrays on boot
1. **CARD_DB** — `[]` populated from `data/cards.csv`
2. **CATEGORIES** — `[]` populated from `data/categories.csv`
3. **MOCK_*** — `MOCK_FAMILY`, `MOCK_CREDIT` (still hardcoded — too nested for CSV), `MOCK_SUBSCRIPTIONS`, `MOCK_RETURNS`, `MOCK_BUDGET`, `MOCK_CARD_SUGGESTIONS`, `MOCK_HISTORY` — all populated from CSV
4. **Geo + NearbySearch** — OpenStreetMap/Overpass API for nearby merchant detection
5. **Store** — localStorage wrapper. Key: `tappa_v2`. Methods: `getState()`, `updateState(patch)`, `getDefault()`
6. **Engine** — card recommendation logic: `getRate(card, category)`, `recommend(cards, category, amount)`, `dollarValue()`, `_explain()`
7. **App** — state object + `navigate(screen, opts)` + `render()` (map of screen name → Screens method)
8. **Actions** — centralized event handler `Actions.handle(action, data, el)`. All user interactions go through this.
9. **Screens** — all screen HTML as template strings. Methods: `welcome`, `onboarding`, `home`, `optimizer`, `result`, `family`, `creditScore`, `budget`, `subscriptions`, `returns`, `cardSuggest`, `profile`, `widgetSetup`, `bottomNav`
10. **SVG icons** — `svgHome`, `svgStar`, `svgBack`, `svgCard`, `svgPin`, `svgLoader`, `svgUsers`, `svgChart`, `svgUser`, `svgCheck`, `svgShare`, `svgTarget`
11. **Helpers** — `scoreGauge(score, color)` SVG semicircle gauge, `sparkline(values, w, h, color)` mini line chart, `suggestBestDefault(cards, history)`
12. **Boot** — async `DOMContentLoaded`: shows loading spinner → `await DataLoader.init()` → `App.navigate(...)`

### Key patterns
- **Single click listener** on `#app` using event delegation — never bind per-element
- **Re-render on state change** — `App.render()` replaces `#app` innerHTML entirely
- **Navigation** — `App.navigate('screenName', { optionalStateOverrides })`
- **Actions** — `data-action="action-name"` on any element, `data-*` for params
- **Store** — all persistent data in localStorage under `tappa_v2`

### CSS design system (app.css)
Key variables (always use these, never hardcode colors):
```css
--orange / --orange-dark / --orange-soft
--navy / --navy-mid
--text / --text-2 / --text-3
--bg / --surface / --surface-raised
--green / --green-bg / --green-text
--red / --red-bg / --red-text
--yellow / --yellow-bg / --yellow-text
--blue / --blue-bg / --blue-text
--border / --radius / --radius-sm / --radius-xs
--shadow / --shadow-md / --shadow-lg
```

---

## Current features

### Screens & navigation
| Tab | Screen | What it shows |
|-----|--------|---------------|
| Home | `home` | Points earned per card (bar chart), Tap to Card CTA, auto-suggest default card banner, card carousel |
| Tap | `optimizer` | Category picker, amount input, nearby merchants (GPS), get recommendation |
| — | `result` | Best card recommendation with AI explanation, all cards ranked |
| Family | `family` | Household members, spend totals, pending share approvals, links to sub-screens |
| — | `creditScore` | SVG gauge, score factors, loan approval rates, score history sparkline |
| — | `subscriptions` | Grouped by owner, total monthly, unused flagged |
| — | `returns` | Status chips (shipped/approved/pending/refunded), deadlines |
| — | `cardSuggest` | Upgrade/downgrade/new/optimize suggestions based on spend |
| Budget | `budget` | Monthly overview bar, category bars (over/under), recent purchases, nudge shortcut |
| Me | `profile` | Share partners (add/remove, per-type toggles), budget nudge timing, widget setup link |
| — | `widgetSetup` | iOS home screen instructions, widget mockup |

### Key behaviors
- **Tap to Card** — taps `optimizer` directly with auto-detected top spend category, skips manual selection
- **Auto-suggest default** — analyzes history to suggest a better default card based on top category
- **Demo data** — fresh users get 4 pre-loaded cards + 12 transactions from `getDefault()` so the home screen looks alive immediately
- **Onboarding** — 1 step (card selection) for static cards, 2 steps if dynamic/rotating cards selected. Goal step removed.
- **Share with people** — profile screen, add any person by name + relationship, per-type toggles (Budget / Subscriptions / Transactions), requires approval

---

## Data model (localStorage `tappa_v2`)
```js
{
  onboarded: true,
  cards: [ { id, name, issuer, cardType, rewardType, program, pointValue, color, rates, isDefault, ... } ],
  history: [ { ts, category, merchant, amount, cardId, dollarSaved } ],
  nudge: { enabled, time, morning, evening },
  sharePartners: [ { id, name, initials, color, relationship, sharing: { budget, subscriptions, transactions } } ],
  pendingApprovals: [ { id, from, type, label, ts } ],
  dismissedDefaultSuggest: false,
}
```

---

## Design decisions & constraints
- No framework, no build step — must stay vanilla HTML/CSS/JS
- No real API calls — all recommendations are mock/calculated client-side
- CSV data files for all mock data — edit without touching JS
- `fetch()` required for CSV — must be served (not file://), use `python3 -m http.server 3000` locally
- PWA-ready: manifest.json, apple-mobile-web-app-capable, service worker not yet added
- Scroll: natural page scroll (no overflow-y: auto containers). `padding-bottom: 100px` on content for nav bar clearance.
- Bottom nav: 5 tabs — Home | Tap | Family | Budget | Me

---

## What's NOT done yet (potential next steps)
- Service worker / offline support
- Real card recommendation API (currently mock Engine)
- Actual credit score API integration
- Push notifications for budget nudges
- Native iOS app / WidgetKit widget
- User authentication
- Real transaction import (Plaid etc.)
