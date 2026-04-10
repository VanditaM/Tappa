# Tappa — Product Requirements Document
### AI Card Co-Pilot + Family Finance Hub

**Version:** 2.0
**Last Updated:** April 2026
**Author:** Vandita Manyam
**Status:** Active Development

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Target Users](#target-users)
4. [Product Principles](#product-principles)
5. [MVP — Shipped](#mvp--shipped)
6. [Phase 1 — Real Data & Polish (Q3 2026)](#phase-1--real-data--polish-q3-2026)
7. [Phase 2 — Native iOS (Q4 2026)](#phase-2--native-ios-q4-2026)
8. [Phase 3 — Intelligence Layer (Q1–Q2 2027)](#phase-3--intelligence-layer-q12027)
9. [Tappa 2.0 — Platform (2027)](#tappa-20--platform-2027)
10. [Technical Architecture](#technical-architecture)
11. [Monetization](#monetization)
12. [Success Metrics](#success-metrics)
13. [Risks & Constraints](#risks--constraints)
14. [What We Will Not Build](#what-we-will-not-build)

---

## Executive Summary

Tappa is an AI-powered card co-pilot and household finance hub. It tells you which credit card to use at every purchase in real time, tracks your family's finances with smart separation, and helps you earn hundreds more in rewards every year — without spreadsheets, without research, and without thinking about it.

The average American household with 3+ credit cards leaves **$1,200–$2,400/year** in unclaimed rewards because they don't optimize which card to use where. Tappa solves this in one tap.

**Long-term vision:** Become the financial operating system for modern households — the single place where couples and families manage spending, rewards, credit health, and financial goals together, with privacy and autonomy built in from day one.

---

## Problem Statement

### The rewards gap
Credit card issuers design rewards programs to be confusing. Rotating categories, activation requirements, caps, transfer partners — it takes hours of research to truly maximize a card stack. Most people just pick one card and use it everywhere, leaving significant money on the table.

### The household visibility problem
Couples and families share finances but lack a single, honest view of household spending. Existing tools either merge everything (invasive) or keep everything separate (useless). There's no product that gives both people visibility into what matters while preserving individual privacy.

### The credit black box
Most people check their credit score when they apply for a loan — too late. They don't understand what's driving their score or how to improve it. And they have no idea how likely they are to be approved for their next big purchase.

### The subscription trap
The average household pays for 4–6 subscriptions they've forgotten about. These are rarely audited because no single tool surfaces them clearly alongside the spending context.

---

## Target Users

### Primary: The Optimizer Couple
- **Age:** 28–42
- **HHI:** $120k–$250k
- **Cards:** 3–6 credit cards between the two of them
- **Pain:** Each person has different cards, neither knows which to use where
- **Goal:** Earn more rewards without managing a spreadsheet
- **Device:** iPhone primary, Android secondary

### Secondary: The Solo Maximizer
- **Age:** 25–38
- **HHI:** $75k–$150k
- **Cards:** 2–4 credit cards
- **Pain:** Knows rewards optimization matters but finds it overwhelming
- **Goal:** Set it and forget it — have the app tell them what to do
- **Device:** iPhone primary

### Tertiary: The Family CFO
- **Age:** 35–50
- **HHI:** $150k+
- **Cards:** 4–8 cards across household
- **Pain:** Trying to manage the whole family's finances, subscriptions, credit
- **Goal:** One dashboard for everything — but with privacy controls
- **Device:** iPhone + iPad

### Not Our User (Yet)
- People with 0–1 credit cards (no optimization problem)
- People with credit scores below 580 (can't get reward cards)
- People who pay cash/debit by choice
- Small business owners (Phase 3+)

---

## Product Principles

1. **One tap, one answer.** The recommendation must be instant and clear. Never make the user do math.
2. **Private by default.** In a household, financial data is personal. Share nothing without explicit opt-in.
3. **Earn more, not just spend less.** Tappa's frame is positive — maximize what you earn, not deprivation.
4. **Show the why.** Every recommendation comes with a plain-English explanation. Users should learn, not just follow.
5. **No bank logins shown to anyone else.** We are not Mint. We are a co-pilot, not an auditor.
6. **Mobile-first, always.** If it doesn't work perfectly on a phone in a checkout line, it doesn't ship.
7. **Trust is the product.** No selling data. No dark patterns. No surprise charges.

---

## MVP — Shipped ✓

### Overview
A fully functional PWA with all core screens. Built with vanilla HTML/CSS/JS — no framework, no build step. Runs at `http://localhost:3000` locally and deploys to any static host.

---

### Feature 1: Card Optimizer (Tap to Card)

**What it does:** User taps a button → Tappa instantly recommends which card to use based on their top historical spend category. Or they can manually pick a merchant/category.

**User story:** As a user standing in a checkout line, I want to know in one tap which card to use so I earn the most rewards on this purchase.

**Acceptance criteria:**
- Tap to Card button on home screen auto-detects top spend category from history
- If no history, defaults to dining
- Shows best card, reward rate, dollar value on $X purchase
- Shows AI explanation in plain English
- Shows all other cards ranked for comparison
- Result screen loads in under 500ms

**Screens:** `home` → (`tap-to-card` action) → `result`
**Manual flow:** `home` → `optimizer` → category/merchant picker → `result`

**Details:**
- Category picker: 10 categories (dining, groceries, gas, travel, amazon, drugstore, streaming, entertainment, transit, everything)
- Amount input with quick-pick buttons ($20, $50, $100, $200)
- GPS-based nearby merchant detection (OpenStreetMap / Overpass API)
- Every recommendation is saved to history (category, merchant, card used, dollar saved)
- History drives future suggestions and home screen points chart

---

### Feature 2: Nearby Merchant Detection

**What it does:** When user opens the Optimizer, Tappa requests location and shows nearby merchants with their category pre-filled.

**User story:** As a user near a Whole Foods, I want to tap the merchant name and immediately get a recommendation without typing anything.

**Acceptance criteria:**
- On optimizer open, location is requested automatically
- Within 10 seconds, shows nearby merchants as tappable chips
- Each merchant chip shows best card pre-computed
- Tapping a merchant chip pre-fills category and goes straight to recommendation
- If location denied, shows manual category picker without interruption
- If no merchants found, shows graceful fallback

**Technical details:**
- Overpass API query for amenities within 500m radius
- Mapping from OSM amenity types to Tappa categories (restaurant→dining, supermarket→groceries, fuel→gas, etc.)
- Geolocation API with 10-second timeout
- Results cached for session (don't re-query on every render)

---

### Feature 3: Home Screen

**What it does:** The main dashboard showing this month's earnings per card and the primary CTA.

**User story:** As a returning user, I want to see at a glance how much I've earned this month and be able to get a recommendation in one tap.

**Acceptance criteria:**
- Card carousel shows all user's cards with visual chip representation
- "Points Earned This Month" section shows per-card breakdown
- Bar chart proportionally sized to max earner
- Shows points (for points cards) and cash back (for cashback cards) separately
- Transaction count per card shown
- Cards with no activity shown at 50% opacity
- Tap to Card button is the dominant CTA
- Auto-suggest banner appears if a better default card is detected

**Auto-suggest default card logic:**
- Analyzes last 30 history entries
- Finds top spend category by frequency
- Finds best card for that category
- If current default is not the best card for top category, shows suggestion banner
- User can accept (changes default) or dismiss (don't show again)
- Dismissed state persists in localStorage

---

### Feature 4: My Cards Management

**What it does:** Users can add cards from the database, remove cards, and set a default.

**User story:** As a new user, I want to select which cards I have so Tappa can recommend from my actual wallet.

**Acceptance criteria:**
- Onboarding step 1: card selection from full CARD_DB grouped by issuer
- Card shown with full name, reward type, card type tag (Rotating/Custom/Smart)
- Select/deselect with visual checkbox
- If dynamic card selected (rotating/customizable), step 2 shows setup for that card
- Default card is set to first card added; user can change at any time
- Remove card button (✕) on each card row in home screen
- Setting a new default shows toast confirmation

**Card types supported:**
- **Static** — fixed rates per category (most cards)
- **Rotating** — 5% on quarterly categories that require activation (Chase Freedom Flex, Discover it)
- **Customizable** — user picks their 3% category monthly (BofA Customized Cash)
- **Auto-custom** — auto-earns 5% on top spend category (Citi Custom Cash)

---

### Feature 5: Budget Tracker

**What it does:** Monthly budget overview with per-category spend bars, over/under alerts, and recent purchases.

**User story:** As a user, I want to see how much I've spent this month by category so I know where I'm overspending.

**Acceptance criteria:**
- Header shows total spent vs total budget with progress bar
- Color-coded: green (<80%), yellow (80–100%), red (over budget)
- Per-category rows with spend bar, amount, and "$ left" or "+$ over" badge
- Trend indicator vs last month (↑ or ↓ percentage)
- Over-budget warning banner when any category exceeds budget
- Recent Purchases section: last 10 transactions with merchant, card, date, amount, savings
- Total saved with Tappa shown prominently
- Nudge reminder shortcut links to Profile settings
- "Card Tips" button links to Card Suggestions screen

---

### Feature 6: Budget Nudge Notifications

**What it does:** Users set a time to receive a daily budget check-in reminder.

**User story:** As a user, I want a nudge at 9pm to review my spending so I stay on track without thinking about it.

**Acceptance criteria:**
- Toggle nudges on/off in Profile → Budget Reminders
- Choose time: Morning (default 8:00am), Evening (default 9:00pm), or Both
- Custom time picker for each (30-min increments)
- Setting persists in localStorage
- Budget tab shows current nudge status
- (Phase 1) Actual push notification delivery

---

### Feature 7: Subscriptions Tracker

**What it does:** See all household subscriptions grouped by who pays, with unused ones flagged.

**User story:** As a household, we want to see all our subscriptions in one place and know which ones we're not actually using.

**Acceptance criteria:**
- Total monthly subscription cost shown in header
- Grouped by owner: Shared / Your subscriptions / Partner's subscriptions
- Per-subscription row: name, emoji, price/mo, next bill date, owner
- Inactive/unused subscriptions flagged with warning and reason
- Cancel recommendation for subscriptions unused >30 days
- Monthly total by owner shown

---

### Feature 8: Returns Tracker

**What it does:** Track open returns with deadlines and refund status.

**User story:** As a user, I want to know which returns I have pending and when I need to drop them off so I don't miss a deadline.

**Acceptance criteria:**
- Status chips: Return Shipped (blue), Drop Off by [date] (orange), Awaiting Approval (gray), Refunded (green)
- Per-return row: merchant, item name, amount, status, tracking number (if applicable), deadline, refund ETA
- Active returns shown first, refunded collapsed or at bottom
- Total pending refund amount shown
- Overdue returns flagged prominently

---

### Feature 9: Credit Score Viewer

**What it does:** Per-household-member credit score view with factors, history, and loan approval likelihood.

**User story:** As a user, I want to understand my credit score and know how likely I am to be approved for a mortgage.

**Acceptance criteria:**
- Animated SVG semicircle gauge (300–850 range)
- Score label (Exceptional / Very Good / Good / Fair / Poor)
- Month-over-month change with direction arrow
- Score history sparkline (last 8 months)
- 5 factor rows: Payment History, Utilization, Credit Age, Credit Mix, New Inquiries
- Per-factor: value, status label, color indicator
- Loan approval likelihood: Mortgage, Auto, Personal — percentage + label + estimated rate
- Score range guide (color legend)
- Member selector in Family Hub to switch between household members

---

### Feature 10: Family Hub

**What it does:** Household-level dashboard showing all members' spend, credit, and shared finances.

**User story:** As a couple, we want to see our combined household finances in one place without giving each other full access to everything.

**Acceptance criteria:**
- Member cards showing: name, initials avatar, spend this month, credit score, cards owned
- Total household spend this month
- Total subscription cost
- Pending share approval requests (approve/deny)
- Shortcuts to each member's credit score screen
- Shortcuts to subscriptions and returns
- Access controls: members can only see what's been approved to share

**Privacy model:**
- Credit scores: never shared (always private)
- Budget: opt-in, requires partner approval
- Subscriptions: opt-in, requires approval
- Transactions: opt-in, requires approval per request

---

### Feature 11: Card Suggestions

**What it does:** AI-generated card recommendations — upgrade, downgrade, add new, or optimize existing.

**User story:** As a user who spends $400/mo on dining, I want to know if there's a card that would earn me more at restaurants.

**Acceptance criteria:**
- 4 suggestion types: Upgrade, New Card, Downgrade, Optimize
- Per-suggestion: card name (with color chip), urgency badge (High/Medium/Low), reason text, annual savings estimate
- Reason text references actual spending data ("You spent $412 on dining this month")
- Accessible from Budget tab ("Card Tips" button) and Family Hub
- Suggestions are static in MVP; personalized in Phase 3

---

### Feature 12: Share with People

**What it does:** Add household members or partners and control exactly what financial data they can see.

**User story:** As a couple, I want my partner to see our shared subscriptions but not my individual transactions.

**Acceptance criteria:**
- Add any person by name + relationship (Partner, Roommate, Family, etc.)
- Auto-generated colored avatar with initials
- Per-person toggles for: Budget, Subscriptions, Transactions
- Toggling on sends a mock "approval request" to the other person
- Pending approvals shown in Family Hub with approve/deny buttons
- Approved access changes the share toggle to active state
- Remove person removes all sharing immediately
- Transactions sharing shows "Needs approval each time" as description

---

### Feature 13: iPhone Widget Setup Guide

**What it does:** Step-by-step instructions for adding Tappa to the iPhone home screen as a PWA shortcut.

**User story:** As an iPhone user, I want Tappa accessible from my home screen in one tap so I can use it during checkout.

**Acceptance criteria:**
- Step-by-step numbered instructions with visual callouts
- Platform-aware: iOS Safari specific instructions
- Shows what the home screen icon will look like (mockup)
- Web vs Native comparison table (current vs future capabilities)
- Note about native app roadmap (Phase 2)

---

### Technical Foundation (MVP)

| Component | Decision | Reason |
|-----------|----------|--------|
| Framework | Vanilla JS | No build step, no dependencies, fast |
| Styling | Custom CSS + Tailwind CDN | Design system with utility fallback |
| Storage | localStorage (tappa_v2) | No backend needed for MVP |
| Data | CSV files loaded via fetch() | Editable without touching JS |
| Routing | Manual state machine (`App.navigate`) | Simple, predictable |
| Events | Single delegated click listener on `#app` | Survives re-renders |
| Rendering | Full innerHTML replacement on state change | Simple, no diffing needed at this scale |
| PWA | manifest.json + apple-mobile-web-app tags | iOS installable |
| Fonts | Inter via Google Fonts | Clean, modern, legible at small sizes |
| Maps | OpenStreetMap + Overpass API | Free, no API key, good coverage |

---

## Phase 1 — Real Data & Polish (Q3 2026)

**Goal:** Replace all mock data with real data. Make Tappa something you use every day.
**Success metric:** 5+ sessions/week per user, 60-day retention >35%

---

### 1.1 Transaction Import (Plaid)

**Priority:** P0 — This is the unlock for everything else.

**What it does:** Connect bank and credit card accounts to automatically import real transactions.

**User stories:**
- As a user, I want to connect my Chase account so Tappa can see my real spending without me entering anything manually
- As a user, I want to see which card I actually used for each purchase
- As a user, I want my points/cashback calculated from real transactions, not estimates

**Requirements:**
- Plaid Link integration for account connection
- Read-only access (no write permissions ever)
- Support: Chase, Amex, Citi, Capital One, Discover, BofA, Wells Fargo, Apple Card
- Auto-categorization of transactions using Plaid's category API + custom overrides
- Duplicate detection (don't show same transaction twice)
- Transaction refresh: daily auto-sync + manual pull-to-refresh
- Historical import: 90 days back on first connect
- Disconnect account: removes all imported data immediately
- Privacy: transactions stored encrypted, never sold, never shared without consent

**Technical requirements:**
- Plaid Link SDK (iOS + web)
- Backend needed: Plaid requires server-side token exchange (cannot be client-only)
- Minimum backend: Node.js serverless functions (Vercel/Netlify Functions)
- Data model: extend transaction schema with `source: 'plaid'|'manual'`, `plaidTransactionId`

**Edge cases:**
- Pending transactions: show with "Pending" label, update when settled
- Refunds: detect negative transactions, match to original if possible
- International transactions: convert to USD, show original currency
- Cash advances: exclude from rewards calculation

---

### 1.2 Real Credit Score API

**Priority:** P1

**What it does:** Replace mock credit score data with live scores pulled from a bureau.

**Options:**
- **Experian Connect API** — most accurate, $0.50–$2/pull, requires user consent
- **Credit Karma API** — free but requires partnership agreement
- **Finicity (Mastercard)** — good for open banking, includes credit monitoring

**Requirements:**
- One-time user consent flow with clear explanation of what's being pulled
- Weekly refresh (daily is too expensive and unnecessary)
- Score change alert: push notification when score moves ±5 points
- Factor explanations in plain English (not credit bureau jargon)
- Hard inquiry tracking: alert user when a hard pull is about to happen
- Soft pull only for score monitoring (never hard pull)
- Score dispute guidance: link to relevant bureau dispute portal

**Privacy:**
- Credit score data stored encrypted per user
- Never shown to household partners (always private)
- Deleted immediately on account deletion

---

### 1.3 Live Card Rates Database

**Priority:** P1

**What it does:** Replace static CSV card database with an API-backed database that stays current.

**Requirements:**
- Admin dashboard to update card rates without a code deploy
- Quarterly category rotation updates (Chase Freedom, Discover It) pushed automatically
- Card addition/removal without app update
- 50+ cards supported at launch (up from 15)
- Card rate verification: community-reported rates with admin approval
- Change history: show when rates last updated on card detail view
- New card alerts: "A new card was added that matches your spending profile"

**Data model per card:**
```
id, name, issuer, network (Visa/MC/Amex/Discover),
cardType, rewardType, program, pointValue,
annualFee, signupBonus, signupSpendReq, signupWindow,
rates: { category: rate },
quarterInfo: { period, categories, displayCategories, activationUrl },
customOptions: [...],
referralUrl, applyUrl,
lastVerified, verifiedBy
```

---

### 1.4 Push Notifications

**Priority:** P1

**What it does:** Proactive nudges delivered at the right moment.

**Notification types:**

| Notification | Trigger | Frequency |
|-------------|---------|-----------|
| Budget nudge | User-set time | Daily |
| Over budget alert | Category hits 80% of budget | Once per category per month |
| Rotating card activation | 1st of new quarter | Quarterly |
| Score change alert | Score moves ±5 pts | As it happens |
| Near merchant alert | Geofence entry (opt-in) | Per visit |
| Subscription renewal | 3 days before bill | Monthly per sub |
| Return deadline | 3 days before deadline | Per return |
| Missed rewards | Weekly analysis of wrong-card usage | Weekly |

**Technical:**
- Web Push API for PWA (Phase 1)
- APNs (Apple Push Notification Service) for native iOS (Phase 2)
- Notification preferences: per-type on/off toggles in Profile
- Quiet hours: no notifications between 10pm–7am unless user overrides
- Deep link: each notification opens the relevant screen

---

### 1.5 Service Worker + Offline Mode

**Priority:** P2

**What it does:** Tappa works even when you have no signal (e.g., underground, poor store coverage).

**Requirements:**
- App shell cached on install (index.html, app.css, app.js)
- Card database cached for offline recommendations
- Offline indicator shown when network unavailable
- Tap to Card works offline using cached card data
- Transactions queued when offline, synced when reconnected
- Background sync for transaction import
- Cache invalidation: card rates refreshed daily when online

---

### 1.6 UI Polish Pass

**Priority:** P2

**Requirements:**
- Screen-to-screen transitions: slide in from right (forward), slide back left (back)
- Haptic feedback: tap vibration on primary actions (web Vibration API)
- Skeleton loading states: while CSV/API data loads, show skeleton cards
- Pull-to-refresh on transaction list and budget screen
- Empty state illustrations: custom SVGs for no cards, no transactions, no returns
- Dark mode: follows system preference, CSS variables make this straightforward
- Scroll momentum: native-feel scroll on iOS
- Safe area handling: notch and home indicator padding on all screens
- Micro-animations: progress bars animate in on load, card carousel smooth scroll

---

### 1.7 Analytics & Insights

**Priority:** P2

**Monthly Recap screen (new):**
- Total earned: points + cashback combined
- Top category this month
- Best card used (most earnings)
- Missed opportunities: transactions on suboptimal card with "could have earned $X more"
- Month-over-month comparison
- Running total since joining Tappa

**Year-in-review (annual, December):**
- Total rewards earned
- Best single purchase (most points/cashback)
- Favorite merchant (most visits)
- Money saved by using Tappa vs. default card only

---

## Phase 2 — Native iOS (Q4 2026)

**Goal:** Get Tappa on the App Store. Unlock native capabilities that change daily behavior.
**Success metric:** App Store rating ≥4.7, D30 retention ≥40%

---

### 2.1 Native iOS App (Swift / SwiftUI)

**Why native vs PWA:**
- PWA cannot deliver background location alerts (critical for Phase 2)
- WidgetKit requires native app
- Push notifications more reliable via APNs than Web Push
- Face ID / Touch ID for secure access
- Better performance and animation quality
- App Store distribution = discoverability

**Requirements:**
- SwiftUI for all screens (mirrors PWA design system)
- Minimum iOS 16
- Universal app: iPhone + iPad
- Onboarding: same flow as PWA
- All features from Phase 1 included
- iCloud Keychain for secure token storage
- App size target: under 30MB

---

### 2.2 WidgetKit Home Screen Widget

**This is the killer feature.** A widget that shows you which card to use — right on your lock screen or home screen.

**Widget sizes:**

**Small widget (2×2):**
- Shows: "Use [Card Name]" for current location
- Sub-text: "4x at [Merchant Name]"
- Card color as widget background
- Updates: every 30 min or on location change

**Medium widget (2×4):**
- Left: current best card recommendation
- Right: this month's earnings summary (points + cash)
- Quick stat: total saved

**Lock screen widget (linear):**
- Shows current best card name + category
- Deep links to full app on tap

**Live Activity (Dynamic Island + Lock Screen):**
- Triggered when user opens Tappa during shopping
- Shows recommendation persistently while user shops
- Clears when transaction is saved or app is closed

**Technical:**
- WidgetKit + App Intents (iOS 17+)
- Shared data container between app and widget (App Groups)
- Widget configuration: user can pin a specific category or set to "auto"

---

### 2.3 Siri & Shortcuts Integration

**Requirements:**
- "Hey Siri, which card should I use at Whole Foods?" → instant spoken + visual response
- "Hey Siri, how much have I spent on dining this month?"
- "Hey Siri, what's my best card for groceries?"
- "Hey Siri, show me my Tappa"
- Shortcuts app: custom automations (e.g., "Every time I arrive at Target, ask Tappa which card")
- App Intents framework (iOS 16+)
- Donation: learn which Siri queries user makes most, surface proactively

---

### 2.4 Apple Wallet Integration

**Requirements:**
- Add card from Apple Wallet to Tappa with one tap (no manual selection)
- Display card art from Apple Wallet in card carousel
- Apple Pay transaction detection: if user taps with Apple Pay, Tappa records the transaction automatically
- "Which card is in your Apple Wallet default?" awareness

**Limitations:**
- Apple restricts full Apple Pay transaction access; may require PassKit + Wallet extension workaround
- Card art requires issuer partnership or reverse-lookup from BIN range

---

### 2.5 Location-Based Proactive Suggestions

**Requirements:**
- Background location monitoring (opt-in, clearly explained)
- Geofences around frequent merchants (set automatically based on history)
- Notification on geofence entry: "You're at Trader Joe's — use Amex Gold for 4x 🛒"
- Significant location change API (battery-efficient, not continuous GPS)
- User can see and delete all geofences in Settings
- Notification rate limiting: max 3 location notifications per day
- Smart suppression: don't notify if user just used Tappa in last 5 min

---

### 2.6 Family Accounts (Real Multi-User)

**MVP has mock family data. Phase 2 makes it real.**

**Requirements:**
- Invite household member via link or QR code
- Each member has their own account with their own cards
- Shared household budget: both members contribute, both can see
- Permission model: each person controls their own data
- Real approval flow: sharing request sent as push notification to partner
- Approved access syncs in real time
- Family admin (account creator) can manage member list
- Leave household: immediately revokes all sharing

---

## Phase 3 — Intelligence Layer (Q1–Q2 2027)

**Goal:** Tappa stops being reactive and becomes proactive. Users feel like they have a financial advisor.
**Success metric:** Avg. annual savings per user ≥$400, NPS ≥60

---

### 3.1 Spend Personality & Profile

**What it does:** After 30+ days of transaction data, Tappa builds a spend profile for the user.

**Profiles (user gets a primary + secondary):**
- 🍽️ **Foodie** — dining + coffee >30% of spend
- 🛒 **Home Base** — groceries + home >35% of spend
- ✈️ **Traveler** — travel + transit >20% of spend
- 📦 **Online Shopper** — amazon + online >25% of spend
- 🎬 **Entertainment** — streaming + entertainment + dining >35%
- 🚗 **Commuter** — gas + transit >20% of spend
- 💪 **Wellness** — gym + health >15% of spend

**Output:**
- Profile card shown in home screen and profile tab
- "Your ideal card stack for a [Foodie + Commuter]" recommendation
- Explanation of which cards are optimal for this profile
- Re-evaluated monthly as spend patterns evolve

---

### 3.2 Smart Card Stack Optimizer

**What it does:** Given a user's spend profile, recommend the mathematically optimal 2–3 card combination.

**Requirements:**
- Input: user's spend breakdown by category (from transaction history)
- Algorithm: brute-force all card combinations from database → find max total earnings
- Output: recommended stack with breakdown of which card to use for what
- Annual fee ROI: "Card X costs $550/yr but earns you $820 — net +$270"
- Break-even calculator: "At your spending, this card pays for itself in 3.2 months"
- Comparison: current stack vs. optimal stack — "You're leaving $X/year unclaimed"
- One-click apply: link to card application with referral

---

### 3.3 Points Ecosystem Intelligence

**What it does:** Help users understand their points across all programs and how to maximize them.

**Requirements:**
- Points balance tracking: connect each program's account (Chase UR, Amex MR, Citi TY, Capital One Miles, etc.)
- Current point value estimate: "Your 84,000 Chase points are worth $1,260 as cash or $1,680 through partners"
- Transfer partner analysis: "Transfer to Hyatt: 84k pts = $1,890 in hotels vs $840 cash back"
- Best redemption alert: "Your points are worth 20% more than usual for [specific transfer partner] right now"
- Expiry alerts: "Your 12,000 Citi points expire in 45 days — here's how to use them"
- Points velocity: "At your current earn rate, you'll reach 100k points in 3.4 months"

---

### 3.4 Subscription Intelligence (Automated)

**What it does:** Auto-detect all subscriptions from transaction data (no manual entry) and proactively manage them.

**Requirements:**
- Auto-detection: recurring transactions flagged with pattern matching (same merchant, similar amount, monthly/annual frequency)
- Price change detection: "Netflix increased your charge from $15.99 to $17.99 this month"
- Usage context: integrate app usage data (iOS Screen Time API, opt-in) with subscription cost
- ROI score per subscription: "Spotify: 847 mins/mo = $0.02/min — Good value"
- Cancellation flow: direct link to cancellation page per service + reminder if not cancelled in 7 days
- Annual vs monthly optimizer: "Switch Dropbox to annual, save $23.88/yr"
- Duplicate detector: "You're paying for both Netflix and Hulu — is that intentional?"

---

### 3.5 AI Financial Coach (Claude API)

**What it does:** Conversational AI that can answer natural language questions about your finances.

**Examples:**
- "Am I spending more than usual on restaurants this month?"
- "What would happen to my rewards if I switched my default card to Amex Gold?"
- "Is my Amex Platinum worth keeping based on how I actually use it?"
- "How long until I can afford a trip to Japan if I save $500/mo?"
- "Which of my subscriptions should I cancel?"

**Requirements:**
- Chat interface (bottom sheet or full screen)
- Claude API (claude-sonnet) with user's financial data as context
- No raw transaction data sent to Claude — only aggregated summaries
- Conversation history: last 5 messages retained for context
- Proactive coach: weekly "Your financial coach has a suggestion" card in home
- Privacy: clear disclosure that anonymized summaries (not raw data) are used

---

### 3.6 Missed Rewards Weekly Report

**What it does:** Every Monday, show users how much they left on the table last week.

**Requirements:**
- Per-transaction analysis: was the optimal card used?
- Weekly total: "You earned $X last week. You could have earned $Y (+$Z)"
- Top missed opportunity: "You spent $134 at Target with [Card A] — [Card B] would have earned $5.36 more"
- Trend: are you getting better or worse at optimizing?
- Delivered as push notification + in-app card
- Not shown if optimization rate >95% (user is already doing great)

---

## Tappa 2.0 — Platform (2027)

**Goal:** Tappa becomes the financial operating system for modern households.
**Success metric:** 100k MAU, $1M ARR, NPS ≥70

---

### The Household Financial OS

**Core idea:** Every person in a household manages their finances independently, but can see shared context when relevant. Tappa is the hub.

**New platform capabilities:**

**Tappa for Couples — Joint Mode**
- Shared net worth dashboard (assets + liabilities)
- Joint budget with individual contribution tracking
- "Fair share" calculator: who owes what on shared expenses
- Shared financial goals (e.g., "Save $20k for house down payment")
- Financial transparency score: how aligned are we on spending?

**Tappa for Families**
- Parent + child accounts (under 18)
- Allowance management: set weekly/monthly allowance, track spend
- Financial education layer for teens: explain credit scores, interest, rewards
- Spending limits on child's card with alerts
- Goal-based savings: "Save for first car" with visual progress

---

### Tappa Marketplace

**What it does:** Personalized card and financial product recommendations with one-click apply.

**Requirements:**
- Card comparison engine: based on user's actual spend profile
- "Best card for you right now" with personalized reasoning
- Partner affiliate relationships with major issuers
- Signup bonus tracker: remind user to hit spend requirements
- Application status tracking: in-app view of application status
- Referral program: "Refer a friend, earn $50 when they're approved"
- Transparency: always show if a recommendation is sponsored

**Ethical guardrails:**
- Never recommend a card that isn't genuinely better for the user
- Always show annual fee and full cost of ownership
- Show "don't apply if..." warnings (credit score requirements, etc.)

---

### Tappa Premium Subscription

| Tier | Price | Features |
|------|-------|---------|
| **Free** | $0/mo | Card optimizer, 3 cards, 30-day history, manual transactions |
| **Pro** | $4.99/mo | Unlimited cards, Plaid import, 1-year history, all Phase 1 features, credit score |
| **Household** | $9.99/mo | Everything in Pro, up to 6 members, family hub, shared budget, AI coach |
| **Annual discount** | 20% off | Pro = $47.99/yr, Household = $95.99/yr |

**Free tier strategy:**
- Free tier is genuinely useful (card optimizer is the core value)
- Paywall hits when user needs more than basic features
- No paywalling safety-critical features (e.g., return deadlines always visible)

---

### Tappa Business (Phase 3+)

**For freelancers, solopreneurs, and small teams:**
- Separate business card stack from personal
- Expense categorization for tax purposes
- Mileage tracking (IRS-compliant)
- Receipt capture + categorization (camera → ML extraction)
- P&L summary: income vs. business spend
- Export to CSV for accountant or TurboTax

---

## Technical Architecture

### Current (MVP)
```
Browser → index.html → app.js (vanilla JS SPA)
                     → app.css
                     → data/*.csv (fetched on boot)
                     → localStorage (tappa_v2)
```

### Phase 1 additions
```
Browser → Static PWA (same)
       → Serverless Functions (Vercel/Netlify)
            → Plaid API (transaction import)
            → Credit API (score monitoring)
            → Card Rates API (admin-managed)
       → PostgreSQL or Supabase (user accounts, transactions)
       → Web Push (notifications)
```

### Phase 2 additions
```
iOS App (Swift/SwiftUI)
    → WidgetKit
    → APNs (push notifications)
    → Core Location (geofencing)
    → App Groups (widget ↔ app shared data)
    → Shared backend from Phase 1
```

### Phase 3 additions
```
All previous +
    → Claude API (AI coach, insights generation)
    → ML model (transaction categorization, spend profiling)
    → Points balance APIs (Chase, Amex, etc.)
    → Screen Time API (subscription usage, opt-in)
```

### Phase 2.0
```
All previous +
    → Multi-tenant backend (households, roles, permissions)
    → Real-time sync (Supabase Realtime or Pusher)
    → Affiliate API integrations (card issuers)
    → Analytics pipeline (Amplitude or Mixpanel)
```

---

## Monetization

### Revenue streams by phase

| Phase | Revenue Model | Est. Revenue |
|-------|--------------|-------------|
| MVP | None (build & learn) | $0 |
| Phase 1 | Early access waitlist, no charge | $0 |
| Phase 2 | Pro subscription launch ($4.99/mo) | $5k–$20k MRR |
| Phase 3 | Household tier + affiliate kickbacks | $50k–$200k MRR |
| 2.0 | Full subscription + marketplace + business | $1M+ ARR |

### Affiliate model (Phase 3+)
- Partner with card issuers for referral fees ($50–$200 per approved application)
- Only recommend cards that are genuinely better for the user
- Full disclosure: "Tappa may earn a referral fee if you apply via this link"
- Referral revenue never influences which card is recommended as "best"

---

## Success Metrics

### Engagement
| Metric | Phase 1 Target | Phase 2 Target | 2.0 Target |
|--------|---------------|----------------|------------|
| DAU/MAU ratio | 25% | 35% | 45% |
| Sessions per week | 3 | 5 | 7 |
| D7 retention | 40% | 50% | 60% |
| D30 retention | 25% | 40% | 55% |

### Financial impact
| Metric | Phase 2 Target | Phase 3 Target |
|--------|---------------|----------------|
| Avg. annual savings per user | $150 | $400 |
| Optimization rate (right card used) | 60% | 85% |
| Avg. cards per user | 2.5 | 3.5 |

### Business
| Metric | Phase 2 | Phase 3 | 2.0 |
|--------|---------|---------|-----|
| Total users | 5k | 25k | 100k |
| Paid users | 500 | 5k | 25k |
| MRR | $2.5k | $25k | $125k |
| NPS | 45 | 60 | 70 |

---

## Risks & Constraints

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Plaid API cost at scale | Medium | High | Negotiate volume pricing; cache aggressively; batch syncs |
| Apple restricts PWA capabilities further | Medium | High | Prioritize native iOS app in Phase 2 |
| Card rates database becomes stale | High | Medium | Admin tool for rapid updates; community reporting |
| User trust: "Is this safe?" | High | High | No credentials stored; read-only; clear privacy page |
| Low D30 retention without real data | High | High | Phase 1 Plaid integration is P0 for this reason |
| Regulatory (CFPB, state law) | Low | Very High | Legal review before handling real financial data |
| Affiliate model perceived as conflict of interest | Medium | High | Full transparency in UI; editorial independence policy |

---

## What We Will Not Build

- **We will not store card numbers, CVVs, or bank passwords** — ever
- **We will not make or initiate payments** — Tappa is read-only
- **We will not issue credit cards or loans**
- **We will not sell user data** to any third party
- **We will not show ads** (subscription model only)
- **We will not share credit scores with household partners** — scores are always private
- **We will not require social login** — email/phone only
- **We will not build for Android natively before iOS is excellent** — iOS first, always
