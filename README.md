# TradeRiskTools

Trading-risk calculator hub — position sizing (stocks/forex/futures), futures
P&L, and per-contract futures tick-value pages. Built for retail and
prop-firm funded traders.

Domain: traderisktools.com (chosen 2026-08-22, **not yet registered**).

## What it does

- `/` — Position size calculator (flagship, ~1,900/mo). Asset-type toggle
  (stocks/forex/futures), stop-loss price finder, R-multiple risk note.
- `/futures-calculator/` — Futures P&L calculator (flagship, ~2,900/mo).
- `/tick-value/{symbol}/` — Wave-1 per-contract tick-value reference pages
  (ES, MES, NQ, MNQ, YM, MYM, RTY, M2K), generated from
  `data/futures-contracts.json`.

Excluded on purpose (see full research/gate reasoning in the approved plan):
pip/lot-size/margin calculator (fail the functional-clone SERP gate — broker-
native tools own that SERP), day-trading-tax/wash-sale calculator (YMYL,
revisit once the domain has authority).

## Stack

Static HTML, no build pipeline. `generate-pages.js` generates the futures
calculator, about/privacy/changelog, and all Wave-1 tick-value pages from
`data/futures-contracts.json`. `generate-sitemap.js` keeps `sitemap.xml` in
sync. Deploys to Cloudflare Pages via wrangler.

```
node generate-pages.js
node generate-sitemap.js
npx wrangler pages deploy . --project-name traderisktools --commit-dirty=true
```

## Monetization

Prop-firm affiliate widget (`assets/affiliate-widget.js`) reads
`data/providers.json` and renders a card grid — add/remove/reorder firms by
editing that JSON file only, never hardcode a firm into a page template.
Given 80+ prop-firm closures 2023-2026, review this list quarterly.
`providers.json` currently ships with placeholder (`active: false`) entries —
replace with real affiliate programs before launch.

## Contract data

`data/futures-contracts.json` tick size / tick value / point value figures
were verified against CME contract specifications on 2026-08-22 (not from
memory — see calc-engine.js verification below). Wave 2 (CL, MCL, GC, MGC)
and Wave 3/never (rates/currencies) are documented in the plan but not yet
built.

## Verification done pre-launch

`node -e` sanity checks confirmed `tickValue()` returns the correct figure in
both directions (tick-based and point-based query) for MNQ ($2.00/point) and
ES ($50.00/point) — the error class where a tick/point mixup silently makes
the whole site wrong by 4x. Also confirmed `positionSize()` for stock and
futures asset types against hand-computed expected values.

**Still open before deploy**: register traderisktools.com, replace
placeholder entries in `data/providers.json` with real prop-firm affiliate
links, run the mobile 390px overflow check, add a real favicon.
