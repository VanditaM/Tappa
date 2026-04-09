'use strict';

/* ============================================================
   TAPPA v1.1 — AI Card Co-Pilot
   Auto-location · Nearby Merchants · Smart Card Optimizer
   ============================================================ */

// ============================================================
// 0. CSV DATA LOADER
// ============================================================

// Parse a CSV string into an array of objects
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = splitCSVRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
    return obj;
  });
}

function splitCSVRow(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { result.push(cur); cur = ''; continue; }
    cur += c;
  }
  result.push(cur);
  return result;
}

const DataLoader = {
  async init() {
    const [cards, cats, hist, budget, subs, returns_, suggest] = await Promise.all([
      this._csv('data/cards.csv'),
      this._csv('data/categories.csv'),
      this._csv('data/history.csv'),
      this._csv('data/budget.csv'),
      this._csv('data/subscriptions.csv'),
      this._csv('data/returns.csv'),
      this._csv('data/suggestions.csv'),
    ]);

    // ── CARD_DB ──────────────────────────────────────────────
    CARD_DB.length = 0;
    cards.forEach(r => {
      const card = {
        id: r.id, name: r.name, issuer: r.issuer,
        cardType: r.cardType, rewardType: r.rewardType,
        program: r.program || undefined,
        pointValue: parseFloat(r.pointValue),
        color: r.color,
        rates: {
          dining:        parseFloat(r.rate_dining),
          groceries:     parseFloat(r.rate_groceries),
          gas:           parseFloat(r.rate_gas),
          travel:        parseFloat(r.rate_travel),
          amazon:        parseFloat(r.rate_amazon),
          drugstores:    parseFloat(r.rate_drugstores),
          entertainment: parseFloat(r.rate_entertainment),
          streaming:     parseFloat(r.rate_streaming),
          transit:       parseFloat(r.rate_transit),
          default:       parseFloat(r.rate_default),
        },
      };
      if (r.quarterPeriod) {
        card.quarterInfo = {
          period: r.quarterPeriod,
          categories: r.quarterCategories.split('|'),
          displayCategories: r.quarterDisplay.split('|'),
          activationUrl: r.quarterUrl,
        };
      }
      if (r.customCategoryRate) {
        card.customCategoryRate = parseFloat(r.customCategoryRate);
        card.customOptions = CUSTOM_OPTIONS[r.id] || [];
        card.userCustomCategory = null;
        card.userCustomCategories = [];
      }
      if (r.autoNote) card.autoNote = r.autoNote;
      CARD_DB.push(card);
    });

    // ── CATEGORIES ──────────────────────────────────────────
    CATEGORIES.length = 0;
    cats.forEach(r => CATEGORIES.push({ id: r.id, label: r.label, emoji: r.emoji }));

    // ── MOCK_HISTORY ─────────────────────────────────────────
    MOCK_HISTORY.length = 0;
    hist.forEach(r => MOCK_HISTORY.push({
      ts: Date.now() - parseFloat(r.hoursAgo) * 3600000,
      category: r.category,
      merchant: r.merchant,
      amount: parseFloat(r.amount),
      cardId: r.cardId,
      dollarSaved: parseFloat(r.dollarSaved),
    }));

    // ── MOCK_BUDGET ──────────────────────────────────────────
    MOCK_BUDGET.categories = budget.map(r => ({
      id: r.id, label: r.label, emoji: r.emoji,
      budget: parseFloat(r.budget), spent: parseFloat(r.spent),
      trend: parseFloat(r.trend), over: r.over === 'true',
    }));

    // ── MOCK_SUBSCRIPTIONS ───────────────────────────────────
    MOCK_SUBSCRIPTIONS.length = 0;
    subs.forEach(r => MOCK_SUBSCRIPTIONS.push({
      id: r.id, name: r.name, emoji: r.emoji,
      price: parseFloat(r.price), owner: r.owner, cat: r.cat,
      nextBill: r.nextBill, active: r.active === 'true',
      flag: r.flag || null,
    }));

    // ── MOCK_RETURNS ─────────────────────────────────────────
    MOCK_RETURNS.length = 0;
    returns_.forEach(r => MOCK_RETURNS.push({
      id: r.id, merchant: r.merchant, emoji: r.emoji,
      item: r.item, amount: parseFloat(r.amount),
      status: r.status, statusLabel: r.statusLabel, statusColor: r.statusColor,
      tracking: r.tracking || null, deadline: r.deadline || null,
      refundETA: r.refundETA,
    }));

    // ── MOCK_CARD_SUGGESTIONS ────────────────────────────────
    MOCK_CARD_SUGGESTIONS.length = 0;
    suggest.forEach(r => MOCK_CARD_SUGGESTIONS.push({
      type: r.type, card: r.card, cardColor: r.cardColor, urgency: r.urgency,
      reason: r.reason, annualSavings: parseFloat(r.annualSavings),
      habit: r.habit, habitEmoji: r.habitEmoji,
    }));
  },

  async _csv(path) {
    try {
      const res = await fetch(path);
      return parseCSV(await res.text());
    } catch (e) {
      console.warn(`Failed to load ${path}:`, e);
      return [];
    }
  },
};

// Custom options for customizable cards (kept in JS — too structured for CSV)
const CUSTOM_OPTIONS = {
  'bofa-cc': [
    { id:'gas',        label:'Gas & EV Charging', emoji:'⛽' },
    { id:'amazon',     label:'Online Shopping',   emoji:'📦' },
    { id:'dining',     label:'Dining',             emoji:'🍽️' },
    { id:'travel',     label:'Travel',             emoji:'✈️' },
    { id:'drugstores', label:'Drug Stores',        emoji:'💊' },
    { id:'home',       label:'Home Improvement',   emoji:'🏠' },
  ],
  'usb-cash-plus': [
    { id:'streaming',     label:'TV/Streaming',     emoji:'📺' },
    { id:'dining',        label:'Fast Food',         emoji:'🍔' },
    { id:'home',          label:'Home Utilities',    emoji:'🏠' },
    { id:'transit',       label:'Transit',           emoji:'🚇' },
    { id:'entertainment', label:'Movie Theaters',    emoji:'🎬' },
    { id:'electronics',   label:'Electronics',       emoji:'💻' },
    { id:'gyms',          label:'Gyms & Fitness',    emoji:'🏋️' },
    { id:'drugstores',    label:'Drug Stores',       emoji:'💊' },
  ],
};

// ============================================================
// 1. CARD DATABASE  (populated from data/cards.csv at boot)
// ============================================================

const CARD_DB = [
  // ── CHASE ──────────────────────────────────────────
  {
    id: 'csp', name: 'Chase Sapphire Preferred', issuer: 'Chase',
    cardType: 'static', rewardType: 'points', program: 'Chase Ultimate Rewards',
    pointValue: 1.5, color: '#1B3A6B',
    rates: { dining:3, travel:3, streaming:3, transit:2, groceries:1, gas:1, drugstores:1, amazon:1, entertainment:1, default:1 }
  },
  {
    id: 'csr', name: 'Chase Sapphire Reserve', issuer: 'Chase',
    cardType: 'static', rewardType: 'points', program: 'Chase Ultimate Rewards',
    pointValue: 1.5, color: '#2D2D2D',
    rates: { dining:3, travel:10, transit:3, streaming:1, groceries:1, gas:1, drugstores:1, amazon:1, entertainment:1, default:1 }
  },
  {
    id: 'cff', name: 'Chase Freedom Flex', issuer: 'Chase',
    cardType: 'rotating', rewardType: 'points', program: 'Chase Ultimate Rewards',
    pointValue: 1.0, color: '#003087',
    rates: { dining:3, drugstores:3, transit:1, groceries:1, gas:1, amazon:1, entertainment:1, streaming:1, travel:1, default:1 },
    quarterInfo: {
      period: 'Q2 2026 (Apr – Jun)',
      categories: ['gas', 'ev-charging'],
      displayCategories: ['Gas Stations', 'EV Charging'],
      activationUrl: 'https://creditcards.chase.com/freedom-flex'
    }
  },
  {
    id: 'cfu', name: 'Chase Freedom Unlimited', issuer: 'Chase',
    cardType: 'static', rewardType: 'points', program: 'Chase Ultimate Rewards',
    pointValue: 1.0, color: '#1A5276',
    rates: { dining:3, drugstores:3, travel:5, groceries:1.5, gas:1.5, amazon:1.5, entertainment:1.5, streaming:1.5, transit:1.5, default:1.5 }
  },
  // ── AMEX ───────────────────────────────────────────
  {
    id: 'amex-gold', name: 'Amex Gold Card', issuer: 'American Express',
    cardType: 'static', rewardType: 'points', program: 'Amex Membership Rewards',
    pointValue: 1.5, color: '#B8860B',
    rates: { dining:4, groceries:4, travel:3, gas:1, drugstores:1, amazon:1, entertainment:1, streaming:1, transit:1, default:1 }
  },
  {
    id: 'amex-plat', name: 'Amex Platinum Card', issuer: 'American Express',
    cardType: 'static', rewardType: 'points', program: 'Amex Membership Rewards',
    pointValue: 2.0, color: '#A8A9AD',
    rates: { travel:5, dining:1, groceries:1, gas:1, drugstores:1, amazon:1, entertainment:1, streaming:1, transit:1, default:1 }
  },
  // ── CITI ───────────────────────────────────────────
  {
    id: 'citi-dc', name: 'Citi Double Cash Card', issuer: 'Citi',
    cardType: 'static', rewardType: 'cashback', pointValue: 1.0, color: '#003B70',
    rates: { dining:2, groceries:2, gas:2, travel:2, amazon:2, drugstores:2, entertainment:2, streaming:2, transit:2, default:2 }
  },
  {
    id: 'citi-cc', name: 'Citi Custom Cash Card', issuer: 'Citi',
    cardType: 'auto-custom', rewardType: 'cashback', pointValue: 1.0, color: '#00845A',
    rates: { dining:1, groceries:1, gas:1, travel:1, amazon:1, drugstores:1, entertainment:1, streaming:1, transit:1, default:1 },
    autoNote: 'Auto-earns 5% on your top spend category each billing cycle'
  },
  // ── CAPITAL ONE ────────────────────────────────────
  {
    id: 'c1-venture', name: 'Capital One Venture', issuer: 'Capital One',
    cardType: 'static', rewardType: 'miles', program: 'Capital One Miles',
    pointValue: 1.0, color: '#C0392B',
    rates: { travel:5, dining:2, groceries:2, gas:2, amazon:2, drugstores:2, entertainment:2, streaming:2, transit:2, default:2 }
  },
  {
    id: 'c1-savor', name: 'Capital One Savor Cash Rewards', issuer: 'Capital One',
    cardType: 'static', rewardType: 'cashback', pointValue: 1.0, color: '#721422',
    rates: { dining:3, entertainment:3, streaming:3, groceries:3, gas:1, travel:1, amazon:1, drugstores:1, transit:1, default:1 }
  },
  // ── DISCOVER ───────────────────────────────────────
  {
    id: 'discover-it', name: 'Discover it Cash Back', issuer: 'Discover',
    cardType: 'rotating', rewardType: 'cashback', pointValue: 1.0, color: '#FF6600',
    rates: { dining:1, groceries:1, gas:1, travel:1, amazon:1, drugstores:1, entertainment:1, streaming:1, transit:1, default:1 },
    quarterInfo: {
      period: 'Q2 2026 (Apr – Jun)',
      categories: ['dining', 'paypal'],
      displayCategories: ['Restaurants', 'PayPal'],
      activationUrl: 'https://www.discover.com/credit-cards/cashback-bonus/'
    }
  },
  // ── BANK OF AMERICA ────────────────────────────────
  {
    id: 'bofa-cc', name: 'BofA Customized Cash Rewards', issuer: 'Bank of America',
    cardType: 'customizable', rewardType: 'cashback', pointValue: 1.0, color: '#E31837',
    rates: { dining:2, groceries:2, gas:1, travel:1, amazon:1, drugstores:1, entertainment:1, streaming:1, transit:1, default:1 },
    customCategoryRate: 3,
    customOptions: [
      { id:'gas',        label:'Gas & EV Charging', emoji:'⛽' },
      { id:'amazon',     label:'Online Shopping',   emoji:'📦' },
      { id:'dining',     label:'Dining',             emoji:'🍽️' },
      { id:'travel',     label:'Travel',             emoji:'✈️' },
      { id:'drugstores', label:'Drug Stores',        emoji:'💊' },
      { id:'home',       label:'Home Improvement',   emoji:'🏠' },
    ],
    userCustomCategory: null
  },
  // ── US BANK ────────────────────────────────────────
  {
    id: 'usb-cash-plus', name: 'US Bank Cash+ Visa', issuer: 'US Bank',
    cardType: 'customizable', rewardType: 'cashback', pointValue: 1.0, color: '#002F6C',
    rates: { groceries:2, dining:1, gas:1, travel:1, amazon:1, drugstores:1, entertainment:1, streaming:1, transit:1, default:1 },
    customCategoryRate: 5,
    customOptions: [
      { id:'streaming',     label:'TV/Streaming',     emoji:'📺' },
      { id:'dining',        label:'Fast Food',         emoji:'🍔' },
      { id:'home',          label:'Home Utilities',    emoji:'🏠' },
      { id:'transit',       label:'Transit',           emoji:'🚇' },
      { id:'entertainment', label:'Movie Theaters',    emoji:'🎬' },
      { id:'electronics',   label:'Electronics',       emoji:'💻' },
      { id:'gyms',          label:'Gyms & Fitness',    emoji:'🏋️' },
      { id:'drugstores',    label:'Drug Stores',       emoji:'💊' },
    ],
    userCustomCategories: []
  },
  // ── WELLS FARGO ────────────────────────────────────
  {
    id: 'wf-active-cash', name: 'Wells Fargo Active Cash', issuer: 'Wells Fargo',
    cardType: 'static', rewardType: 'cashback', pointValue: 1.0, color: '#CF2026',
    rates: { dining:2, groceries:2, gas:2, travel:2, amazon:2, drugstores:2, entertainment:2, streaming:2, transit:2, default:2 }
  },
  // ── APPLE ──────────────────────────────────────────
  {
    id: 'apple-card', name: 'Apple Card', issuer: 'Goldman Sachs',
    cardType: 'static', rewardType: 'cashback', pointValue: 1.0, color: '#1C1C1E',
    rates: { dining:2, groceries:2, gas:2, travel:2, amazon:1, drugstores:2, entertainment:2, streaming:2, transit:2, default:1 }
  }
];

// ============================================================
// 2. SPENDING CATEGORIES  (populated from data/categories.csv at boot)
// ============================================================

const CATEGORIES = [];

// Category emoji quick-lookup
function catEmoji(id) {
  return (CATEGORIES.find(c => c.id === id) || { emoji:'🛍️' }).emoji;
}

// Monthly spend assumptions for annual calculation
const AVG_MONTHLY_SPEND = {
  dining:200, groceries:400, gas:120, travel:150,
  amazon:150, drugstores:60, streaming:30,
  entertainment:80, transit:80, default:300
};

// ============================================================
// 3. MOCK FAMILY & FINANCIAL DATA
// ============================================================

const MOCK_FAMILY = {
  members: [
    { id:'sarah', name:'Sarah', initials:'SC', color:'#FF6B35', role:'You',
      creditScore:748, creditLabel:'Very Good', monthSpend:1243.50, cardIds:['csr','amex-gold','cff'] },
    { id:'mike', name:'Mike', initials:'MC', color:'#1A7DB5', role:'Partner',
      creditScore:721, creditLabel:'Good', monthSpend:881.20, cardIds:['c1-venture','cfu','discover-it'] },
  ],
  pendingApprovals: [
    { id:'pa1', from:'Mike', type:'budget', label:'Budget Overview Access', ts: Date.now()-7200000 },
  ],
};

const MOCK_CREDIT = {
  sarah: {
    score:748, label:'Very Good', change:+12, gaugeColor:'#6BCB77',
    factors:[
      { label:'Payment History',   value:99,  unit:'%',      status:'Excellent',  color:'#4AB857' },
      { label:'Credit Utilization',value:12,  unit:'%',      status:'Low — Great',color:'#4AB857' },
      { label:'Credit Age',        value:8.2, unit:' yrs',   status:'Good',       color:'#FAE96E' },
      { label:'Credit Mix',        value:5,   unit:' accts', status:'Good',       color:'#FAE96E' },
      { label:'New Inquiries',     value:1,   unit:' in 12mo',status:'Good',      color:'#4AB857' },
    ],
    history:[680,695,708,714,721,730,736,748],
    labels:['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
    loans:{ mortgage:{pct:92,label:'Very Likely',rate:'6.4%'}, auto:{pct:97,label:'Excellent',rate:'5.1%'}, personal:{pct:95,label:'Excellent',rate:'8.9%'} }
  },
  mike: {
    score:721, label:'Good', change:+5, gaugeColor:'#FAE96E',
    factors:[
      { label:'Payment History',   value:97,  unit:'%',      status:'Very Good',  color:'#4AB857' },
      { label:'Credit Utilization',value:24,  unit:'%',      status:'Fair',       color:'#FAE96E' },
      { label:'Credit Age',        value:5.5, unit:' yrs',   status:'Fair',       color:'#FAE96E' },
      { label:'Credit Mix',        value:3,   unit:' accts', status:'Limited',    color:'#FF6B35' },
      { label:'New Inquiries',     value:2,   unit:' in 12mo',status:'Fair',      color:'#FAE96E' },
    ],
    history:[658,672,681,690,698,705,716,721],
    labels:['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
    loans:{ mortgage:{pct:78,label:'Likely',rate:'6.9%'}, auto:{pct:88,label:'Very Likely',rate:'5.8%'}, personal:{pct:84,label:'Very Likely',rate:'10.2%'} }
  }
};

// populated from data/subscriptions.csv at boot
const MOCK_SUBSCRIPTIONS = [];

// populated from data/returns.csv at boot
const MOCK_RETURNS = [];

// populated from data/budget.csv at boot
const MOCK_BUDGET = { month:'April 2026', total:2420, spent:2125, categories:[] };

// populated from data/suggestions.csv at boot
const MOCK_CARD_SUGGESTIONS = [];

// populated from data/history.csv at boot
const MOCK_HISTORY = [];

// ============================================================
// 4. GEO-LOCATION + NEARBY MERCHANT SEARCH
// ============================================================

// OpenStreetMap amenity/shop type → Tappa spending category
const OSM_CATEGORY_MAP = {
  // Dining
  restaurant:'dining', cafe:'dining', fast_food:'dining', bar:'dining',
  pub:'dining', food_court:'dining', ice_cream:'dining', bakery:'dining',
  // Gas
  fuel:'gas', charging_station:'gas',
  // Groceries
  supermarket:'groceries', greengrocer:'groceries', convenience:'groceries',
  grocery:'groceries', deli:'groceries', butcher:'groceries', organic:'groceries',
  // Drugstore
  pharmacy:'drugstores', chemist:'drugstores', drugstore:'drugstores',
  // Entertainment
  cinema:'entertainment', theatre:'entertainment', nightclub:'entertainment',
  fitness_centre:'entertainment', sports_centre:'entertainment',
  // Transit
  bus_station:'transit', subway_entrance:'transit', taxi:'transit',
  // Amazon / Online / Electronics
  electronics:'amazon', computer:'amazon', mobile_phone:'amazon',
  // Default
  department_store:'default', clothes:'default', books:'default',
  bank:'default', post_office:'default',
};

const Geo = {
  // Auto-called when optimizer opens
  async detect() {
    if (App.state.locationStatus === 'detecting') return;
    if (!navigator.geolocation) {
      App.state.locationStatus = 'unsupported';
      Geo._updateLocationUI();
      return;
    }

    App.state.locationStatus = 'detecting';
    App.state.nearbyMerchants = [];
    Geo._updateLocationUI();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        App.state.userLocation = { lat, lon };
        App.state.locationStatus = 'searching';
        Geo._updateLocationUI();

        try {
          const merchants = await NearbySearch.fetch(lat, lon);
          App.state.nearbyMerchants = merchants;
          App.state.locationStatus = merchants.length > 0 ? 'found' : 'no-results';
        } catch (e) {
          App.state.locationStatus = 'no-results';
          App.state.nearbyMerchants = [];
        }
        Geo._updateLocationUI();
      },
      (err) => {
        App.state.locationStatus = err.code === 1 ? 'denied' : 'error';
        Geo._updateLocationUI();
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true }
    );
  },

  // Surgically update only the location section in the DOM (no full re-render)
  _updateLocationUI() {
    const section = document.getElementById('location-section');
    if (!section) return;
    section.innerHTML = Screens.locationSection();
    // Re-bind click handlers on the new nodes
    section.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', e => {
        const t = e.currentTarget;
        Actions.handle(t.dataset.action, t.dataset, t);
      });
    });
  }
};

const NearbySearch = {
  async fetch(lat, lon) {
    // Query Overpass API (OpenStreetMap) — free, no API key needed
    const radius = 150; // meters
    const query = `
      [out:json][timeout:12];
      (
        node["name"]["amenity"](around:${radius},${lat},${lon});
        node["name"]["shop"](around:${radius},${lat},${lon});
        way["name"]["amenity"](around:${radius},${lat},${lon});
        way["name"]["shop"](around:${radius},${lat},${lon});
      );
      out body center 10;
    `;

    const resp = await fetch(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
      }
    );

    if (!resp.ok) throw new Error('Overpass API error');
    const data = await resp.json();

    // De-dupe by name, map to our schema, sort by distance
    const seen = new Set();
    return data.elements
      .filter(el => {
        const name = el.tags?.name;
        if (!name || seen.has(name.toLowerCase())) return false;
        seen.add(name.toLowerCase());
        return true;
      })
      .map(el => {
        const elLat = el.lat ?? el.center?.lat ?? lat;
        const elLon = el.lon ?? el.center?.lon ?? lon;
        const type  = el.tags?.amenity || el.tags?.shop || 'default';
        return {
          name:     el.tags.name,
          type,
          category: OSM_CATEGORY_MAP[type] || 'default',
          dist:     Math.round(NearbySearch._dist(lat, lon, elLat, elLon)),
          cuisine:  el.tags?.cuisine || null,
        };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 8);
  },

  _dist(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
};

// ============================================================
// 4. LOCAL STORAGE
// ============================================================

const Store = {
  KEY: 'tappa_v2',
  load()        { try { const r = localStorage.getItem(this.KEY); return r ? JSON.parse(r) : null; } catch { return null; } },
  save(s)       { try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch(e) { console.warn(e); } },
  getDefault()  {
    const demoCards = [
      Object.assign({}, CARD_DB.find(c=>c.id==='amex-gold'),  { isDefault:false }),
      Object.assign({}, CARD_DB.find(c=>c.id==='csp'),        { isDefault:true  }),
      Object.assign({}, CARD_DB.find(c=>c.id==='citi-cc'),    { isDefault:false, userCustomCategory:'gas' }),
      Object.assign({}, CARD_DB.find(c=>c.id==='cff'),        { isDefault:false }),
    ].filter(Boolean);
    return { onboarded:true, cards: demoCards, history: MOCK_HISTORY,
      nudge:{ enabled:true, time:'evening', morning:'08:00', evening:'21:00' },
      sharePartners:[
        { id:'mike', name:'Mike', initials:'MC', color:'#1A7DB5', relationship:'Partner',
          sharing:{ budget:false, subscriptions:true, transactions:false } }
      ],
      pendingApprovals:[ { id:'pa1', from:'Mike', type:'budget', label:'Budget Overview Access', ts: Date.now()-7200000 } ],
      dismissedDefaultSuggest: false,
    };
  },
  getState()    { return this.load() || this.getDefault(); },
  updateState(patch) {
    const next = Object.assign({}, this.getState(), patch);
    this.save(next);
    return next;
  }
};

// ============================================================
// 5. AI RECOMMENDATION ENGINE (Mock — swap Claude API later)
// ============================================================

const Engine = {
  getRate(card, categoryId) {
    // Rotating quarterly cards (e.g. Chase Freedom Flex, Discover it)
    if (card.cardType === 'rotating' && card.quarterInfo) {
      if (card.quarterInfo.categories.includes(categoryId) && card.activated) return 5;
    }
    // BofA Customized Cash — user-set 3% category
    if (card.id === 'bofa-cc') {
      if (card.userCustomCategory === categoryId) return card.customCategoryRate || 3;
      if (categoryId === 'dining' || categoryId === 'groceries') return 2;
    }
    // US Bank Cash+ — user-set two 5% categories
    if (card.id === 'usb-cash-plus') {
      if ((card.userCustomCategories || []).includes(categoryId)) return 5;
      if (categoryId === 'groceries') return 2;
    }
    // Auto-custom (Citi Custom Cash)
    if (card.cardType === 'auto-custom') {
      return card.rates[categoryId] ?? card.rates.default ?? 1;
    }
    return card.rates[categoryId] ?? card.rates.default ?? 1;
  },

  dollarValue(rate, amount, pointValueCents) {
    return (rate * amount * pointValueCents) / 100;
  },

  recommend(userCards, categoryId, amount) {
    if (!userCards?.length) return null;

    const results = userCards.map(card => {
      const rate  = this.getRate(card, categoryId);
      const value = this.dollarValue(rate, amount, card.pointValue ?? 1);
      return { card, rate, value: +value.toFixed(2) };
    }).sort((a, b) => b.value - a.value);

    const best     = results[0];
    const default_ = results.find(r => r.card.isDefault) || results[results.length - 1];
    const dollarDiff  = +(best.value - default_.value).toFixed(2);
    const monthlySpend = AVG_MONTHLY_SPEND[categoryId] || 200;
    const annualDiff   = dollarDiff > 0
      ? +(dollarDiff * (monthlySpend / Math.max(amount, 1)) * 12).toFixed(0)
      : 0;

    return {
      best,
      bestCard:    best.card,
      bestRate:    best.rate,
      bestValue:   best.value,
      dollarDiff,
      annualDiff,
      allCards:    results,
      pointsEarned: Math.round(best.rate * amount),
      explanation: this._explain(best, default_, categoryId, amount, dollarDiff, annualDiff),
    };
  },

  _explain(best, default_, catId, amount, diff, annual) {
    const cat   = CATEGORIES.find(c => c.id === catId) || { label: catId };
    const type  = best.card.rewardType === 'cashback' ? `% cash back` : 'x points';
    const prog  = best.card.program ? ` (${best.card.program})` : '';
    const goal  = Store.getState().goal;

    let line1 = best.card.rewardType === 'cashback'
      ? `Use your **${best.card.name}** — ${best.rate}% cash back on ${cat.label.toLowerCase()}`
      : `Use your **${best.card.name}** — ${best.rate}x ${cat.label.toLowerCase()}${prog}`;

    let line2 = `That's **$${best.value.toFixed(2)}** back on this $${amount} purchase`;

    if (diff > 0) {
      line2 += `, **$${diff.toFixed(2)} more** than your default card`;
      if (annual > 5) line2 += `. At typical spending, that's ~**$${annual}/year** extra`;
      line2 += '.';
    } else {
      line2 += `. This is already your best card for ${cat.label.toLowerCase()}.`;
    }

    if (goal && best.card.program && goal.program.toLowerCase().includes(best.card.issuer.toLowerCase())) {
      const pts = Math.round(best.rate * amount);
      line2 += ` ✦ +${pts.toLocaleString()} points toward ${goal.destination}.`;
    }

    if (best.card.cardType === 'rotating' && best.card.quarterInfo) {
      const cats = best.card.quarterInfo.displayCategories?.join(' & ');
      line2 += ` ✦ Q2 5% bonus on ${cats} — confirm it's activated!`;
    }

    if (best.card.cardType === 'auto-custom') {
      line2 += ` ✦ Your Citi Custom Cash may already be earning 5% here if ${cat.label.toLowerCase()} is your top category this month.`;
    }

    return `${line1}. ${line2}`;
  }
};

// ============================================================
// 6. ROUTER & APP STATE
// ============================================================

const App = {
  state: {
    screen: 'welcome',
    onboardingStep: 1,
    selectedCards: [],
    optimizerResult: null,
    selectedCategory: null,
    purchaseAmount: 50,
    merchantInput: '',
    selectedMerchant: null,
    // Geo state
    locationStatus: null,
    nearbyMerchants: [],
    userLocation: null,
    // New feature state
    creditMember: 'sarah',
    prevScreen: 'home',
    sharePanel: false,
    addingPartner: false,   // show add-partner form in profile
  },

  navigate(screen, opts = {}) {
    // Reset geo state when navigating away from optimizer
    if (screen !== 'optimizer') {
      this.state.locationStatus = null;
      this.state.nearbyMerchants = [];
      this.state.selectedMerchant = null;
    }
    Object.assign(this.state, opts);
    this.state.screen = screen;
    this.render();
    window.scrollTo(0, 0);

    // Auto-detect location when optimizer opens
    if (screen === 'optimizer') {
      setTimeout(() => Geo.detect(), 200);
    }
  },

  render() {
    const root = document.getElementById('app');
    const data  = Store.getState();

    const map = {
      welcome:      () => Screens.welcome(),
      onboarding:   () => Screens.onboarding(),
      home:         () => Screens.home(data),
      optimizer:    () => Screens.optimizer(data),
      result:       () => Screens.result(data),
      family:       () => Screens.family(data),
      'credit-score': () => Screens.creditScore(data),
      budget:       () => Screens.budget(data),
      subscriptions:() => Screens.subscriptions(data),
      returns:      () => Screens.returns(data),
      'card-suggest': () => Screens.cardSuggest(data),
      profile:      () => Screens.profile(data),
      widget:       () => Screens.widgetSetup(data),
    };

    root.innerHTML = (map[this.state.screen] || map.welcome)();
    this._bindEvents();
  },

  _bindEvents() {
    // NOTE: click delegation is bound once at boot (see bottom of file)
    // Live inputs
    const merchantEl = document.getElementById('merchant-input');
    if (merchantEl) {
      merchantEl.addEventListener('input', e => {
        this.state.merchantInput = e.target.value;
      });
    }
    const amtEl = document.getElementById('amount-input');
    if (amtEl) {
      amtEl.addEventListener('input', e => {
        this.state.purchaseAmount = parseFloat(e.target.value) || 50;
      });
    }
  }
};

// ============================================================
// 7. ACTIONS
// ============================================================

const Actions = {
  handle(action, data, el) {
    const map = {
      'go-start':           () => App.navigate('onboarding', { onboardingStep:1, selectedCards:[] }),
      'go-home':            () => App.navigate('home'),
      'go-optimizer':       () => App.navigate('optimizer'),
      'go-result':          () => this._doRecommend(),
      'nav-home':           () => App.navigate('home'),
      'nav-optimizer':      () => App.navigate('optimizer'),
      'tap-to-card':        () => this._tapToCard(),
      'toggle-card':        () => this._toggleCard(data.id),
      'next-onboarding':    () => this._nextOnboarding(),
      'prev-onboarding':    () => this._prevOnboarding(),
      'select-cat':         () => this._selectCategory(data.cat, el),
      'select-bofa-cat':    () => this._selectBofaCat(data.cat, data.cardid, el),
      'toggle-usb-cat':     () => this._toggleUSBCat(data.cat, data.cardid),
      'toggle-activated':   () => this._toggleActivated(data.cardid, el),
      'finish-onboarding':  () => this._finishOnboarding(),
      'set-default':        () => this._setDefault(data.id),
      'remove-card':        () => this._removeCard(data.id),
      'clear-result':       () => App.navigate('optimizer'),
      // Geo + merchant
      'retry-location':       () => { App.state.locationStatus = null; Geo.detect(); },
      'select-merchant':      () => this._selectMerchant(data.name, data.cat, data.amount),
      // New nav
      'nav-family':           () => App.navigate('family'),
      'nav-budget':           () => App.navigate('budget'),
      'nav-profile':          () => App.navigate('profile'),
      // Sub-screens
      'go-credit-score':      () => { App.state.creditMember = data.member || 'sarah'; App.state.prevScreen = data.from || 'family'; App.navigate('credit-score'); },
      'go-subscriptions':     () => { App.state.prevScreen = data.from || 'family'; App.navigate('subscriptions'); },
      'go-returns':           () => { App.state.prevScreen = data.from || 'family'; App.navigate('returns'); },
      'go-card-suggest':      () => { App.state.prevScreen = data.from || 'budget'; App.navigate('card-suggest'); },
      'go-back':              () => App.navigate(App.state.prevScreen || 'home'),
      // Share / approvals
      'approve-share':        () => this._approveShare(data.id),
      'deny-share':           () => this._denyShare(data.id),
      'toggle-partner-share': () => this._togglePartnerShare(data.partner, data.type),
      'show-add-partner':     () => { App.state.addingPartner = true; App.render(); },
      'cancel-add-partner':   () => { App.state.addingPartner = false; App.render(); },
      'save-partner':         () => this._savePartner(),
      'remove-partner':       () => this._removePartner(data.id),
      'dismiss-default-suggest': () => { Store.updateState({dismissedDefaultSuggest:true}); App.render(); },
      'accept-suggested-default': () => { Actions.handle('set-default', {id: data.id}, null); Store.updateState({dismissedDefaultSuggest:true}); },
      'go-widget':            () => App.navigate('widget'),
      // Nudge settings
      'set-nudge-time':       () => this._setNudgeTime(data.time),
      'toggle-nudge':         () => this._toggleNudge(),
      'save-nudge':           () => this._saveNudge(),
    };
    const fn = map[action];
    if (fn) fn();
  },

  _toggleCard(id) {
    const db  = CARD_DB.find(c => c.id === id);
    if (!db) return;
    const idx = App.state.selectedCards.findIndex(c => c.id === id);
    if (idx >= 0) App.state.selectedCards.splice(idx, 1);
    else App.state.selectedCards.push(JSON.parse(JSON.stringify(db)));
    App.render();
  },

  _nextOnboarding() {
    const { onboardingStep, selectedCards } = App.state;
    if (onboardingStep === 1) {
      if (!selectedCards.length) { showToast('Add at least one card to continue'); return; }
      const hasDyn = selectedCards.some(c => ['rotating','customizable','auto-custom'].includes(c.cardType));
      if (hasDyn) App.navigate('onboarding', { onboardingStep: 2 });
      else this._finishOnboarding();
    } else if (onboardingStep === 2) {
      this._finishOnboarding();
    }
  },

  _prevOnboarding() {
    const s = App.state.onboardingStep;
    if (s > 1) App.navigate('onboarding', { onboardingStep: s - 1 });
  },

  _selectCategory(cat, el) {
    App.state.selectedCategory = cat;
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
  },

  _selectMerchant(name, cat, amount) {
    // Called when user taps a nearby merchant card
    App.state.selectedMerchant = { name, cat };
    App.state.selectedCategory = cat;
    App.state.merchantInput    = name;
    if (amount) App.state.purchaseAmount = parseFloat(amount) || 50;
    this._doRecommend();
  },

  _selectBofaCat(cat, cardId, el) {
    const card = App.state.selectedCards.find(c => c.id === cardId);
    if (card) {
      card.userCustomCategory = cat;
      el.closest('.bofa-cats').querySelectorAll('.bofa-opt').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
    }
  },

  _toggleUSBCat(cat, cardId) {
    const card = App.state.selectedCards.find(c => c.id === cardId);
    if (!card) return;
    if (!card.userCustomCategories) card.userCustomCategories = [];
    const idx = card.userCustomCategories.indexOf(cat);
    if (idx >= 0) card.userCustomCategories.splice(idx, 1);
    else {
      if (card.userCustomCategories.length >= 2) { showToast('Pick exactly 2 categories'); return; }
      card.userCustomCategories.push(cat);
    }
    App.render();
  },

  _toggleActivated(cardId, el) {
    const card = App.state.selectedCards.find(c => c.id === cardId);
    if (card) {
      card.activated = !card.activated;
      const cb = el.querySelector('.t-checkbox');
      if (cb) {
        cb.classList.toggle('checked', card.activated);
        cb.innerHTML = card.activated ? svgCheck() : '';
      }
    }
  },

  _finishOnboarding() {
    const cards = App.state.selectedCards;
    if (cards.length) cards[0].isDefault = true;
    const existing = Store.getState();
    Store.updateState({ onboarded:true, cards, history: existing.history || MOCK_HISTORY });
    App.navigate('home');
    showToast('🎉 Tappa is ready!');
  },


  _tapToCard() {
    const data = Store.getState();
    if (!data.cards?.length) { showToast('Add cards first'); return; }
    // Auto-detect best category from history, or use 'dining' as fallback
    const history = data.history || [];
    const catCount = {};
    history.forEach(h => { catCount[h.category] = (catCount[h.category]||0) + 1; });
    const topCat = Object.entries(catCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'dining';
    App.state.selectedCategory = topCat;
    App.state.purchaseAmount = App.state.purchaseAmount || 50;
    this._doRecommend();
  },

  _doRecommend() {
    let cat = App.state.selectedCategory;
    if (!cat) { showToast('Pick a category or tap a nearby merchant'); return; }
    const data = Store.getState();
    if (!data.cards?.length) { showToast('Add cards first'); App.navigate('home'); return; }

    const result = Engine.recommend(data.cards, cat, App.state.purchaseAmount || 50);
    App.state.optimizerResult = result;

    // Persist to history
    const history = data.history || [];
    history.unshift({
      ts: Date.now(),
      category: cat,
      merchant: App.state.merchantInput || App.state.selectedMerchant?.name || null,
      amount: App.state.purchaseAmount,
      cardId: result.bestCard.id,
      dollarSaved: result.dollarDiff
    });
    Store.updateState({ history: history.slice(0, 30) });
    App.navigate('result');
  },

  _setDefault(id) {
    const data = Store.getState();
    data.cards.forEach(c => c.isDefault = (c.id === id));
    Store.updateState({ cards: data.cards });
    App.render();
    showToast('Default card updated');
  },

  _removeCard(id) {
    const data = Store.getState();
    data.cards = data.cards.filter(c => c.id !== id);
    Store.updateState({ cards: data.cards });
    App.render();
    showToast('Card removed');
  },

  _approveShare(id) {
    const s = Store.getState();
    const approvals = (s.pendingApprovals || []).filter(a => a.id !== id);
    Store.updateState({ pendingApprovals: approvals });
    App.render();
    showToast('✅ Access approved');
  },

  _denyShare(id) {
    const s = Store.getState();
    const approvals = (s.pendingApprovals || []).filter(a => a.id !== id);
    Store.updateState({ pendingApprovals: approvals });
    App.render();
    showToast('Denied');
  },

  _togglePartnerShare(partnerId, type) {
    const s = Store.getState();
    const partners = s.sharePartners || [];
    const p = partners.find(x => x.id === partnerId);
    if (!p) return;
    p.sharing[type] = !p.sharing[type];
    Store.updateState({ sharePartners: partners });
    showToast(p.sharing[type] ? `📤 Request sent to ${p.name}` : 'Sharing disabled');
    App.render();
  },

  _savePartner() {
    const nameEl = document.getElementById('new-partner-name');
    const relEl  = document.getElementById('new-partner-rel');
    const name = nameEl?.value?.trim();
    if (!name) { showToast('Enter a name'); return; }
    const rel  = relEl?.value || 'Partner';
    const colors = ['#1A7DB5','#4AB857','#A07A00','#C0392B','#8E44AD','#16A085'];
    const s = Store.getState();
    const partners = s.sharePartners || [];
    const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const color = colors[partners.length % colors.length];
    const id = name.toLowerCase().replace(/\s+/g,'-') + '-' + Date.now();
    partners.push({ id, name, initials, color, relationship: rel, sharing:{ budget:false, subscriptions:false, transactions:false } });
    Store.updateState({ sharePartners: partners });
    App.state.addingPartner = false;
    App.render();
    showToast(`✅ ${name} added`);
  },

  _removePartner(id) {
    const s = Store.getState();
    const partners = (s.sharePartners||[]).filter(p => p.id !== id);
    Store.updateState({ sharePartners: partners });
    App.render();
    showToast('Person removed');
  },

  _setNudgeTime(time) {
    const s = Store.getState();
    const nudge = s.nudge || {};
    nudge.time = time;
    Store.updateState({ nudge });
    App.render();
  },

  _toggleNudge() {
    const s = Store.getState();
    const nudge = s.nudge || {};
    nudge.enabled = !nudge.enabled;
    Store.updateState({ nudge });
    App.render();
  },

  _saveNudge() {
    const morningEl = document.getElementById('nudge-morning-time');
    const eveningEl = document.getElementById('nudge-evening-time');
    const s = Store.getState();
    const nudge = s.nudge || {};
    if (morningEl) nudge.morning = morningEl.value;
    if (eveningEl) nudge.evening = eveningEl.value;
    Store.updateState({ nudge });
    showToast('✅ Nudge settings saved');
  }
};

// ============================================================
// 8. SVG ICONS
// ============================================================

const svgHome    = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const svgStar    = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const svgTarget  = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
const svgCheck   = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="20 6 9 17 4 12"/></svg>`;
const svgBack    = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><polyline points="15 18 9 12 15 6"/></svg>`;
const svgCard    = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;
const svgPin     = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const svgLoader  = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;animation:spin 1s linear infinite"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`;
const svgUsers   = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const svgChart   = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
const svgUser    = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const svgShare   = () => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;

// Credit score gauge SVG helper
function scoreGauge(score, color) {
  const norm = Math.max(0, Math.min(1, (score - 300) / 550));
  const fill = (norm * 251.3).toFixed(1);
  const scoreColor = score >= 800 ? '#4AB857' : score >= 740 ? '#6BCB77' : score >= 670 ? '#FAE96E' : score >= 580 ? '#FF6B35' : '#C0392B';
  return `<svg viewBox="0 0 200 115" width="200" height="115" style="display:block;margin:0 auto">
    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E8EDF4" stroke-width="18" stroke-linecap="round"/>
    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="${scoreColor}" stroke-width="18" stroke-linecap="round"
      stroke-dasharray="${fill} 251.3"/>
    <text x="100" y="90" text-anchor="middle" font-family="Inter,sans-serif" font-size="38" font-weight="900" fill="#1A1A2E">${score}</text>
    <text x="100" y="110" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="#8A9BB0">${score >= 800 ? 'Exceptional' : score >= 740 ? 'Very Good' : score >= 670 ? 'Good' : score >= 580 ? 'Fair' : 'Poor'}</text>
  </svg>`;
}

// Auto-suggest best default card based on history
function suggestBestDefault(cards, history) {
  if (!cards || cards.length < 2 || !history || history.length < 3) return null;
  const catCount = {};
  history.forEach(h => { catCount[h.category] = (catCount[h.category]||0) + 1; });
  const topCat = Object.entries(catCount).sort((a,b)=>b[1]-a[1])[0]?.[0];
  if (!topCat) return null;
  const results = cards.map(c => ({ card:c, rate:Engine.getRate(c, topCat) })).sort((a,b)=>b.rate-a.rate);
  const best = results[0];
  const current = results.find(r=>r.card.isDefault);
  if (!best || !current || best.card.id === current.card.id) return null;
  if (best.rate <= (current.rate||0)) return null;
  const cat = CATEGORIES.find(c=>c.id===topCat) || { label:topCat, emoji:'🛍️' };
  return { card:best.card, category:topCat, catLabel:cat.label, catEmoji:cat.emoji, rate:best.rate, currentCard:current.card };
}

// Mini sparkline helper
function sparkline(values, w=140, h=44, color='#4AB857') {
  const mn = Math.min(...values), mx = Math.max(...values), range = mx - mn || 1;
  const pts = values.map((v,i) => {
    const x = (i/(values.length-1))*w;
    const y = h - ((v-mn)/range)*(h-6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${((values.length-1)/(values.length-1))*w}" cy="${(h - ((values[values.length-1]-mn)/range)*(h-6) - 3).toFixed(1)}" r="4" fill="${color}"/>
  </svg>`;
}

// ============================================================
// 9. SCREENS
// ============================================================

const Screens = {

  // ── WELCOME ──────────────────────────────────────────────
  welcome() {
    return `
    <div class="welcome-bg screen">
      <div style="padding-top:52px;position:relative;z-index:1">
        <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.7;margin-bottom:28px">✦ AI Card Co-Pilot</div>
        <div style="font-size:58px;font-weight:900;line-height:1;letter-spacing:-0.03em;margin-bottom:10px">Tappa</div>
        <div style="font-size:23px;font-weight:700;line-height:1.25;opacity:0.93;margin-bottom:14px">Tap smarter.<br>Keep more.</div>
        <div style="font-size:15px;font-weight:400;opacity:0.78;line-height:1.55;max-width:290px">
          Knows which card earns the most the moment you walk in, everywhere you spend.
        </div>
      </div>

      <div style="position:relative;z-index:1">
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:36px">
          ${['📍 Auto-detects nearby merchants', '🤖 Instant best card recommendation', '💰 Tracks points & savings per card'].map(t => `
            <div style="background:rgba(255,255,255,0.18);border-radius:12px;padding:12px 16px;font-size:14px;font-weight:500;backdrop-filter:blur(8px)">${t}</div>
          `).join('')}
        </div>
        <button class="btn btn-primary light select-none" data-action="go-start" style="font-size:17px;padding:18px">
          Get Started — It's Free
        </button>
        <p style="text-align:center;font-size:13px;opacity:0.6;margin-top:14px">No bank logins. No card numbers. Ever.</p>
      </div>
    </div>`;
  },

  // ── LOCATION SECTION (dynamically updated) ──────────────
  locationSection() {
    const { locationStatus: s, nearbyMerchants: merchants, purchaseAmount: amt } = App.state;

    if (!s || s === null) {
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:12px 14px;background:#EBF6FF;border-radius:12px;cursor:pointer;border:1.5px solid #C8E8F8"
          data-action="retry-location">
          ${svgPin().replace('style="width:16px;height:16px"','style="width:16px;height:16px;color:#1A7DB5"')}
          <span style="font-size:14px;font-weight:600;color:#1A7DB5">Tap to detect your location</span>
        </div>`;
    }

    if (s === 'detecting' || s === 'searching') {
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:12px 14px;background:#EBF6FF;border-radius:12px;border:1.5px solid #C8E8F8">
          <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
          ${svgLoader()}
          <span style="font-size:14px;font-weight:600;color:#1A7DB5">
            ${s === 'detecting' ? 'Getting your location…' : 'Finding nearby merchants…'}
          </span>
        </div>`;
    }

    if (s === 'denied' || s === 'unsupported') {
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:12px 14px;background:#FEF0EA;border-radius:12px;border:1.5px solid #FFD0BC">
          <span style="font-size:16px">📍</span>
          <span style="font-size:13px;color:var(--orange);font-weight:500">Location access denied — pick a category below</span>
        </div>`;
    }

    if (s === 'no-results') {
      return `
        <div style="display:flex;align-items:center;gap:8px;padding:12px 14px;background:#F7F8FA;border-radius:12px;border:1.5px solid var(--border)">
          <span style="font-size:16px">📍</span>
          <span style="font-size:13px;color:var(--text-2);font-weight:500">No merchants found nearby — pick a category below</span>
          <button data-action="retry-location" style="margin-left:auto;font-size:12px;color:var(--orange);font-weight:600;background:none;border:none;cursor:pointer;font-family:'Inter',sans-serif">Retry</button>
        </div>`;
    }

    if (s === 'found' && merchants.length > 0) {
      return `
        <div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
            ${svgPin().replace('style="width:16px;height:16px"','style="width:14px;height:14px;color:#27AE60"')}
            <span style="font-size:12px;font-weight:700;color:#27AE60;text-transform:uppercase;letter-spacing:0.06em">Nearby merchants</span>
            <button data-action="retry-location" style="margin-left:auto;font-size:12px;color:var(--text-2);background:none;border:none;cursor:pointer;font-family:'Inter',sans-serif">Refresh</button>
          </div>
          <div class="scroll-x" style="margin:0 -20px;padding:0 20px 4px">
            <div style="display:flex;gap:10px;width:max-content">
              ${merchants.map(m => {
                const data = Store.getState();
                let bestCard = null;
                if (data.cards?.length) {
                  const r = Engine.recommend(data.cards, m.category, amt || 50);
                  bestCard = r?.bestCard;
                }
                return `
                  <button class="select-none" data-action="select-merchant"
                    data-name="${m.name.replace(/"/g,'&quot;')}" data-cat="${m.category}" data-amount="${amt || 50}"
                    style="display:flex;flex-direction:column;align-items:flex-start;gap:6px;background:white;border:2px solid var(--border);border-radius:14px;padding:14px 14px 10px;min-width:140px;max-width:170px;cursor:pointer;text-align:left;font-family:'Inter',sans-serif;transition:border-color 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
                    <div style="font-size:22px">${catEmoji(m.category)}</div>
                    <div style="font-size:13px;font-weight:700;color:var(--text);line-height:1.3;word-break:break-word">${m.name}</div>
                    ${m.dist ? `<div style="font-size:11px;color:var(--text-2)">${m.dist}m away</div>` : ''}
                    ${bestCard ? `
                      <div style="margin-top:4px;padding-top:8px;border-top:1px solid var(--border);width:100%">
                        <div style="font-size:10px;color:var(--text-2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Best card</div>
                        <div style="display:flex;align-items:center;gap:6px">
                          <div style="width:10px;height:10px;border-radius:3px;background:${bestCard.color};flex-shrink:0"></div>
                          <div style="font-size:12px;font-weight:700;color:var(--orange);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${bestCard.name.split(' ').slice(0,3).join(' ')}</div>
                        </div>
                      </div>
                    ` : ''}
                  </button>`;
              }).join('')}
            </div>
          </div>
        </div>`;
    }

    return '';
  },

  // ── ONBOARDING ───────────────────────────────────────────
  onboarding() {
    const step = App.state.onboardingStep;
    const hasDynamic = App.state.selectedCards.some(c => ['rotating','customizable','auto-custom'].includes(c.cardType));
    const dots = hasDynamic ? 2 : 1;

    return `
    <div class="screen" style="background:var(--bg)">
      <div style="padding:calc(env(safe-area-inset-top,0px) + 16px) 24px 0;display:flex;align-items:center;justify-content:space-between;min-height:60px">
        <button class="btn-icon" data-action="prev-onboarding" style="${step === 1 ? 'opacity:0;pointer-events:none' : ''}">${svgBack()}</button>
        <div class="step-dots">
          ${Array.from({length:dots},(_,i) => `<div class="step-dot ${step===i+1?'active':''}"></div>`).join('')}
        </div>
        <div style="width:40px"></div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:20px 24px 40px">
        ${step === 1 ? this._ob1() : this._ob2()}
      </div>
    </div>`;
  },

  _ob1() {
    const sel = App.state.selectedCards.map(c => c.id);
    const grouped = CARD_DB.reduce((acc, c) => {
      (acc[c.issuer] = acc[c.issuer] || []).push(c); return acc;
    }, {});
    return `
    <div>
      <div style="margin-bottom:24px">
        <div style="font-size:26px;font-weight:800;letter-spacing:-0.02em;color:var(--text);margin-bottom:8px">Which cards do you have?</div>
        <div style="color:var(--text-2);font-size:15px">Select all that apply. You can add more later.</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:32px">
        ${Object.entries(grouped).map(([issuer, cards]) => `
          <div style="margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-2);margin-bottom:6px;margin-left:4px">${issuer}</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${cards.map(card => {
                const on = sel.includes(card.id);
                return `
                <button class="card-select-item ${on?'selected':''} select-none" data-action="toggle-card" data-id="${card.id}">
                  <div style="width:36px;height:36px;border-radius:10px;background:${card.color};flex-shrink:0;display:flex;align-items:center;justify-content:center">
                    ${svgCard().replace('<svg',`<svg style="width:16px;height:16px;color:white"`)}
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${card.name}</div>
                    <div style="font-size:12px;color:var(--text-2)">${card.rewardType === 'points' ? card.program || '' : card.rewardType}</div>
                  </div>
                  ${card.cardType !== 'static' ? `<span class="tag ${card.cardType==='rotating'?'tag-blue':card.cardType==='customizable'?'tag-yellow':'tag-green'}" style="font-size:10px">${card.cardType==='rotating'?'Rotating':card.cardType==='customizable'?'Custom':'Smart'}</span>` : ''}
                  <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${on?'var(--orange)':'var(--border)'};background:${on?'var(--orange)':'white'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    ${on ? svgCheck().replace('style="width:14px;height:14px"','style="width:11px;height:11px;color:white"') : ''}
                  </div>
                </button>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary select-none" data-action="next-onboarding">
        Continue ${App.state.selectedCards.length > 0 ? `(${App.state.selectedCards.length} card${App.state.selectedCards.length>1?'s':''})` : ''}
      </button>
    </div>`;
  },

  _ob2() {
    const dynCards = App.state.selectedCards.filter(c => ['rotating','customizable','auto-custom'].includes(c.cardType));
    return `
    <div>
      <div style="margin-bottom:24px">
        <div style="font-size:26px;font-weight:800;letter-spacing:-0.02em;color:var(--text);margin-bottom:8px">Set up your dynamic cards</div>
        <div style="color:var(--text-2);font-size:15px">This is what makes Tappa smarter than anything else.</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:20px;margin-bottom:32px">
        ${dynCards.map(card => `
          <div class="tcard" style="padding:20px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
              <div style="width:40px;height:40px;border-radius:10px;background:${card.color};display:flex;align-items:center;justify-content:center">
                ${svgCard().replace('<svg',`<svg style="width:16px;height:16px;color:white"`)}
              </div>
              <div>
                <div style="font-size:15px;font-weight:700;color:var(--text)">${card.name}</div>
                <span class="tag ${card.cardType==='rotating'?'tag-blue':card.cardType==='customizable'?'tag-yellow':'tag-green'}">
                  ${card.cardType==='rotating'?'🔄 Rotating':card.cardType==='customizable'?'✏️ Customizable':'🤖 Auto-Smart'}
                </span>
              </div>
            </div>
            ${this._dynSetup(card)}
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary select-none" data-action="next-onboarding">Continue</button>
    </div>`;
  },

  _dynSetup(card) {
    if (card.cardType === 'rotating') {
      const q = card.quarterInfo;
      return `
        <div style="background:#EBF6FF;border-radius:12px;padding:14px;margin-bottom:12px">
          <div style="font-size:13px;font-weight:700;color:#1A7DB5;margin-bottom:4px">📅 ${q.period}</div>
          <div style="font-size:14px;color:var(--text)">5% categories: <strong>${q.displayCategories.join(' & ')}</strong></div>
        </div>
        <div style="font-size:14px;color:var(--text-2);margin-bottom:10px">Have you activated your quarterly bonus?</div>
        <button class="card-select-item ${card.activated?'selected':''} select-none" data-action="toggle-activated" data-cardid="${card.id}" style="margin-bottom:8px">
          <div class="t-checkbox ${card.activated?'checked':''}">${card.activated?svgCheck():''}</div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--text)">Yes, I've activated it</div>
            <div style="font-size:12px;color:var(--text-2)">Earn 5% on ${q.displayCategories.join(' & ')}</div>
          </div>
        </button>
        <a href="${q.activationUrl}" target="_blank" rel="noopener" style="font-size:13px;color:var(--orange);font-weight:600;text-decoration:none;display:block;text-align:center;padding:8px">Activate now →</a>`;
    }

    if (card.id === 'bofa-cc') {
      return `
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:10px">What's your 3% category set to this month?</div>
        <div class="bofa-cats" style="display:flex;flex-direction:column;gap:6px">
          ${card.customOptions.map(opt => `
            <button class="card-select-item bofa-opt ${card.userCustomCategory===opt.id?'selected':''} select-none"
              data-action="select-bofa-cat" data-cat="${opt.id}" data-cardid="${card.id}">
              <span style="font-size:22px">${opt.emoji}</span>
              <span style="font-size:14px;font-weight:600;color:var(--text)">${opt.label}</span>
              ${card.userCustomCategory===opt.id ? `<span style="margin-left:auto;color:var(--orange)">${svgCheck().replace('style="width:14px;height:14px"','style="width:16px;height:16px"')}</span>` : ''}
            </button>
          `).join('')}
        </div>`;
    }

    if (card.id === 'usb-cash-plus') {
      const sel = card.userCustomCategories || [];
      return `
        <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">Pick your 2 categories that earn 5%</div>
        <div style="font-size:12px;color:var(--text-2);margin-bottom:10px">${sel.length}/2 selected</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${card.customOptions.map(opt => `
            <button class="card-select-item ${sel.includes(opt.id)?'selected':''} select-none"
              data-action="toggle-usb-cat" data-cat="${opt.id}" data-cardid="${card.id}"
              style="flex-direction:column;align-items:flex-start;gap:4px;padding:12px">
              <span style="font-size:20px">${opt.emoji}</span>
              <span style="font-size:12px;font-weight:600;color:var(--text)">${opt.label}</span>
            </button>
          `).join('')}
        </div>`;
    }

    // auto-custom
    return `
      <div style="background:#E3F6E5;border-radius:12px;padding:14px">
        <div style="font-size:13px;font-weight:700;color:#267835;margin-bottom:4px">🤖 Smart Auto-Rewards</div>
        <div style="font-size:14px;color:var(--text)">${card.autoNote || 'Automatically earns 5% on your top spend category each billing cycle.'}</div>
      </div>`;
  },

  // ── HOME ─────────────────────────────────────────────────
  home(data) {
    const { cards=[], history=[] } = data;
    const defaultSuggest = !data.dismissedDefaultSuggest ? suggestBestDefault(cards, history) : null;

    // Points/cashback earned per card from history
    const cardEarnings = {};
    cards.forEach(c => { cardEarnings[c.id] = { points: 0, cash: 0, count: 0 }; });
    history.forEach(h => {
      if (!cardEarnings[h.cardId]) return;
      const card = cards.find(c => c.id === h.cardId);
      if (!card) return;
      const rate = Engine.getRate(card, h.category);
      const amt = h.amount || 50;
      if (card.rewardType === 'cashback') {
        cardEarnings[h.cardId].cash += (amt * rate / 100);
      } else {
        cardEarnings[h.cardId].points += Math.round(amt * rate);
      }
      cardEarnings[h.cardId].count++;
    });
    const totalCash = Object.values(cardEarnings).reduce((s,e)=>s+e.cash,0);
    const totalPts  = Object.values(cardEarnings).reduce((s,e)=>s+e.points,0);

    return `
    <div class="screen">
      <div class="tappa-header" style="position:relative;z-index:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div>
            <div style="font-size:28px;font-weight:900;color:white;letter-spacing:-0.02em">Tappa</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);font-weight:500">Tap smarter. Keep more.</div>
          </div>
          ${(totalCash > 0 || totalPts > 0) ? `
          <div style="background:rgba(255,255,255,0.15);border-radius:14px;padding:10px 14px;backdrop-filter:blur(8px);text-align:right">
            <div style="font-size:10px;color:rgba(255,255,255,0.65);font-weight:700;text-transform:uppercase;letter-spacing:0.06em">This Month</div>
            ${totalCash > 0 ? `<div style="font-size:20px;font-weight:900;color:white">$${totalCash.toFixed(2)}</div>` : ''}
            ${totalPts > 0 ? `<div style="font-size:${totalCash>0?'12':'20'}px;font-weight:${totalCash>0?'600':'900'};color:${totalCash>0?'rgba(255,255,255,0.7)':'white'}">${totalPts.toLocaleString()} pts</div>` : ''}
          </div>` : ''}
        </div>
        ${cards.length > 0 ? `
        <div class="scroll-x" style="margin:0 -24px;padding:0 24px">
          <div style="display:flex;gap:12px;width:max-content;padding-bottom:2px">
            ${cards.map(c => `
              <div class="credit-card-visual" style="background:${c.color};width:160px;cursor:pointer" data-action="set-default" data-id="${c.id}">
                <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:0.06em">${c.issuer}</div>
                <div>
                  <div style="font-size:13px;font-weight:700;color:white;line-height:1.2">${c.name.replace(c.issuer+' ','')}</div>
                  ${c.isDefault ? '<div style="font-size:10px;color:rgba(255,255,255,0.55);margin-top:2px">⭐ Default</div>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      </div>

      <div class="content-scroll" style="padding:20px">

        <!-- Tap to Card CTA -->
        <button class="btn btn-primary select-none" data-action="tap-to-card"
          style="margin-bottom:16px;font-size:17px;padding:18px;letter-spacing:-0.01em;box-shadow:0 6px 24px rgba(255,107,53,0.32)">
          ✦ Tap to Card
        </button>

        <!-- Auto-suggest default card banner -->
        ${defaultSuggest ? `
        <div style="background:linear-gradient(135deg,var(--blue-bg),#EDF4FF);border:1.5px solid #C5DCFF;border-radius:var(--radius-sm);padding:14px 16px;margin-bottom:16px">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <span style="font-size:20px;flex-shrink:0">✦</span>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px">Better default for your habits</div>
              <div style="font-size:13px;color:var(--blue-text);line-height:1.5">You spend most on <strong>${defaultSuggest.catEmoji} ${defaultSuggest.catLabel}</strong>. <strong>${defaultSuggest.card.name}</strong> earns ${defaultSuggest.rate}× there.</div>
            </div>
            <button data-action="dismiss-default-suggest" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:20px;padding:0;line-height:1;flex-shrink:0">×</button>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button data-action="accept-suggested-default" data-id="${defaultSuggest.card.id}"
              style="flex:1;background:var(--blue);color:white;border:none;border-radius:var(--radius-xs);padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif">
              Set as Default
            </button>
            <button data-action="dismiss-default-suggest"
              style="flex:1;background:var(--surface);color:var(--blue-text);border:1.5px solid #C5DCFF;border-radius:var(--radius-xs);padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif">
              Keep Current
            </button>
          </div>
        </div>` : ''}

        <!-- Points earned this month per card -->
        ${cards.length > 0 && history.length > 0 ? `
        <div style="margin-bottom:20px">
          <div style="font-size:13px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">Points Earned This Month</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${cards.filter(c => cardEarnings[c.id] && cardEarnings[c.id].count > 0).map(c => {
              const e = cardEarnings[c.id];
              const isCash = c.rewardType === 'cashback';
              const earnStr = isCash ? `$${e.cash.toFixed(2)} back` : `${e.points.toLocaleString()} pts`;
              const barMax = isCash
                ? Math.max(...cards.map(x => cardEarnings[x.id]?.cash||0), 0.01)
                : Math.max(...cards.map(x => cardEarnings[x.id]?.points||0), 1);
              const barVal = isCash ? e.cash : e.points;
              const barPct = Math.round((barVal / barMax) * 100);
              return `
              <div class="tcard" style="padding:14px 16px">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                  <div style="width:36px;height:36px;border-radius:10px;background:${c.color};flex-shrink:0;display:flex;align-items:center;justify-content:center">
                    ${svgCard().replace('<svg',`<svg style="width:14px;height:14px;color:white"`)}
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.2">${c.name}</div>
                    <div style="font-size:11px;color:var(--text-2);margin-top:1px">${e.count} transaction${e.count!==1?'s':''}</div>
                  </div>
                  <div style="font-size:15px;font-weight:800;color:${isCash?'var(--green-text)':'var(--orange)'}">
                    ${earnStr}
                  </div>
                </div>
                <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
                  <div style="height:100%;width:${barPct}%;background:${isCash?'var(--green)':'var(--orange)'};border-radius:2px;transition:width 0.4s ease"></div>
                </div>
              </div>`;
            }).join('')}
            ${cards.filter(c => !cardEarnings[c.id] || cardEarnings[c.id].count === 0).map(c => `
              <div class="tcard" style="padding:12px 16px;display:flex;align-items:center;gap:12px;opacity:0.55">
                <div style="width:36px;height:36px;border-radius:10px;background:${c.color};flex-shrink:0;display:flex;align-items:center;justify-content:center">
                  ${svgCard().replace('<svg',`<svg style="width:14px;height:14px;color:white"`)}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;color:var(--text)">${c.name}</div>
                  <div style="font-size:11px;color:var(--text-2)">No activity yet</div>
                </div>
                <div style="font-size:13px;color:var(--text-3)">—</div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- My Cards (no history yet) -->
        ${cards.length > 0 && history.length === 0 ? `
        <div style="margin-bottom:20px">
          <div style="font-size:13px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">My Cards</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${cards.map(c => `
              <div class="tcard" style="padding:14px 16px;display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;border-radius:11px;background:${c.color};flex-shrink:0;display:flex;align-items:center;justify-content:center">
                  ${svgCard().replace('<svg',`<svg style="width:16px;height:16px;color:white"`)}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;font-weight:600;color:var(--text);line-height:1.3">${c.name}</div>
                  <div style="font-size:12px;color:var(--text-2);margin-top:2px">${c.isDefault?'⭐ Default · ':''}${c.rewardType==='points'?(c.program||'Points'):c.rewardType==='cashback'?'Cash Back':'Miles'}${c.cardType!=='static'?' · '+(c.cardType==='rotating'?'🔄 Rotating':c.cardType==='customizable'?'✏️ Custom':'🤖 Auto'):''}</div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0">
                  ${!c.isDefault?`<button class="select-none" data-action="set-default" data-id="${c.id}" style="font-size:11px;padding:6px 10px;color:var(--orange);font-weight:700;background:var(--surface-raised);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-family:'Inter',sans-serif">Default</button>`:''}
                  <button class="select-none" data-action="remove-card" data-id="${c.id}" style="font-size:11px;padding:6px 8px;color:var(--text-3);font-weight:600;background:none;border:none;cursor:pointer;font-family:'Inter',sans-serif">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- No cards yet -->
        ${cards.length === 0 ? `
        <div class="tcard" style="padding:36px 24px;text-align:center;margin-bottom:16px">
          <div style="font-size:44px;margin-bottom:12px">💳</div>
          <div style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:6px">No cards yet</div>
          <div style="font-size:14px;color:var(--text-2);margin-bottom:24px">Add your cards to start earning smarter</div>
          <button class="btn btn-primary select-none" data-action="go-start">Add Cards</button>
        </div>` : ''}

      </div>

      ${this.bottomNav('home')}
    </div>`;
  },

  // ── OPTIMIZER ─────────────────────────────────────────────
  optimizer(data) {
    const selCat = App.state.selectedCategory;
    const amt    = App.state.purchaseAmount;

    return `
    <div class="screen" style="background:var(--bg)">
      <div class="tappa-header">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <button class="btn-icon" data-action="nav-home"
            style="background:rgba(255,255,255,0.2);border-radius:12px;padding:10px;border:none;cursor:pointer">
            ${svgBack().replace('<svg',`<svg style="width:20px;height:20px;color:white"`)}
          </button>
          <div>
            <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.02em">Tap to Card</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7)">Pick a merchant or category to get the best card</div>
          </div>
        </div>

        <!-- Manual merchant search -->
        <div style="background:white;border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:10px">
          <span style="font-size:18px">🔍</span>
          <input id="merchant-input" type="text" placeholder="e.g. Whole Foods, Starbucks, Shell…"
            value="${App.state.merchantInput}"
            style="flex:1;border:none;outline:none;font-size:15px;font-family:'Inter',sans-serif;color:var(--text);background:transparent">
        </div>
      </div>

      <div class="content-scroll" style="padding:16px 20px">

        <!-- ► LOCATION & NEARBY MERCHANTS — updated dynamically -->
        <div id="location-section" style="margin-bottom:16px">
          ${this.locationSection()}
        </div>

        <!-- Amount -->
        <div style="margin-bottom:20px">
          <div style="font-size:12px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">Purchase Amount</div>
          <div class="amount-input-wrap">
            <div class="amount-prefix">$</div>
            <input id="amount-input" type="number" inputmode="decimal" placeholder="50"
              value="${amt !== 50 ? amt : ''}"
              style="width:100%;border:none;outline:none;padding:14px 16px 14px 4px;font-size:18px;font-weight:700;color:var(--text);font-family:'Inter',sans-serif;background:transparent;-webkit-appearance:none">
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            ${[20,50,100,200].map(v => `
              <button onclick="App.state.purchaseAmount=${v};document.getElementById('amount-input').value=${v}"
                style="flex:1;border:2px solid ${amt===v?'var(--orange)':'var(--border)'};background:${amt===v?'#FEF0EA':'white'};border-radius:10px;padding:8px 0;font-size:14px;font-weight:600;color:${amt===v?'var(--orange)':'var(--text-2)'};cursor:pointer;font-family:'Inter',sans-serif">
                $${v}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- OR divider -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="flex:1;height:1px;background:var(--border)"></div>
          <div style="font-size:12px;font-weight:600;color:var(--text-2)">OR PICK A CATEGORY</div>
          <div style="flex:1;height:1px;background:var(--border)"></div>
        </div>

        <!-- Category grid -->
        <div class="cat-grid" style="margin-bottom:24px">
          ${CATEGORIES.map(c => `
            <button class="cat-pill select-none ${selCat===c.id?'active':''}" data-action="select-cat" data-cat="${c.id}">
              <span class="em">${c.emoji}</span>
              <span>${c.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- CTA -->
        <button class="btn btn-primary select-none" data-action="go-result"
          style="font-size:17px;padding:18px;box-shadow:0 6px 20px rgba(255,107,53,0.28)">
          ✦ Get Recommendation
        </button>

        ${data.cards.length === 0 ? `
        <div style="margin-top:16px;padding:14px 16px;background:var(--yellow);border-radius:12px;text-align:center;font-size:14px;font-weight:600;color:var(--text)">
          Add cards first to get a real recommendation
        </div>` : `
        <div style="margin-top:16px">
          <div style="font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:8px">Comparing your ${data.cards.length} card${data.cards.length>1?'s':''}</div>
          <div class="scroll-x">
            <div style="display:flex;gap:8px;width:max-content">
              ${data.cards.map(c=>`
                <div style="background:${c.color};border-radius:10px;padding:8px 12px">
                  <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);white-space:nowrap">${c.name.split(' ').slice(0,3).join(' ')}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>`}

      </div>

      ${this.bottomNav('optimizer')}
    </div>`;
  },

  // ── RESULT ───────────────────────────────────────────────
  result(data) {
    const r   = App.state.optimizerResult;
    if (!r) { App.navigate('optimizer'); return ''; }

    const cat   = CATEGORIES.find(c=>c.id===App.state.selectedCategory)||{emoji:'🛍️',label:'Purchase'};
    const fmt = text => text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
    const merchant = App.state.selectedMerchant?.name || App.state.merchantInput || null;

    return `
    <div class="screen" style="background:var(--bg)">
      <div class="content-scroll" style="padding:24px 20px">

        <!-- Context bar -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
          <button class="btn-icon" data-action="clear-result" style="padding:8px">${svgBack()}</button>
          <div style="flex:1">
            <div style="font-size:13px;color:var(--text-2);font-weight:500">
              ${merchant ? `📍 ${merchant} · ` : ''}${cat.emoji} ${cat.label} · $${App.state.purchaseAmount}
            </div>
          </div>
          ${r.dollarDiff > 0 ? `
          <div class="savings-chip">+$${r.dollarDiff.toFixed(2)}</div>` : ''}
        </div>

        <!-- Winner card -->
        <div class="result-card-chip" style="background:${r.bestCard.color};margin-bottom:16px;padding:22px">
          <div style="position:relative;z-index:1">
            <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">Best card to use</div>
            <div style="font-size:22px;font-weight:900;color:white;margin-bottom:14px;line-height:1.2">${r.bestCard.name}</div>
            <div style="display:flex;gap:20px">
              <div>
                <div style="font-size:32px;font-weight:900;color:white;line-height:1">${r.bestRate}${r.bestCard.rewardType==='cashback'?'%':'x'}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:600;margin-top:2px">${cat.emoji} ${cat.label}</div>
              </div>
              <div style="width:1px;background:rgba(255,255,255,0.2)"></div>
              <div>
                <div style="font-size:32px;font-weight:900;color:white;line-height:1">$${r.bestValue.toFixed(2)}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:600;margin-top:2px">on this purchase</div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI explanation -->
        <div class="ai-bubble" style="margin-bottom:16px">
          <span class="ai-star">✦</span>
          <div style="font-size:11px;font-weight:700;color:#1A7DB5;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">Tappa Says</div>
          <div style="font-size:15px;color:var(--text);line-height:1.65">${fmt(r.explanation)}</div>
        </div>


        <!-- All cards ranked -->
        <div class="tcard" style="padding:18px;margin-bottom:24px">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">All your cards at ${cat.label}</div>
          ${r.allCards.map((item,i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i<r.allCards.length-1?'border-bottom:1px solid var(--border)':''}">
              <div style="width:10px;height:10px;border-radius:3px;background:${item.card.color};flex-shrink:0"></div>
              <div style="flex:1;font-size:14px;font-weight:${i===0?'700':'500'};color:${i===0?'var(--text)':'var(--text-2)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${item.card.name.split(' ').slice(0,4).join(' ')}${item.card.isDefault?' ⭐':''}
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:14px;font-weight:700;color:${i===0?'var(--green-text)':'var(--text)'}">${item.rate}${item.card.rewardType==='cashback'?'%':'x'}</div>
                <div style="font-size:11px;color:var(--text-2)">$${item.value.toFixed(2)}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary select-none" data-action="clear-result" style="margin-bottom:12px;font-size:16px;padding:16px">
          ← Optimize Another Purchase
        </button>
        <button class="btn btn-ghost select-none" data-action="nav-home">Go to Home</button>

      </div>
    </div>`;
  },

  // ── FAMILY HUB ───────────────────────────────────────────
  family(data) {
    const approvals = data.pendingApprovals || [];
    const ss = data.shareSettings || {};
    const totalSpend = MOCK_FAMILY.members.reduce((s,m) => s+m.monthSpend, 0);
    const subTotal = MOCK_SUBSCRIPTIONS.reduce((s,sub) => s+(sub.active?sub.price:0), 0);
    const activeReturns = MOCK_RETURNS.filter(r=>r.status!=='refunded');
    const pendingRefund = activeReturns.reduce((s,r)=>s+r.amount,0);
    const overBudget = MOCK_BUDGET.categories.filter(c=>c.over);
    const totalSaved = (data.history||[]).reduce((s,h)=>s+(h.dollarSaved||0),0);

    return `
    <div class="screen" style="background:var(--bg)">
      <div style="background:linear-gradient(135deg,#1A1A2E 0%,#2D2D4E 100%);padding:52px 24px 28px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:rgba(255,107,53,0.08);border-radius:50%"></div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">Chen Household</div>
        <div style="font-size:28px;font-weight:900;color:white;letter-spacing:-0.02em;margin-bottom:2px">April 2026</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.5)">Household spend overview</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:20px">
          <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:12px;text-align:center">
            <div style="font-size:18px;font-weight:800;color:white">$${totalSpend.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px">Total Spent</div>
          </div>
          <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:12px;text-align:center">
            <div style="font-size:18px;font-weight:800;color:var(--yellow)">$${subTotal.toFixed(0)}/mo</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px">Subscriptions</div>
          </div>
          <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:12px;text-align:center">
            <div style="font-size:18px;font-weight:800;color:#6BCB77">$${totalSaved.toFixed(0)}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px">Cards Saved</div>
          </div>
        </div>
      </div>

      <div class="content-scroll" style="padding:20px">

        ${approvals.length > 0 ? `
        <div style="margin-bottom:16px">
          ${approvals.map(a=>`
          <div style="background:#FEF0EA;border:1.5px solid #FFD0BC;border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px">
            <span style="font-size:22px">🔔</span>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:var(--text)">${a.from} wants to share</div>
              <div style="font-size:12px;color:var(--text-2)">${a.label}</div>
            </div>
            <button data-action="approve-share" data-id="${a.id}" style="background:var(--orange);color:white;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif">Approve</button>
            <button data-action="deny-share" data-id="${a.id}" style="background:var(--border);color:var(--text-2);border:none;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif">Deny</button>
          </div>`).join('')}
        </div>` : ''}

        <!-- Members -->
        <div style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:12px">Members</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
          ${MOCK_FAMILY.members.map(m=>`
          <button data-action="go-credit-score" data-member="${m.id}" data-from="family"
            style="background:white;border:none;border-radius:16px;padding:18px;box-shadow:var(--shadow);cursor:pointer;text-align:left;font-family:'Inter',sans-serif;transition:transform 0.12s"
            ontouchstart="this.style.transform='scale(0.97)'" ontouchend="this.style.transform=''">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
              <div style="width:40px;height:40px;border-radius:12px;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:white">${m.initials}</div>
              <div>
                <div style="font-size:15px;font-weight:700;color:var(--text)">${m.name}</div>
                <div style="font-size:11px;color:var(--text-2)">${m.role}</div>
              </div>
            </div>
            <div style="margin-bottom:10px">
              <div style="font-size:11px;color:var(--text-2);margin-bottom:3px">Credit Score</div>
              <div style="display:flex;align-items:baseline;gap:5px">
                <div style="font-size:22px;font-weight:900;color:${m.creditScore>=740?'#4AB857':m.creditScore>=670?'#FAE96E':'#FF6B35'}">${m.id==='sarah'||!data.shareSettings?.creditWithPartner?m.creditScore:'—'}</div>
                <div style="font-size:11px;color:var(--text-2)">${m.creditLabel}</div>
              </div>
            </div>
            <div style="border-top:1px solid var(--border);padding-top:10px">
              <div style="font-size:11px;color:var(--text-2);margin-bottom:2px">Apr spend</div>
              <div style="font-size:16px;font-weight:700;color:var(--text)">$${m.monthSpend.toLocaleString()}</div>
            </div>
            <div style="margin-top:8px;font-size:11px;color:var(--orange);font-weight:600">View credit score →</div>
          </button>`).join('')}
        </div>

        <!-- Shared finances -->
        <div style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:12px">Shared Finances</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">

          <button data-action="go-subscriptions" data-from="family" class="tcard select-none"
            style="padding:16px;display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;border:none;font-family:'Inter',sans-serif">
            <div style="width:44px;height:44px;border-radius:12px;background:#EBF6FF;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">📱</div>
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700;color:var(--text)">Subscriptions</div>
              <div style="font-size:13px;color:var(--text-2)">$${subTotal.toFixed(2)}/mo · $${(subTotal*12).toFixed(0)}/yr</div>
            </div>
            ${MOCK_SUBSCRIPTIONS.filter(s=>s.flag).length>0?`<span style="background:#FEF0EA;color:var(--orange);font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px">${MOCK_SUBSCRIPTIONS.filter(s=>s.flag).length} unused</span>`:''}
            <div style="color:var(--text-2);font-size:18px">›</div>
          </button>

          <button data-action="go-returns" data-from="family" class="tcard select-none"
            style="padding:16px;display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;border:none;font-family:'Inter',sans-serif">
            <div style="width:44px;height:44px;border-radius:12px;background:#E3F6E5;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">↩️</div>
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700;color:var(--text)">Returns</div>
              <div style="font-size:13px;color:var(--text-2)">${activeReturns.length} active · $${pendingRefund.toFixed(2)} pending refund</div>
            </div>
            ${activeReturns.filter(r=>r.status==='approved').length>0?`<span style="background:#FEF0EA;color:var(--orange);font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px">Action needed</span>`:''}
            <div style="color:var(--text-2);font-size:18px">›</div>
          </button>

          <button data-action="nav-budget" class="tcard select-none"
            style="padding:16px;display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;border:none;font-family:'Inter',sans-serif">
            <div style="width:44px;height:44px;border-radius:12px;background:#FEF9E4;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">📊</div>
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700;color:var(--text)">Budget</div>
              <div style="font-size:13px;color:var(--text-2)">$${MOCK_BUDGET.spent.toLocaleString()} / $${MOCK_BUDGET.total.toLocaleString()} · ${overBudget.length} over</div>
            </div>
            ${overBudget.length>0?`<span style="background:#FEF0EA;color:var(--orange);font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px">${overBudget.length} over</span>`:''}
            <div style="color:var(--text-2);font-size:18px">›</div>
          </button>
        </div>

        <!-- Sharing privacy note -->
        <div style="background:#F7F8FA;border-radius:12px;padding:14px 16px;display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">
          <span style="font-size:18px;flex-shrink:0">🔒</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px">Privacy by default</div>
            <div style="font-size:12px;color:var(--text-2);line-height:1.5">Credit scores and individual transactions are always private. Budget totals and subscriptions are shared only with approval. Manage in Profile.</div>
          </div>
        </div>

      </div>
      ${this.bottomNav('family')}
    </div>`;
  },

  // ── CREDIT SCORE ─────────────────────────────────────────
  creditScore(data) {
    const memberId = App.state.creditMember || 'sarah';
    const m = MOCK_FAMILY.members.find(x=>x.id===memberId) || MOCK_FAMILY.members[0];
    const cd = MOCK_CREDIT[memberId];
    const isYou = memberId === 'sarah';

    return `
    <div class="screen" style="background:var(--bg)">
      <div style="background:linear-gradient(135deg,#1A1A2E 0%,#2D2D4E 100%);padding:52px 24px 24px;position:relative;overflow:hidden">
        <button data-action="go-back" style="position:absolute;top:52px;left:20px;background:rgba(255,255,255,0.12);border:none;border-radius:10px;padding:8px;cursor:pointer;display:flex;align-items:center;justify-content:center">
          ${svgBack().replace('<svg',`<svg style="width:20px;height:20px;color:white"`)}
        </button>
        <div style="text-align:center;padding-top:8px">
          <div style="width:52px;height:52px;border-radius:14px;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:white;margin:0 auto 10px">${m.initials}</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.5);font-weight:600">${isYou?'Your Credit Score':m.name+"'s Credit Score"}</div>
          ${!isYou?`<div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:4px">Shared with permission</div>`:''}
        </div>
      </div>

      <div class="content-scroll" style="padding:20px">

        <!-- Score gauge -->
        <div class="tcard" style="padding:24px;text-align:center;margin-bottom:16px">
          ${scoreGauge(cd.score, cd.gaugeColor)}
          <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:8px">
            <span style="font-size:13px;color:var(--text-2)">Last 8 months</span>
            <span style="font-size:13px;font-weight:700;color:#4AB857">+${cd.change} pts ↑</span>
          </div>
          <div style="margin-top:14px">${sparkline(cd.history,220,50,cd.gaugeColor)}</div>
          <div style="display:flex;justify-content:space-between;margin-top:4px">
            ${cd.labels.map(l=>`<div style="font-size:10px;color:var(--text-2)">${l}</div>`).join('')}
          </div>
        </div>

        <!-- Factors -->
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px">Score Factors</div>
        <div class="tcard" style="padding:4px 0;margin-bottom:16px">
          ${cd.factors.map((f,i)=>`
          <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;${i<cd.factors.length-1?'border-bottom:1px solid var(--border)':''}">
            <div style="flex:1">
              <div style="font-size:14px;font-weight:600;color:var(--text)">${f.label}</div>
              <div style="font-size:12px;color:var(--text-2);margin-top:1px">${f.status}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:15px;font-weight:700;color:${f.color}">${f.value}${f.unit||''}</div>
            </div>
          </div>`).join('')}
        </div>

        <!-- Loan approval rates -->
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px">Loan Approval Likelihood</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px">
          ${[{key:'mortgage',label:'Mortgage',emoji:'🏠'},{key:'auto',label:'Auto',emoji:'🚗'},{key:'personal',label:'Personal',emoji:'💵'}].map(l=>{
            const lo = cd.loans[l.key];
            return `<div class="tcard" style="padding:14px;text-align:center">
              <div style="font-size:20px;margin-bottom:6px">${l.emoji}</div>
              <div style="font-size:11px;color:var(--text-2);margin-bottom:4px">${l.label}</div>
              <div style="font-size:16px;font-weight:800;color:${lo.pct>=90?'#4AB857':lo.pct>=75?'#FAE96E':'#FF6B35'}">${lo.pct}%</div>
              <div style="font-size:10px;color:var(--text-2);margin-top:2px">${lo.label}</div>
              <div style="font-size:11px;font-weight:600;color:var(--text);margin-top:4px">~${lo.rate}</div>
            </div>`;
          }).join('')}
        </div>

        <!-- Score range guide -->
        <div class="tcard" style="padding:16px;margin-bottom:8px">
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">Score Ranges</div>
          ${[{range:'800–850',label:'Exceptional',color:'#4AB857'},{range:'740–799',label:'Very Good',color:'#6BCB77'},{range:'670–739',label:'Good',color:'#FAE96E'},{range:'580–669',label:'Fair',color:'#FF6B35'},{range:'300–579',label:'Poor',color:'#C0392B'}].map(r=>`
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <div style="width:10px;height:10px;border-radius:3px;background:${r.color};flex-shrink:0"></div>
            <div style="font-size:13px;color:var(--text);flex:1">${r.label}</div>
            <div style="font-size:12px;color:var(--text-2)">${r.range}</div>
          </div>`).join('')}
        </div>

      </div>
    </div>`;
  },

  // ── BUDGET ───────────────────────────────────────────────
  budget(data) {
    const b = MOCK_BUDGET;
    const pct = Math.round((b.spent/b.total)*100);
    const overCats = b.categories.filter(c=>c.over);
    const nudge = data.nudge || {};
    const totalSaved = (data.history||[]).reduce((s,h)=>s+(h.dollarSaved||0),0);

    return `
    <div class="screen" style="background:var(--bg)">
      <div class="tappa-header">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.02em">Budget</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7)">${b.month}</div>
          </div>
          <button data-action="go-card-suggest" data-from="budget"
            style="background:rgba(255,255,255,0.18);border:none;border-radius:12px;padding:10px 14px;font-size:12px;font-weight:700;color:white;cursor:pointer;font-family:'Inter',sans-serif;backdrop-filter:blur(8px)">
            💡 Card Tips
          </button>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:14px;backdrop-filter:blur(8px)">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:13px;color:rgba(255,255,255,0.75)">Spent</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75)">Budget</div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:24px;font-weight:900;color:white">$${b.spent.toLocaleString()}</div>
            <div style="font-size:24px;font-weight:900;color:rgba(255,255,255,0.6)">$${b.total.toLocaleString()}</div>
          </div>
          <div style="background:rgba(255,255,255,0.2);border-radius:100px;height:8px;overflow:hidden">
            <div style="width:${Math.min(pct,100)}%;height:100%;background:${pct>100?'#C0392B':pct>85?'#FAE96E':'#6BCB77'};border-radius:100px;transition:width 0.7s ease"></div>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:6px">${pct}% of monthly budget used</div>
        </div>
      </div>

      <div class="content-scroll" style="padding:16px 20px">

        ${overCats.length>0?`
        <div style="background:#FEF0EA;border:1.5px solid #FFD0BC;border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start">
          <span style="font-size:20px;flex-shrink:0">⚠️</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">Over budget on ${overCats.length} categories</div>
            <div style="font-size:13px;color:var(--text-2)">${overCats.map(c=>`${c.emoji} ${c.label} (+$${c.spent-c.budget} over)`).join(' · ')}</div>
          </div>
        </div>`:''}

        <!-- Total cash savings row -->
        <div class="tcard" style="padding:14px 16px;margin-bottom:16px;display:flex;gap:12px;align-items:center">
          <div style="width:44px;height:44px;border-radius:12px;background:#E3F6E5;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">💰</div>
          <div style="flex:1">
            <div style="font-size:13px;color:var(--text-2);margin-bottom:2px">Total saved with Tappa</div>
            <div style="font-size:20px;font-weight:800;color:#4AB857">$${(totalSaved+247.80).toFixed(2)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:var(--text-2)">This month</div>
            <div style="font-size:14px;font-weight:700;color:#4AB857">+$${(totalSaved+43.20).toFixed(2)}</div>
          </div>
        </div>

        <!-- Categories -->
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">Categories</div>
        <div class="tcard" style="padding:4px 0;margin-bottom:16px">
          ${b.categories.map((cat,i)=>{
            const catPct = Math.round((cat.spent/cat.budget)*100);
            const barColor = cat.over ? '#FF6B35' : catPct > 80 ? '#FAE96E' : '#4AB857';
            return `
            <div style="padding:14px 16px;${i<b.categories.length-1?'border-bottom:1px solid var(--border)':''}">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <span style="font-size:20px">${cat.emoji}</span>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:600;color:var(--text)">${cat.label}</div>
                </div>
                <div style="text-align:right">
                  <span style="font-size:13px;font-weight:700;color:${cat.over?'var(--orange)':'var(--text)'}">$${cat.spent}</span>
                  <span style="font-size:12px;color:var(--text-2)"> / $${cat.budget}</span>
                </div>
                ${cat.over?`<span style="background:#FEF0EA;color:var(--orange);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;flex-shrink:0">+$${cat.spent-cat.budget}</span>`:`<span style="background:#E3F6E5;color:#267835;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;flex-shrink:0">$${cat.budget-cat.spent} left</span>`}
              </div>
              <div style="background:var(--border);border-radius:100px;height:6px;overflow:hidden">
                <div style="width:${Math.min(catPct,100)}%;height:100%;background:${barColor};border-radius:100px;transition:width 0.5s ease"></div>
              </div>
              ${cat.trend!==0?`<div style="font-size:11px;color:${cat.trend>0?'var(--orange)':'#4AB857'};margin-top:5px">${cat.trend>0?'↑':'↓'} ${Math.abs(cat.trend)}% vs last month</div>`:''}
            </div>`;
          }).join('')}
        </div>

        <!-- Recent Transactions -->
        ${(data.history||[]).length > 0 ? (() => {
          const history = data.history || [];
          const cards   = data.cards   || [];
          return `
          <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">Recent Purchases</div>
          <div class="tcard" style="padding:4px 0;margin-bottom:16px">
            ${history.slice(0,10).map((h,i) => {
              const cat  = CATEGORIES.find(c=>c.id===h.category)||{emoji:'🛍️',label:h.category};
              const card = cards.find(c=>c.id===h.cardId);
              const date = new Date(h.ts);
              const dateStr = date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
              return `
              <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;${i<Math.min(history.length,10)-1?'border-bottom:1px solid var(--border)':''}">
                <div style="width:40px;height:40px;border-radius:11px;background:var(--surface-raised);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${cat.emoji}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.merchant || cat.label}</div>
                  <div style="font-size:12px;color:var(--text-2);margin-top:1px">${card?card.name.split(' ').slice(0,3).join(' '):'Unknown'} · ${dateStr}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-size:14px;font-weight:700;color:var(--text)">$${(h.amount||0).toFixed(0)}</div>
                  ${h.dollarSaved>0?`<div style="font-size:11px;color:var(--green-text);font-weight:600">+$${h.dollarSaved.toFixed(2)}</div>`:''}
                </div>
              </div>`;
            }).join('')}
          </div>`;
        })() : ''}

        <!-- Nudge reminder shortcut -->
        <div class="tcard" style="padding:16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer" data-action="nav-profile">
          <div style="width:44px;height:44px;border-radius:12px;background:#EBF6FF;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">🔔</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--text)">Budget Reminders</div>
            <div style="font-size:12px;color:var(--text-2)">${nudge.enabled?`${nudge.time==='morning'?'Morning':'Evening'} nudge at ${nudge.time==='morning'?nudge.morning||'08:00':nudge.evening||'21:00'}`:'Nudges off — tap to enable'}</div>
          </div>
          <div style="color:var(--text-2);font-size:18px">›</div>
        </div>

      </div>
      ${this.bottomNav('budget')}
    </div>`;
  },

  // ── SUBSCRIPTIONS ────────────────────────────────────────
  subscriptions(data) {
    const subs = MOCK_SUBSCRIPTIONS;
    const monthly = subs.reduce((s,sub)=>s+(sub.active?sub.price:0),0);
    const flagged = subs.filter(s=>s.flag);
    const byOwner = { shared: subs.filter(s=>s.owner==='shared'), sarah: subs.filter(s=>s.owner==='sarah'), mike: subs.filter(s=>s.owner==='mike') };

    const renderSub = (sub) => `
      <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--border)">
        <span style="font-size:22px;flex-shrink:0">${sub.emoji}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600;color:var(--text)">${sub.name}</div>
          <div style="font-size:12px;color:var(--text-2)">Next bill: ${sub.nextBill} · ${sub.owner==='shared'?'Shared':'Personal'}</div>
          ${sub.flag?`<div style="font-size:12px;color:var(--orange);font-weight:600;margin-top:3px">⚠️ ${sub.flag}</div>`:''}
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:15px;font-weight:700;color:${sub.active?'var(--text)':'var(--text-2)'}">${sub.active?`$${sub.price.toFixed(2)}`:'Inactive'}</div>
          <div style="font-size:10px;color:var(--text-2)">/mo</div>
        </div>
      </div>`;

    return `
    <div class="screen" style="background:var(--bg)">
      <div class="tappa-header">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <button data-action="go-back" style="background:rgba(255,255,255,0.2);border:none;border-radius:12px;padding:10px;cursor:pointer">
            ${svgBack().replace('<svg',`<svg style="width:20px;height:20px;color:white"`)}
          </button>
          <div>
            <div style="font-size:22px;font-weight:800;color:white">Subscriptions</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7)">Household recurring spend</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:14px">
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Monthly</div>
            <div style="font-size:24px;font-weight:900;color:white">$${monthly.toFixed(2)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:14px">
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Annual</div>
            <div style="font-size:24px;font-weight:900;color:var(--yellow)">$${(monthly*12).toFixed(0)}</div>
          </div>
        </div>
      </div>

      <div class="content-scroll" style="padding:20px">

        ${flagged.length>0?`
        <div style="background:#FEF0EA;border:1.5px solid #FFD0BC;border-radius:14px;padding:14px 16px;margin-bottom:16px">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:8px">💡 Subscription Audit</div>
          ${flagged.map(s=>`<div style="font-size:13px;color:var(--text-2);margin-bottom:4px">• <strong>${s.name}</strong> ($${s.price.toFixed(2)}/mo) — ${s.flag}</div>`).join('')}
          <div style="font-size:13px;font-weight:600;color:var(--orange);margin-top:8px">Cancel ${flagged.map(s=>s.name).join(' & ')} to save $${flagged.reduce((t,s)=>t+s.price,0).toFixed(2)}/mo ($${(flagged.reduce((t,s)=>t+s.price,0)*12).toFixed(0)}/yr)</div>
        </div>`:''}

        ${[{key:'shared',label:'Shared',icon:'👪'},{key:'sarah',label:'Sarah',icon:'👤'},{key:'mike',label:'Mike',icon:'👤'}].map(g=>`
        <div style="font-size:13px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">${g.icon} ${g.label}</div>
        <div class="tcard" style="padding:0;margin-bottom:16px;overflow:hidden">
          ${byOwner[g.key].map(renderSub).join('')}
          <div style="display:flex;justify-content:space-between;padding:11px 16px;background:#F7F8FA">
            <div style="font-size:12px;font-weight:600;color:var(--text-2)">${byOwner[g.key].length} subscriptions</div>
            <div style="font-size:13px;font-weight:700;color:var(--text)">$${byOwner[g.key].filter(s=>s.active).reduce((t,s)=>t+s.price,0).toFixed(2)}/mo</div>
          </div>
        </div>`).join('')}

      </div>
    </div>`;
  },

  // ── RETURNS ──────────────────────────────────────────────
  returns(data) {
    const active = MOCK_RETURNS.filter(r=>r.status!=='refunded');
    const done   = MOCK_RETURNS.filter(r=>r.status==='refunded');
    const pendingAmt = active.reduce((s,r)=>s+r.amount,0);

    const statusIcon = s => s==='shipped'?'📦':s==='approved'?'✅':s==='pending'?'⏳':'💚';

    return `
    <div class="screen" style="background:var(--bg)">
      <div class="tappa-header">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <button data-action="go-back" style="background:rgba(255,255,255,0.2);border:none;border-radius:12px;padding:10px;cursor:pointer">
            ${svgBack().replace('<svg',`<svg style="width:20px;height:20px;color:white"`)}
          </button>
          <div>
            <div style="font-size:22px;font-weight:800;color:white">Returns</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7)">Track your refunds</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Pending refund</div>
            <div style="font-size:24px;font-weight:900;color:var(--yellow)">$${pendingAmt.toFixed(2)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Active returns</div>
            <div style="font-size:24px;font-weight:900;color:white">${active.length}</div>
          </div>
        </div>
      </div>

      <div class="content-scroll" style="padding:20px">

        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px">Active Returns</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
          ${active.map(r=>`
          <div class="tcard" style="padding:16px">
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
              <span style="font-size:26px;flex-shrink:0">${r.emoji}</span>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                  <div style="font-size:15px;font-weight:700;color:var(--text)">${r.merchant}</div>
                  <span style="background:${r.statusColor}18;color:${r.statusColor};font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px">${statusIcon(r.status)} ${r.statusLabel}</span>
                </div>
                <div style="font-size:13px;color:var(--text-2)">${r.item}</div>
              </div>
              <div style="font-size:18px;font-weight:800;color:var(--text);flex-shrink:0">$${r.amount.toFixed(2)}</div>
            </div>
            <div style="background:var(--bg);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:5px">
              ${r.deadline?`<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--text-2)">Return deadline</span><span style="font-weight:600;color:${r.status==='approved'?'var(--orange)':'var(--text)'}">${r.deadline}</span></div>`:''}
              ${r.tracking?`<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--text-2)">Tracking</span><span style="font-weight:600;color:#1A7DB5">${r.tracking}</span></div>`:''}
              <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--text-2)">Refund ETA</span><span style="font-weight:600;color:var(--text)">${r.refundETA}</span></div>
            </div>
          </div>`).join('')}
        </div>

        ${done.length>0?`
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px">Completed</div>
        <div class="tcard" style="padding:0;overflow:hidden">
          ${done.map((r,i)=>`
          <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;${i<done.length-1?'border-bottom:1px solid var(--border)':''}">
            <span style="font-size:20px">${r.emoji}</span>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:600;color:var(--text-2)">${r.merchant} — ${r.item}</div>
              <div style="font-size:12px;color:#4AB857;font-weight:600">${r.refundETA}</div>
            </div>
            <div style="font-size:15px;font-weight:700;color:#4AB857">$${r.amount.toFixed(2)}</div>
          </div>`).join('')}
        </div>`:''}

      </div>
    </div>`;
  },

  // ── CARD SUGGESTIONS ─────────────────────────────────────
  cardSuggest(data) {
    const history = data.history || [];
    const uses = history.length;
    const dataLevel = uses >= 20 ? 3 : uses >= 5 ? 2 : 1;
    const totalSavings = MOCK_CARD_SUGGESTIONS.reduce((s,c)=>s+c.annualSavings,0);
    const typeLabel = { upgrade:'Upgrade', new:'Add Card', downgrade:'Downgrade', optimize:'Optimize' };
    const typeColor = { upgrade:'#4AB857', new:'#1A7DB5', downgrade:'#FF6B35', optimize:'#A07A00' };
    const typeBg    = { upgrade:'#E3F6E5', new:'#EBF6FF', downgrade:'#FEF0EA', optimize:'#FEF9E4' };

    return `
    <div class="screen" style="background:var(--bg)">
      <div class="tappa-header">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <button data-action="go-back" style="background:rgba(255,255,255,0.2);border:none;border-radius:12px;padding:10px;cursor:pointer">
            ${svgBack().replace('<svg',`<svg style="width:20px;height:20px;color:white"`)}
          </button>
          <div>
            <div style="font-size:22px;font-weight:800;color:white">Card Intelligence</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7)">Based on your spending habits</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Potential annual savings</div>
            <div style="font-size:26px;font-weight:900;color:var(--yellow)">$${totalSavings.toLocaleString()}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Data quality</div>
            <div style="font-size:14px;font-weight:700;color:white">${dataLevel===3?'✦ Full insights':dataLevel===2?'Growing':'Early'}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5)">3 months · 47+ uses</div>
          </div>
        </div>
      </div>

      <div class="content-scroll" style="padding:20px">

        <!-- Data threshold explanation -->
        <div style="background:#F7F8FA;border-radius:12px;padding:14px 16px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px">How Tappa builds your habit profile</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${[{n:1,label:'5+ uses',desc:'Category patterns emerge',done:true},{n:2,label:'20+ uses',desc:'Spending trends identified',done:dataLevel>=2},{n:3,label:'3 months',desc:'Full lifestyle recommendations',done:dataLevel>=3}].map(s=>`
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:22px;height:22px;border-radius:50%;background:${s.done?'#4AB857':'var(--border)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                ${s.done?`<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="20 6 9 17 4 12"/></svg>`:`<span style="font-size:10px;font-weight:700;color:var(--text-2)">${s.n}</span>`}
              </div>
              <div style="flex:1">
                <span style="font-size:12px;font-weight:700;color:${s.done?'var(--text)':'var(--text-2)'}">${s.label}</span>
                <span style="font-size:12px;color:var(--text-2);margin-left:6px">${s.desc}</span>
              </div>
            </div>`).join('')}
          </div>
        </div>

        <!-- Suggestions -->
        ${MOCK_CARD_SUGGESTIONS.map(s=>`
        <div class="tcard" style="padding:18px;margin-bottom:12px">
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
            <div style="width:36px;height:36px;border-radius:10px;background:${s.cardColor};flex-shrink:0"></div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                <div style="font-size:15px;font-weight:700;color:var(--text)">${s.card}</div>
                <span style="background:${typeBg[s.type]};color:${typeColor[s.type]};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.04em">${typeLabel[s.type]}</span>
                ${s.urgency==='high'?`<span style="background:#FEF0EA;color:var(--orange);font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">High impact</span>`:''}
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:16px">${s.habitEmoji}</span>
                <span style="font-size:12px;color:var(--text-2)">Based on ${s.habit} habits</span>
              </div>
            </div>
          </div>
          <div style="font-size:13px;color:var(--text);line-height:1.55;margin-bottom:12px">${s.reason}</div>
          <div style="background:#E3F6E5;border-radius:10px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:12px;color:#267835;font-weight:600">Annual savings potential</div>
            <div style="font-size:18px;font-weight:800;color:#267835">+$${s.annualSavings}</div>
          </div>
        </div>`).join('')}

      </div>
    </div>`;
  },

  // ── PROFILE ──────────────────────────────────────────────
  profile(data) {
    const nudge = data.nudge || { enabled:true, time:'evening', morning:'08:00', evening:'21:00' };
    const partners = data.sharePartners || [];

    return `
    <div class="screen" style="background:var(--bg)">
      <div class="tappa-header">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:white;flex-shrink:0">SC</div>
          <div>
            <div style="font-size:22px;font-weight:800;color:white">Sarah Chen</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7)">sarah@example.com</div>
          </div>
        </div>
      </div>

      <div class="content-scroll" style="padding:20px">

        <!-- Budget nudges -->
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">Budget Reminders</div>
        <div class="tcard" style="padding:0;margin-bottom:20px;overflow:hidden">
          <div style="padding:16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border)">
            <span style="font-size:22px">🔔</span>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700;color:var(--text)">Budget nudges</div>
              <div style="font-size:12px;color:var(--text-2)">Get reminded when you're near or over budget</div>
            </div>
            <div data-action="toggle-nudge" style="width:46px;height:26px;border-radius:100px;background:${nudge.enabled?'var(--orange)':'var(--border)'};position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0">
              <div style="position:absolute;top:3px;${nudge.enabled?'right:3px':'left:3px'};width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:all 0.2s"></div>
            </div>
          </div>
          ${nudge.enabled?`
          <div style="padding:16px;border-bottom:1px solid var(--border)">
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px">When to remind you</div>
            <div style="display:flex;gap:8px">
              ${['morning','evening','both'].map(t=>`
              <button data-action="set-nudge-time" data-time="${t}"
                style="flex:1;padding:10px 6px;border-radius:10px;border:2px solid ${nudge.time===t?'var(--orange)':'var(--border)'};background:${nudge.time===t?'#FEF0EA':'white'};font-size:12px;font-weight:700;color:${nudge.time===t?'var(--orange)':'var(--text-2)'};cursor:pointer;font-family:'Inter',sans-serif">
                ${t==='morning'?'☀️ Morning':t==='evening'?'🌙 Evening':'⏱ Both'}
              </button>`).join('')}
            </div>
          </div>
          <div style="padding:16px">
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:10px">Set exact times</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <div style="font-size:11px;color:var(--text-2);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">☀️ Morning</div>
                <input id="nudge-morning-time" type="time" value="${nudge.morning||'08:00'}"
                  style="width:100%;border:2px solid var(--border);border-radius:10px;padding:10px 12px;font-size:15px;font-family:'Inter',sans-serif;color:var(--text);background:white;${nudge.time==='evening'?'opacity:0.4;pointer-events:none':''}">
              </div>
              <div>
                <div style="font-size:11px;color:var(--text-2);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">🌙 Evening</div>
                <input id="nudge-evening-time" type="time" value="${nudge.evening||'21:00'}"
                  style="width:100%;border:2px solid var(--border);border-radius:10px;padding:10px 12px;font-size:15px;font-family:'Inter',sans-serif;color:var(--text);background:white;${nudge.time==='morning'?'opacity:0.4;pointer-events:none':''}">
              </div>
            </div>
            <button data-action="save-nudge" class="btn btn-primary select-none" style="margin-top:12px;padding:14px;font-size:14px">Save Reminder Settings</button>
          </div>`:''}
        </div>

        <!-- Share with people -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-size:15px;font-weight:700;color:var(--text)">Sharing</div>
          <button data-action="show-add-partner" style="background:var(--orange);color:white;border:none;border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:6px">
            + Add Person
          </button>
        </div>

        ${App.state.addingPartner ? `
        <div class="tcard" style="padding:18px;margin-bottom:16px;border:2px solid var(--orange)">
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">Add someone to share with</div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Name</div>
              <input id="new-partner-name" class="t-input" type="text" placeholder="e.g. Mike, Emma, Mom…" autocomplete="off">
            </div>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--text-2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Relationship</div>
              <select id="new-partner-rel" class="t-input" style="appearance:none;-webkit-appearance:none;background:white url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22><path fill=%22%238A9BB0%22 d=%22M7 10l5 5 5-5z%22/></svg>') no-repeat right 14px center">
                <option>Partner</option><option>Spouse</option><option>Child</option><option>Parent</option><option>Roommate</option><option>Sibling</option>
              </select>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button data-action="save-partner" style="flex:1;background:var(--orange);color:white;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif">Add</button>
            <button data-action="cancel-add-partner" style="flex:1;background:var(--bg);color:var(--text-2);border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif">Cancel</button>
          </div>
        </div>` : ''}

        ${partners.length === 0 ? `
        <div class="tcard" style="padding:24px;text-align:center;margin-bottom:16px">
          <div style="font-size:36px;margin-bottom:10px">👥</div>
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">No one added yet</div>
          <div style="font-size:13px;color:var(--text-2)">Add a partner, family member, or roommate to share finances with.</div>
        </div>` : partners.map(p => `
        <div class="tcard" style="padding:0;margin-bottom:12px;overflow:hidden">
          <div style="padding:14px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border)">
            <div style="width:40px;height:40px;border-radius:12px;background:${p.color};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:white;flex-shrink:0">${p.initials}</div>
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700;color:var(--text)">${p.name}</div>
              <div style="font-size:12px;color:var(--text-2)">${p.relationship}</div>
            </div>
            <button data-action="remove-partner" data-id="${p.id}" style="background:none;border:none;cursor:pointer;color:var(--text-2);font-size:13px;font-weight:600;padding:6px;font-family:'Inter',sans-serif">Remove</button>
          </div>
          ${[
            { key:'budget', label:'Budget', icon:'📊', desc:'Monthly totals' },
            { key:'subscriptions', label:'Subscriptions', icon:'📱', desc:'All household subs' },
            { key:'transactions', label:'Transactions', icon:'📋', desc:'Needs approval each time' },
          ].map((item,i) => {
            const on = p.sharing[item.key];
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;${i<2?'border-bottom:1px solid var(--border)':''}">
              <span style="font-size:18px;flex-shrink:0">${item.icon}</span>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600;color:var(--text)">${item.label}</div>
                <div style="font-size:11px;color:var(--text-2)">${item.desc}${on?' · Request sent':''}</div>
              </div>
              <div data-action="toggle-partner-share" data-partner="${p.id}" data-type="${item.key}"
                style="width:42px;height:24px;border-radius:100px;background:${on?'var(--orange)':'var(--border)'};position:relative;cursor:pointer;flex-shrink:0">
                <div style="position:absolute;top:2px;${on?'right:2px':'left:2px'};width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2)"></div>
              </div>
            </div>`;
          }).join('')}
          <div style="padding:10px 16px;background:#F7F8FA">
            <div style="font-size:11px;color:var(--text-2)">🔒 Credit scores never shared · ${p.name} must approve each request</div>
          </div>
        </div>`).join('')}

        <div style="margin-bottom:20px"></div>

        <!-- Cards quick link -->
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">My Cards</div>
        <div class="tcard" style="padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:14px;cursor:pointer" data-action="go-start">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--orange);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">💳</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--text)">Manage Cards</div>
            <div style="font-size:12px;color:var(--text-2)">${data.cards.length} card${data.cards.length!==1?'s':''} in wallet — add or remove</div>
          </div>
          <div style="color:var(--text-2);font-size:18px">›</div>
        </div>

        <!-- iPhone widget -->
        <div class="tcard" style="padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:14px;cursor:pointer" data-action="go-widget">
          <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#1A1A2E,#2D2D4E);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">📱</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--text)">Add to iPhone Home Screen</div>
            <div style="font-size:12px;color:var(--text-2)">Set up your Tappa widget</div>
          </div>
          <div style="color:var(--text-2);font-size:18px">›</div>
        </div>

        <!-- App version -->
        <div style="text-align:center;padding:8px">
          <div style="font-size:12px;color:var(--text-2)">Tappa v2.0 · No bank logins. No card numbers. Ever.</div>
        </div>

      </div>
      ${this.bottomNav('profile')}
    </div>`;
  },

  // ── WIDGET SETUP ─────────────────────────────────────────
  widgetSetup(data) {
    const defaultCard = (data.cards||[]).find(c=>c.isDefault);
    return `
    <div class="screen" style="background:var(--bg)">
      <div style="background:linear-gradient(135deg,#1A1A2E 0%,#2D2D4E 100%);padding:52px 24px 28px;position:relative;overflow:hidden">
        <button data-action="nav-profile" style="position:absolute;top:52px;left:20px;background:rgba(255,255,255,0.12);border:none;border-radius:10px;padding:8px;cursor:pointer;display:flex;align-items:center;justify-content:center">
          ${svgBack().replace('<svg',`<svg style="width:20px;height:20px;color:white"`)}
        </button>
        <div style="text-align:center;padding-top:8px">
          <div style="font-size:40px;margin-bottom:10px">📱</div>
          <div style="font-size:22px;font-weight:800;color:white;margin-bottom:4px">Tappa on Your iPhone</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.6)">Home screen shortcut + what's possible</div>
        </div>
      </div>

      <div class="content-scroll" style="padding:20px">

        <!-- Widget preview -->
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">What it looks like</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">

          <!-- Small widget mockup -->
          <div style="background:linear-gradient(135deg,var(--orange),#FF8C5A);border-radius:22px;padding:16px;aspect-ratio:1;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 8px 24px rgba(255,107,53,0.3)">
            <div style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em">Tappa</div>
            <div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:2px">Best card now</div>
              <div style="font-size:14px;font-weight:800;color:white;line-height:1.2">${defaultCard ? defaultCard.name.split(' ').slice(0,3).join(' ') : 'Set up cards'}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:3px">📍 Near you</div>
            </div>
          </div>

          <!-- Medium widget mockup -->
          <div style="background:linear-gradient(135deg,#1A1A2E,#2D2D4E);border-radius:22px;padding:16px;aspect-ratio:1;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 8px 24px rgba(26,26,46,0.3)">
            <div style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em">Budget</div>
            <div>
              <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:2px">April 2026</div>
              <div style="font-size:16px;font-weight:800;color:var(--yellow)">88% used</div>
              <div style="background:rgba(255,255,255,0.1);border-radius:4px;height:4px;margin-top:6px;overflow:hidden">
                <div style="width:88%;height:100%;background:var(--yellow);border-radius:4px"></div>
              </div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px">⚠️ 3 categories over</div>
            </div>
          </div>
        </div>

        <!-- Step by step instructions -->
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">Add to Home Screen (iOS)</div>
        <div class="tcard" style="padding:0;margin-bottom:16px;overflow:hidden">
          ${[
            { n:'1', icon:'🌐', title:'Open in Safari', desc:'This app must be opened in Safari (not Chrome) for the Add to Home Screen option to appear.' },
            { n:'2', icon:'⬆️', title:'Tap the Share button', desc:"Tap the Share icon at the bottom of Safari (the square with an arrow pointing up)." },
            { n:'3', icon:'➕', title:'Tap "Add to Home Screen"', desc:'Scroll down in the share sheet and tap "Add to Home Screen". Rename it "Tappa" if you like.' },
            { n:'4', icon:'✅', title:'Tap "Add"', desc:'Confirm by tapping Add in the top right. Tappa appears on your home screen as a standalone app icon.' },
          ].map((s,i)=>`
          <div style="display:flex;gap:14px;padding:14px 16px;${i<3?'border-bottom:1px solid var(--border)':''}">
            <div style="width:32px;height:32px;border-radius:10px;background:var(--orange);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${s.icon}</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px">Step ${s.n}: ${s.title}</div>
              <div style="font-size:13px;color:var(--text-2);line-height:1.5">${s.desc}</div>
            </div>
          </div>`).join('')}
        </div>

        <!-- What's possible vs. native widget -->
        <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px">Home screen app vs. native widget</div>
        <div class="tcard" style="padding:0;margin-bottom:16px;overflow:hidden">
          ${[
            { feature:'App icon on home screen', web:true, native:true },
            { feature:'Full-screen standalone app', web:true, native:true },
            { feature:'No browser chrome (no URL bar)', web:true, native:true },
            { feature:'Lock screen glanceable widget', web:false, native:true },
            { feature:'Dynamic Island integration', web:false, native:true },
            { feature:'Background location alerts', web:false, native:true },
          ].map((r,i)=>`
          <div style="display:flex;align-items:center;gap:12px;padding:11px 16px;${i<5?'border-bottom:1px solid var(--border)':''}">
            <div style="flex:1;font-size:13px;color:var(--text)">${r.feature}</div>
            <div style="display:flex;gap:16px">
              <div style="text-align:center;min-width:40px">
                <div style="font-size:9px;color:var(--text-2);margin-bottom:2px">Web</div>
                <div style="font-size:16px">${r.web?'✅':'—'}</div>
              </div>
              <div style="text-align:center;min-width:40px">
                <div style="font-size:9px;color:var(--text-2);margin-bottom:2px">Native</div>
                <div style="font-size:16px">${r.native?'✅':'—'}</div>
              </div>
            </div>
          </div>`).join('')}
        </div>

        <div style="background:#EBF6FF;border:1.5px solid #C8E8F8;border-radius:14px;padding:16px;margin-bottom:8px">
          <div style="font-size:14px;font-weight:700;color:#1A1A2E;margin-bottom:6px">🛠 Native iOS app is on the roadmap</div>
          <div style="font-size:13px;color:#1A7DB5;line-height:1.55">A native Tappa iOS app with lock screen widgets, Dynamic Island support, and real-time location alerts is planned. The web app gives you the full experience today — add it to your home screen and it works like a native app for all core features.</div>
        </div>

      </div>
    </div>`;
  },

  // ── BOTTOM NAV ───────────────────────────────────────────
  bottomNav(active) {
    const items = [
      { id:'home',     label:'Home',    icon:svgHome()   },
      { id:'optimizer',label:'Tap',     icon:svgStar()   },
      { id:'family',   label:'Family',  icon:svgUsers()  },
      { id:'budget',   label:'Budget',  icon:svgChart()  },
      { id:'profile',  label:'Me',      icon:svgUser()   },
    ];
    return `
    <div class="bottom-nav">
      ${items.map(i=>`
        <button class="nav-item ${active===i.id?'active':''} select-none" data-action="nav-${i.id}">
          ${i.icon}<span>${i.label}</span>
        </button>
      `).join('')}
    </div>`;
  }
};

// ============================================================
// 10. UTILITIES
// ============================================================

function showToast(msg, ms = 2600) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity 0.3s';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, ms);
}

// ============================================================
// 11. BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Bind click delegation ONCE — survives all re-renders
  document.getElementById('app').addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (el) Actions.handle(el.dataset.action, el.dataset, el);
  });

  // Show loading state while CSV data files load
  document.getElementById('app').innerHTML = `
    <div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--navy);gap:16px">
      <div style="font-size:40px;font-weight:900;color:white;letter-spacing:-0.03em">Tappa</div>
      <div style="width:32px;height:32px;border:3px solid rgba(255,255,255,0.2);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite"></div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    </div>`;

  // Load all CSV data files, then boot
  await DataLoader.init();

  const data = Store.getState();
  App.navigate(data.onboarded ? 'home' : 'welcome');
});
