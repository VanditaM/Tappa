# Tappa — Tap Smarter. Keep More.

Tappa is an AI-powered credit card co-pilot that instantly tells you which card in your wallet earns the most rewards for any purchase — so you never leave money on the table.

## What It Does

- **Smart Card Recommendations** — Select a spending category (dining, groceries, gas, travel, etc.) and an amount, and Tappa instantly recommends the best card to use based on your actual reward rates.
- **Multi-Card Wallet** — Add and manage all your credit cards in one place. Tappa knows the reward structure for each card including static rates, rotating quarterly categories, and auto-custom cards.
- **Reward Tracking** — View your savings history and see how much you've earned across all categories over time.
- **Card Insights & Upgrades** — Get personalized suggestions to upgrade, downgrade, or optimize your card setup based on your spending habits.
- **Family Accounts** — Manage cards across multiple family members and track everyone's rewards in one dashboard.
- **Nearby Merchants** — Discover nearby merchants and know which card to tap before you even walk in.

## Supported Cards

| Issuer | Cards |
|---|---|
| Chase | Sapphire Preferred, Sapphire Reserve, Freedom Flex, Freedom Unlimited |
| American Express | Gold Card, Platinum Card |
| Citi | Double Cash, Custom Cash |
| Capital One | Venture, Savor Cash Rewards |
| Discover | Discover it Cash Back |
| Bank of America | Customized Cash Rewards |
| US Bank | Cash+ Visa |
| Wells Fargo | Active Cash |
| Apple | Apple Card |

## Spending Categories

Dining · Groceries · Gas · Travel · Amazon · Drugstore · Streaming · Entertainment · Transit · Everything Else

## Tech Stack

- **Vanilla JavaScript** (no framework)
- **Tailwind CSS** (via CDN)
- **Progressive Web App (PWA)** — installable on iOS & Android
- **Google Fonts** — Inter

## Running Locally

No build step required. Just serve the files with any static server:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Project Structure

```
Tappa/
├── index.html       # App shell & entry point
├── app.js           # All app logic, card database & UI rendering
├── app.css          # Custom styles
├── manifest.json    # PWA manifest
└── icon.svg         # App icon
```
