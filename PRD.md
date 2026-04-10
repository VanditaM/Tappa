# Tappa — Product Requirements Document

**Version:** 1.0
**Last Updated:** April 2026
**Status:** Active Development

---

## Vision

Tappa is the AI co-pilot for your wallet. It instantly tells you which card to tap at every purchase, tracks your family's finances in one place with the right amount of separation, and helps you earn more — every single day — without thinking about it.

**Mission:** Make credit card rewards accessible to everyone, not just people who obsess over points.

---

## Target User

- Age 25–45, household income $80k+
- Has 2–5 credit cards but doesn't maximize them
- Shared finances with a partner or family member
- Wants to earn more but doesn't want to manage spreadsheets
- iPhone-first (iOS PWA → native)

---

## Core Problem

People leave thousands of dollars in rewards on the table every year because:
1. They don't know which card earns the most at each merchant
2. Managing multiple cards across a household is confusing
3. Points and cashback are invisible until redemption
4. Budgeting tools are either too simple or too complex

---

## What We've Built (Current State)

The foundation is a working PWA at `/Users/vanditam/Desktop/Tappa` with all core screens functional.

---

## MVP — Shipped ✓

**The core loop: tap, earn, know.**

| Feature | Description | Status |
|---------|-------------|--------|
| Card Database | 15 major credit cards with accurate reward rates per category | ✓ Done |
| Tap to Card | One-tap instant card recommendation based on spend habits | ✓ Done |
| Optimizer | Pick merchant/category + amount → best card ranked | ✓ Done |
| Nearby Merchants | GPS + OpenStreetMap to detect nearby merchants automatically | ✓ Done |
| Home Screen | Points/cashback earned this month per card with bar chart | ✓ Done |
| Card Carousel | Visual card chips with default indicator | ✓ Done |
| Auto-suggest Default | Analyzes history → suggests better default card for top category | ✓ Done |
| Onboarding | Card selection flow (1–2 steps depending on card type) | ✓ Done |
| My Cards | Add/remove cards, set default, full card names shown | ✓ Done |
| Dynamic Card Support | Rotating (Chase Freedom), customizable (BofA), auto-custom (Citi CC) | ✓ Done |
| PWA Shell | Installable on iPhone home screen, offline-capable shell | ✓ Done |
| Budget Tracker | Monthly category bars, over/under alerts, total saved | ✓ Done |
| Recent Purchases | Transaction log in Budget tab | ✓ Done |
| Subscriptions Tracker | Grouped by owner, monthly total, unused flagged | ✓ Done |
| Returns Tracker | Status chips (shipped/approved/pending/refunded), deadlines | ✓ Done |
| Credit Score Viewer | SVG gauge, score factors, loan approval rates, history sparkline | ✓ Done |
| Family Hub | Multi-member household with spend summaries, per-member credit scores | ✓ Done |
| Card Suggestions | Upgrade/downgrade/new/optimize based on spend habits | ✓ Done |
| Share with People | Add partners, per-type sharing (budget/subs/transactions), approval flow | ✓ Done |
| Budget Nudges | Morning/evening reminder settings per user | ✓ Done |
| iPhone Widget Guide | Step-by-step iOS home screen setup instructions | ✓ Done |
| CSV Data Layer | All mock data extracted to editable CSV files | ✓ Done |
| AI Explanation | Plain-English reason for every card recommendation | ✓ Done |

---

## Phase 1 — Q3 2026: Real Data & Polish

**Goal:** Replace all mock data with real data. Make it something you'd actually use daily.

### 1.1 Real Transaction Import
- Plaid integration to pull real transactions from bank/card accounts
- Auto-categorize transactions (dining, groceries, gas, etc.)
- Match transactions to cards in user's wallet
- Show real points/cashback earned (not estimates)
- Privacy-first: read-only access, no credentials stored

### 1.2 Real Credit Score
- Integrate with Experian or Credit Karma API
- Weekly score refresh
- Real score factors, not mock data
- Score change alerts (push notification when score moves ±5 pts)

### 1.3 Live Card Rates Database
- Replace static CARD_DB with an API-backed card database
- Quarterly rotating category updates (Chase Freedom, Discover It) auto-synced
- Admin dashboard to update card rates without a code deploy
- 50+ cards supported

### 1.4 Push Notifications
- Budget nudge notifications at user-set times (morning/evening)
- "Over budget" alert when a category hits 80%
- "Tap to Card" widget notification: "You're near Whole Foods — use Amex Gold for 4x"
- Card activation reminders (rotating cards)

### 1.5 Service Worker + Offline Mode
- Cache app shell + card database for full offline use
- Queue optimizer queries made offline, resolve when back online
- Background sync for transaction data

### 1.6 UI Polish Pass
- Smooth screen transitions (slide in/out)
- Haptic feedback on key taps (web vibration API)
- Skeleton loading states
- Empty state illustrations
- Dark mode support

### 1.7 Analytics & Insights
- "You've earned $X this year with Tappa"
- Monthly recap: top category, best card used, missed opportunities
- "You left $X on the table this month" (transactions on wrong card)
- Year-over-year spend comparison

---

## Phase 2 — Q4 2026: Native iOS App

**Goal:** Get Tappa on the App Store with native capabilities that a PWA can't match.

### 2.1 Native iOS App (Swift / SwiftUI)
- App Store distribution
- Native performance and animations
- Face ID / Touch ID authentication
- Access to native iOS APIs unavailable in PWA

### 2.2 WidgetKit Home Screen Widget
- Small widget: "Tap to Card" — shows best card for your current location
- Medium widget: spend summary + points earned this month
- Lock screen widget: current default card + points balance
- Live Activities: show card recommendation while transaction is in progress

### 2.3 Apple Wallet Integration
- Deep link to Apple Wallet to add cards
- Show card art from Apple Wallet in Tappa
- NFC tap → Tappa suggestion appears before payment completes

### 2.4 Siri Shortcuts
- "Hey Siri, which card should I use at Whole Foods?"
- "Hey Siri, how much have I spent on dining this month?"
- "Hey Siri, what's my best card for gas?"

### 2.5 Location-based Proactive Suggestions
- Geofencing: detect when user enters a store
- Automatic notification: "You're at Target — use Chase Freedom Flex for 5% this quarter"
- Background location (opt-in, battery-optimized)

### 2.6 Family Accounts
- Shared household account with individual logins
- Real-time transaction visibility (with consent)
- Shared budget with individual card optimization
- Split expense tracking

---

## Phase 3 — Q1–Q2 2027: Intelligence Layer

**Goal:** Tappa stops being a lookup tool and becomes a proactive financial advisor.

### 3.1 AI Spend Personality
- 30-day habit analysis → "Your Spend Profile: Foodie + Commuter + Homebody"
- Personalized card stack recommendation: "Your ideal 3-card wallet"
- Lifestyle-based suggestions: "You spend $600/mo on dining — Amex Gold pays for itself in 4 months"

### 3.2 Smart Card Stack Optimizer
- "What's the ideal combination of 2–3 cards for your lifestyle?"
- Annual fee ROI calculator: "Is your Amex Platinum worth $695 for how you actually spend?"
- Card graduation path: "Start with this card, upgrade when you hit $X/mo spend"

### 3.3 Points Ecosystem Intelligence
- Track points balances across all programs (Chase UR, Amex MR, etc.)
- Transfer partner analysis: "Transfer 50k Chase points to Hyatt = $750 hotel vs $500 cash"
- Points expiry alerts
- "Book now" recommendations when point value is at peak

### 3.4 Subscription Intelligence
- Auto-detect subscriptions from transaction data (no manual entry)
- Price increase alerts: "Netflix raised your rate by $2/mo"
- Cancellation ROI: "You've used Peloton 2x in 90 days — $44/mo is $22/workout"
- Annual vs monthly billing optimizer: "Switch to annual and save $47"

### 3.5 Proactive Financial Coaching
- Weekly AI summary: "Here's what happened with your money this week"
- Missed rewards alerts: "You spent $234 on groceries with the wrong card — $9.36 lost"
- Tax prep assist: "Here are your deductible business expenses from last year"
- Net worth snapshot (connect investment accounts — read-only)

---

## Tappa 2.0 — 2027: Platform

**Goal:** Tappa becomes the financial OS for modern households.

### Platform Features

**Tappa for Couples / Families**
- Joint financial dashboard with privacy controls
- Each person sees their own view, shares what they choose
- Household net worth tracking
- Shared vs personal spend separation
- Allowance / spending limits for family members

**Tappa Marketplace**
- Personalized card recommendations with affiliate partnerships
- "Based on your spending, you should apply for X — here's why"
- Card comparison tool with real APR, signup bonuses, annual fees
- Application status tracking

**Tappa for Business**
- Business card optimization (separate from personal)
- Expense reporting automation
- Receipt capture + categorization
- Team card management

**Tappa Premium (Subscription)**
- Free tier: basic card optimizer, 1 user, 3 cards
- Premium ($4.99/mo): unlimited cards, transaction import, family sharing, AI insights
- Family ($9.99/mo): up to 6 members, full household dashboard, all features

---

## Technical Roadmap

| Phase | Stack Changes |
|-------|--------------|
| MVP | Vanilla JS PWA, CSV data, localStorage |
| Phase 1 | Add Plaid API, push notifications (web push), service worker, card rates API |
| Phase 2 | Swift/SwiftUI iOS app, WidgetKit, Core Location |
| Phase 3 | ML model for spend categorization, Claude API for AI insights |
| 2.0 | Full backend (Node/Supabase), user accounts, real-time sync |

---

## Success Metrics

| Phase | Key Metric | Target |
|-------|-----------|--------|
| MVP | Daily active users | 100 |
| Phase 1 | Avg. sessions/week per user | 5+ |
| Phase 2 | App Store rating | 4.7+ |
| Phase 2 | D30 retention | 40%+ |
| Phase 3 | Avg. annual savings per user | $400+ |
| 2.0 | Paid conversion rate | 15%+ |

---

## What We Are NOT Building

- We do not store card numbers or bank credentials
- We do not make payments
- We do not issue cards
- We are not a bank
- We do not sell user data

---

## Open Questions

1. **Monetization:** Affiliate model (card applications) vs subscription vs both?
2. **Data privacy:** How much transaction data do we store and for how long?
3. **Android:** PWA first or native Android app in Phase 2?
4. **Partnerships:** Direct card issuer partnerships for real-time rate data?
5. **Launch strategy:** Invite-only beta or public launch for Phase 1?
