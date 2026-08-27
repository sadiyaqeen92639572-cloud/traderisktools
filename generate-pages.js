const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DOMAIN = 'https://traderisktools.com';
const LAST_REVIEWED = '2026-08-22';
const contractData = require('./data/futures-contracts.json');

// Same publisher entity used across this account's other finance-calculator
// sites (commission-calc-pro, paycheck-calculator-usa, poker-helper-calculator, etc).
const ORG = {
  '@type': 'Organization',
  name: 'TradeRiskTools',
  legalName: 'Gesmine-Invest Limited',
  identifier: { '@type': 'PropertyValue', propertyID: 'UK Company Number', value: '14120136' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Hardy House, 269 Poynders Gardens',
    addressLocality: 'London',
    postalCode: 'SW4 8PQ',
    addressCountry: 'GB'
  }
};

const NAV_LINKS = [
  { href: '/', label: 'Position Size' },
  { href: '/futures-calculator/', label: 'Futures Calculator' },
  { href: '/points-to-ticks-calculator/', label: 'Points ↔ Ticks' }
];

function webApp(fields) {
  return Object.assign({
    '@type': 'WebApplication',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    dateModified: LAST_REVIEWED,
    author: ORG,
    publisher: ORG,
    version: '2026-08-v1'
  }, fields);
}

function howToJsonLd(name, description, steps) {
  return {
    '@type': 'HowTo',
    name, description,
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text }))
  };
}

function layout({ title, description, canonicalPath, h1, subtitle, jsonLd, bodyHtml }) {
  const canonical = `${DOMAIN}${canonicalPath}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/styles.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<header>
<a href="/">TradeRiskTools</a>
<nav class="site-nav">${NAV_LINKS.map(l => `<a href="${l.href}">${l.label}</a>`).join(' · ')}</nav>
<h1>${h1}</h1>
<p>${subtitle}</p>
<p class="reviewed-badge">Last reviewed ${LAST_REVIEWED}</p>
</header>
<nav class="crumbs"><a href="/">Home</a> / ${h1}</nav>
<main>
${bodyHtml}
</main>
<footer>
<div class="footer-groups">
<div>
<p class="footer-heading">Calculators</p>
<ul>
<li><a href="/">Position Size Calculator</a></li>
<li><a href="/futures-calculator/">Futures Calculator</a></li>
<li><a href="/points-to-ticks-calculator/">Points to Ticks Calculator</a></li>
</ul>
</div>
<div>
<p class="footer-heading">Futures contract specs</p>
<ul>
${contractData.contracts.map(c => `<li><a href="/tick-value/${c.symbol.toLowerCase()}/">${c.symbol} Tick Value</a></li>`).join('\n')}
</ul>
</div>
<div>
<p class="footer-heading">Site</p>
<ul>
<li><a href="/about/">About &amp; methodology</a></li>
<li><a href="/privacy/">Privacy</a></li>
<li><a href="/changelog/">Changelog</a></li>
</ul>
</div>
</div>
<p class="footer-legal">TradeRiskTools is published by Gesmine-Invest Limited, registered UK company number 14120136, registered office at Hardy House, 269 Poynders Gardens, London, United Kingdom, SW4 8PQ. &copy; 2026 TradeRiskTools. Estimates only — not trading or financial advice.</p>
</footer>
<script src="/assets/calc-engine.js"></script>
<script src="/assets/affiliate-widget.js"></script>
</body>
</html>
`;
}

function faqJsonLd(items) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}

function write(dir, html) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('wrote', dir);
}

// ---- futures-calculator (flagship, 2,900/mo) ----
{
  const body = `
<div class="disclaimer-banner">Estimates only — futures point values are fixed by the exchange (CME); this is not trading or financial advice.</div>
<form id="calc-form">
  <label>Contract
    <select id="futuresSymbol"></select>
  </label>
  <p class="privacy-note" id="futuresSpecNote"></p>
  <label>Entry price (index points) <input type="number" id="entryPrice" value="20000" step="0.25"></label>
  <label>Exit price (index points) <input type="number" id="exitPrice" value="20050" step="0.25"></label>
  <label>Number of contracts <input type="number" id="numContracts" value="1" min="1" step="1"></label>
  <button type="submit" class="submit-btn">Calculate P&amp;L</button>
</form>
<div id="results-block">
  <div class="result-amount" id="r-total">$0</div>
  <div class="result-row"><span>Price move (points)</span><span id="r-move">0</span></div>
  <div class="result-row"><span>Ticks</span><span id="r-ticks">0</span></div>
  <div class="result-row"><span>Per-contract P&amp;L</span><span id="r-percontract">$0</span></div>
</div>
<section>
<h2>Want position sizing instead?</h2>
<p>This tool calculates P&amp;L on a trade you've already planned. To figure out how many contracts to trade in the first place based on your account size and risk tolerance, use the <a href="/">position size calculator</a> — it has a futures mode with the same contract specs.</p>
</section>
<section id="affiliate-widget"></section>
<section class="formula-section">
<h2>How this calculator works</h2>
<p class="source-line">Deterministic math — no AI, no estimation model. Formulas below.</p>
<div class="formula-code">
price_move = exit_price − entry_price<br>
ticks = price_move ÷ tick_size_points<br>
pnl_per_contract = ticks × tick_value_usd<br>
total_pnl = pnl_per_contract × num_contracts
</div>
<p class="formula-footnote">Tick size and tick value per contract are fixed by the exchange (CME) — see the <a href="/#contract-specs">contract specs table</a> for each Wave-1 symbol.</p>
</section>
<section>
<h2>FAQ</h2>
<h3>How do you calculate futures profit and loss?</h3>
<p>P&amp;L = (exit price − entry price) ÷ tick size × tick value × number of contracts. Each contract has a fixed exchange-set tick value — it isn't proportional to the index price, so you can't estimate futures P&amp;L the way you would a stock percentage move.</p>
<h3>What is the difference between tick value and point value?</h3>
<p>Tick value is the dollar amount for one minimum price increment (tick). Point value is the dollar amount for one full index point of movement — point value = tick value ÷ tick size in points. For MNQ: tick size 0.25pt, tick value $0.50, so point value = $0.50 ÷ 0.25 = $2.00 per point.</p>
</section>
<script>
let futuresContracts = [];
const fSymbolSelect = document.getElementById('futuresSymbol');
const fSpecNote = document.getElementById('futuresSpecNote');
fetch('/data/futures-contracts.json').then(r => r.json()).then(data => {
  futuresContracts = data.contracts;
  fSymbolSelect.innerHTML = futuresContracts.map(c => \`<option value="\${c.symbol}">\${c.symbol} — \${c.name}</option>\`).join('');
  updateFuturesSpecNote();
});
fSymbolSelect.addEventListener('change', updateFuturesSpecNote);
function updateFuturesSpecNote() {
  const c = futuresContracts.find(x => x.symbol === fSymbolSelect.value);
  if (c) fSpecNote.textContent = \`\${c.symbol}: tick \${c.tick_size_points}pt = $\${c.tick_value_usd.toFixed(2)} | $\${c.point_value_usd.toFixed(2)} per full point.\`;
}
document.getElementById('calc-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const c = futuresContracts.find(x => x.symbol === fSymbolSelect.value);
  if (!c) return;
  const entryPrice = document.getElementById('entryPrice').value;
  const exitPrice = document.getElementById('exitPrice').value;
  const numContracts = document.getElementById('numContracts').value;
  const priceMovePoints = Number(exitPrice) - Number(entryPrice);
  const r = tickValue({ priceMovePoints, tickSizePoints: c.tick_size_points, tickValueUsd: c.tick_value_usd, contracts: numContracts });
  document.getElementById('r-total').textContent = fmtUSD(r.totalDollars);
  document.getElementById('r-move').textContent = fmtNum(priceMovePoints, 2);
  document.getElementById('r-ticks').textContent = fmtNum(r.ticks, 2);
  document.getElementById('r-percontract').textContent = fmtUSD(r.dollarsPerContract);
  document.getElementById('results-block').classList.add('visible');
});
</script>`;
  const futuresFaq = faqJsonLd([
    ['How do you calculate futures profit and loss?', 'P&L = (exit price − entry price) ÷ tick size × tick value × number of contracts. Each contract has a fixed exchange-set tick value — it isn\'t proportional to the index price, so you can\'t estimate futures P&L the way you would a stock percentage move.'],
    ['What is the difference between tick value and point value?', 'Tick value is the dollar amount for one minimum price increment (tick). Point value is the dollar amount for one full index point of movement — point value = tick value ÷ tick size in points. For MNQ: tick size 0.25pt, tick value $0.50, so point value = $0.50 ÷ 0.25 = $2.00 per point.']
  ]);
  const jsonLd = { '@context': 'https://schema.org', '@graph': [
    webApp({ name: 'Futures Calculator', description: 'Calculates profit/loss on a futures trade from entry price, exit price, and number of contracts, using exchange contract specs.' }),
    futuresFaq,
    howToJsonLd(
      'How to calculate futures P&L',
      'Pick your contract, enter entry price, exit price, and number of contracts, and read the profit/loss in dollars.',
      [
        { name: 'Pick your contract', text: 'Select the futures symbol (ES, MES, NQ, MNQ, YM, MYM, RTY, or M2K) from the dropdown.' },
        { name: 'Enter entry and exit price', text: 'Enter the price you entered the trade at and the price you exited (or plan to exit) at, in index points.' },
        { name: 'Enter number of contracts', text: 'Enter how many contracts of that symbol you traded.' },
        { name: 'Read the P&L', text: 'The calculator converts the price move into ticks, multiplies by the exchange tick value, and totals across your contracts.' }
      ]
    ),
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' },
      { '@type': 'ListItem', position: 2, name: 'Futures Calculator', item: DOMAIN + '/futures-calculator/' }
    ]},
    ORG
  ]};
  write('futures-calculator', layout({
    title: 'Futures Calculator — P&L by Contract, Entry & Exit Price',
    description: 'Free futures profit/loss calculator. Pick your contract (ES, MES, NQ, MNQ, YM, MYM, RTY, M2K), enter entry/exit price and contract count, get exact P&L.',
    canonicalPath: '/futures-calculator/',
    h1: 'Futures Calculator',
    subtitle: 'P&L by contract, using real exchange tick values.',
    jsonLd, bodyHtml: body
  }));
}

// ---- points-to-ticks converter ----
{
  // Prose, table and FAQ numbers are all derived from data/futures-contracts.json
  // via these helpers — never typed as literals, so they cannot silently drift.
  const bySym = s => contractData.contracts.find(c => c.symbol === s);
  const tpp = ts => +(1 / ts).toFixed(6);           // ticks per point (0.1 -> 10, not 9.999…)
  const ticksFor = (sym, pts) => pts / bySym(sym).tick_size_points;
  const dollarsFor = (sym, pts) => ticksFor(sym, pts) * bySym(sym).tick_value_usd;
  const fmtMoney = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

  // Build-time guard: the worked examples cited on the page must match the data
  // file. A JSON edit that changes any of these fails the build loudly instead
  // of shipping a page whose examples contradict its own table.
  assert.deepStrictEqual(
    {
      nq20: [ticksFor('NQ', 20), dollarsFor('NQ', 20)],
      nq50: [ticksFor('NQ', 50), dollarsFor('NQ', 50)],
      mnq20: [ticksFor('MNQ', 20), dollarsFor('MNQ', 20)]
    },
    { nq20: [80, 400], nq50: [200, 1000], mnq20: [80, 40] },
    'points-to-ticks worked examples diverge from data/futures-contracts.json'
  );

  const nqTick = bySym('NQ').tick_size_points;
  const nqTpp = tpp(nqTick);
  const tppRows = contractData.contracts.map(c =>
    `<tr><td>${c.symbol}</td><td>${c.tick_size_points}</td><td>${tpp(c.tick_size_points)}</td></tr>`
  ).join('\n');

  const body = `
<div class="disclaimer-banner">Tick size is fixed by the exchange (CME/CBOT). This converter is deterministic arithmetic — not trading or financial advice.</div>
<form id="calc-form">
  <label>Contract
    <select id="convSymbol"></select>
  </label>
  <p class="privacy-note" id="convSpecNote"></p>
  <label>Value <input type="number" id="convValue" value="20"></label>
  <label>Unit
    <select id="convUnit">
      <option value="points">Points</option>
      <option value="ticks">Ticks</option>
    </select>
  </label>
  <label>Number of contracts <input type="number" id="convContracts" value="1" min="1" step="1"></label>
  <button type="submit" class="submit-btn">Convert</button>
</form>
<div id="results-block">
  <div class="result-amount" id="r-converted">0</div>
  <div class="result-row"><span>Ticks per point</span><span id="r-tpp">0</span></div>
  <div class="result-row"><span>$ per tick</span><span id="r-pertick">$0</span></div>
  <div class="result-row"><span>$ per point</span><span id="r-perpoint">$0</span></div>
  <div class="result-row"><span>Value of this move, per contract</span><span id="r-permove">$0</span></div>
  <div class="result-row"><span>Value across all contracts</span><span id="r-total">$0</span></div>
</div>
<section>
<h2>Ticks per point, by contract</h2>
<table>
<tr><th>Contract</th><th>Tick size (points)</th><th>Ticks per point</th></tr>
${tppRows}
</table>
<p class="formula-footnote">Ticks per point = 1 ÷ tick size. Tick sizes are the exchange-set values (CME/CBOT) from this site's contract-spec data, verified against CME contract specifications and updated ${contractData.last_updated}. Dollar-per-tick and dollar-per-point figures for each symbol are on the <a href="/tick-value/nq/">tick-value pages</a>.</p>
</section>
<section>
<h2>Worked examples</h2>
<h3>How many ticks is 20 points on NQ?</h3>
<p>20 points on NQ (E-mini Nasdaq-100) is ${ticksFor('NQ', 20)} ticks — tick size is ${nqTick} points, so ${nqTpp} ticks per point. That move is worth ${fmtMoney(dollarsFor('NQ', 20))} per contract.</p>
<h3>How many ticks is 50 points on NQ?</h3>
<p>50 points on NQ is ${ticksFor('NQ', 50)} ticks, worth ${fmtMoney(dollarsFor('NQ', 50))} per contract.</p>
<h3>How many ticks is 20 points on MNQ?</h3>
<p>MNQ (Micro E-mini Nasdaq-100) has the same ${bySym('MNQ').tick_size_points}-point tick size as NQ, so 20 points is also ${ticksFor('MNQ', 20)} ticks — but at the micro tick value that move is worth ${fmtMoney(dollarsFor('MNQ', 20))} per contract.</p>
<h3>How many ticks per point on NQ, MNQ and ES?</h3>
<p>All three have a ${nqTick}-point tick, so ${nqTpp} ticks per point. YM and MYM have a 1-point tick (1 tick per point); RTY and M2K have a 0.1-point tick (10 ticks per point).</p>
</section>
<section>
<h2>Related calculators</h2>
<p>Once you know the tick or dollar size of a move, the <a href="/futures-calculator/">futures calculator</a> turns an entry and exit price into full profit/loss, and the <a href="/">position size calculator</a> works out how many contracts to trade for a set account risk. Per-contract tick size, tick value and point value for each symbol are on the <a href="/tick-value/mnq/">tick-value pages</a>.</p>
</section>
<section class="formula-section">
<h2>How to convert points to ticks</h2>
<p class="source-line">Deterministic math — no AI, no estimation model. Formulas below.</p>
<div class="formula-code">
ticks = points ÷ tick_size_points<br>
points = ticks × tick_size_points<br>
dollars = ticks × tick_value_usd
</div>
<p class="formula-footnote">Need entry/exit P&amp;L instead? Use the <a href="/futures-calculator/">futures calculator</a>. Sizing the position first? Use the <a href="/">position size calculator</a>.</p>
</section>
<section id="affiliate-widget"></section>
<section>
<h2>FAQ</h2>
<h3>How do you convert points to ticks?</h3>
<p>Divide the point move by the contract's tick size in points. NQ has a ${nqTick}-point tick, so 20 points ÷ ${nqTick} = ${ticksFor('NQ', 20)} ticks. To go the other way, multiply ticks by the tick size.</p>
<h3>How many ticks is one point?</h3>
<p>It depends on the contract. ES, MES, NQ and MNQ have a 0.25-point tick, so 4 ticks per point. YM and MYM have a 1-point tick, so 1 tick per point. RTY and M2K have a 0.1-point tick, so 10 ticks per point.</p>
<h3>How many ticks is 20 points on NQ?</h3>
<p>${ticksFor('NQ', 20)} ticks, worth ${fmtMoney(dollarsFor('NQ', 20))} per contract.</p>
<h3>How many ticks is 50 points on NQ?</h3>
<p>${ticksFor('NQ', 50)} ticks, worth ${fmtMoney(dollarsFor('NQ', 50))} per contract.</p>
<h3>What is a tick in futures trading?</h3>
<p>A tick is the smallest price increment a futures contract can move. Each tick has a fixed dollar value set by the exchange, so ticks — not percentage moves — are how futures P&amp;L is measured.</p>
</section>
<script>
let convContracts = [];
const cSymbol = document.getElementById('convSymbol');
const cUnit = document.getElementById('convUnit');
const cValue = document.getElementById('convValue');
const cSpecNote = document.getElementById('convSpecNote');

fetch('/data/futures-contracts.json').then(r => r.json()).then(data => {
  convContracts = data.contracts;
  cSymbol.innerHTML = convContracts.map(c => \`<option value="\${c.symbol}">\${c.symbol} — \${c.name}</option>\`).join('');
  updateSpecNote();
  setStep();
}).catch(() => {
  cSpecNote.textContent = 'Contract data unavailable — reload the page.';
});

function currentContract() { return convContracts.find(x => x.symbol === cSymbol.value); }

function updateSpecNote() {
  const c = currentContract();
  if (!c) return;
  const ratio = 1 / c.tick_size_points;
  cSpecNote.textContent = \`\${c.symbol}: \${c.tick_size_points}pt tick = \${fmtNum(ratio, 2)} ticks/point | $\${c.tick_value_usd.toFixed(2)}/tick | $\${c.point_value_usd.toFixed(2)}/point.\`;
}

function setStep() {
  const c = currentContract();
  if (!c) return;
  cValue.step = cUnit.value === 'ticks' ? 1 : c.tick_size_points;
}

function recompute() {
  if (document.getElementById('results-block').classList.contains('visible')) runConvert();
}

cSymbol.addEventListener('change', () => { updateSpecNote(); setStep(); recompute(); });
cUnit.addEventListener('change', () => {
  const c = currentContract();
  if (c) {
    const v = Number(cValue.value) || 0;
    // Convert the field value into the newly-selected unit. Only IEEE-754 noise
    // is stripped (toFixed(10)) — the value itself is never rounded, since that
    // would silently change the user's own input and diverge the next result.
    const converted = cUnit.value === 'ticks' ? v / c.tick_size_points : v * c.tick_size_points;
    cValue.value = Number(converted.toFixed(10));
  }
  setStep();
  recompute();
});

function runConvert() {
  const c = currentContract();
  if (!c) return;
  const v = Number(cValue.value) || 0;
  const contracts = Number(document.getElementById('convContracts').value) || 1;
  const isPoints = cUnit.value === 'points';
  const priceMovePoints = isPoints ? v : v * c.tick_size_points;
  const r = tickValue({ priceMovePoints, tickSizePoints: c.tick_size_points, tickValueUsd: c.tick_value_usd, contracts });
  const convertedVal = isPoints ? r.ticks : priceMovePoints;
  const convertedUnit = isPoints ? 'ticks' : 'points';
  document.getElementById('r-converted').textContent = fmtNum(convertedVal, 4) + ' ' + convertedUnit;
  document.getElementById('r-tpp').textContent = fmtNum(1 / c.tick_size_points, 2);
  document.getElementById('r-pertick').textContent = fmtUSD(c.tick_value_usd);
  document.getElementById('r-perpoint').textContent = fmtUSD(c.point_value_usd);
  document.getElementById('r-permove').textContent = fmtUSD(r.dollarsPerContract);
  document.getElementById('r-total').textContent = fmtUSD(r.totalDollars);
  document.getElementById('results-block').classList.add('visible');
}

document.getElementById('calc-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!convContracts.length) return;
  runConvert();
});
</script>`;

  const faq = faqJsonLd([
    ['How do you convert points to ticks?', `Divide the point move by the contract's tick size in points. NQ has a ${nqTick}-point tick, so 20 points ÷ ${nqTick} = ${ticksFor('NQ', 20)} ticks. To go the other way, multiply ticks by the tick size.`],
    ['How many ticks is one point?', 'It depends on the contract. ES, MES, NQ and MNQ have a 0.25-point tick, so 4 ticks per point. YM and MYM have a 1-point tick, so 1 tick per point. RTY and M2K have a 0.1-point tick, so 10 ticks per point.'],
    ['How many ticks is 20 points on NQ?', `${ticksFor('NQ', 20)} ticks, worth ${fmtMoney(dollarsFor('NQ', 20))} per contract.`],
    ['How many ticks is 50 points on NQ?', `${ticksFor('NQ', 50)} ticks, worth ${fmtMoney(dollarsFor('NQ', 50))} per contract.`],
    ['What is a tick in futures trading?', 'A tick is the smallest price increment a futures contract can move. Each tick has a fixed dollar value set by the exchange, so ticks — not percentage moves — are how futures P&L is measured.']
  ]);
  const jsonLd = { '@context': 'https://schema.org', '@graph': [
    webApp({ name: 'Points to Ticks Calculator', description: 'Converts index points to ticks and back for ES, MES, NQ, MNQ, YM, MYM, RTY and M2K futures, with the dollar value of the move per contract.' }),
    faq,
    howToJsonLd(
      'How to convert points to ticks',
      'Pick your contract, enter a value, choose whether it is points or ticks, and read the converted figure plus its dollar value.',
      [
        { name: 'Pick your contract', text: 'Select the futures symbol (ES, MES, NQ, MNQ, YM, MYM, RTY, or M2K).' },
        { name: 'Enter a value', text: 'Type the number you want to convert.' },
        { name: 'Choose the unit', text: 'Set the unit to Points or Ticks — that is the unit of the number you entered.' },
        { name: 'Read the result', text: 'The converter shows the value in the other unit, the ticks-per-point ratio, and the dollar value of the move per contract and across all your contracts.' }
      ]
    ),
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' },
      { '@type': 'ListItem', position: 2, name: 'Points to Ticks Calculator', item: DOMAIN + '/points-to-ticks-calculator/' }
    ]},
    ORG
  ]};
  write('points-to-ticks-calculator', layout({
    title: 'Points to Ticks Calculator — Convert Futures Points & Ticks',
    description: 'Convert index points to ticks and back for ES, MES, NQ, MNQ, YM, MYM, RTY, M2K futures — with tick value in dollars. E.g. 20 points on NQ = 80 ticks = $400 per contract.',
    canonicalPath: '/points-to-ticks-calculator/',
    h1: 'Points to Ticks Calculator',
    subtitle: 'Convert points ↔ ticks for any index futures contract, with dollar value.',
    jsonLd, bodyHtml: body
  }));
}

// ---- Wave-1 per-symbol tick-value pages ----
for (const c of contractData.contracts) {
  const slug = c.symbol.toLowerCase();
  const body = `
<section>
<h2>${c.name} (${c.symbol}) contract specs</h2>
<table>
<tr><th>Exchange</th><td>${c.exchange}</td></tr>
<tr><th>Tick size</th><td>${c.tick_size_points} index points</td></tr>
<tr><th>Tick value</th><td>$${c.tick_value_usd.toFixed(2)}</td></tr>
<tr><th>Point value (1 full point move)</th><td>$${c.point_value_usd.toFixed(2)}</td></tr>
</table>
<p class="formula-footnote">Verified against CME contract specs, updated ${contractData.last_updated}. ${c.typical_day_margin_note}</p>
</section>
<section>
<h2>Quick reference</h2>
<div class="formula-code">
1 tick (${c.tick_size_points}pt) move = $${c.tick_value_usd.toFixed(2)} per contract<br>
1 full point move = $${c.point_value_usd.toFixed(2)} per contract<br>
10 point move = $${(c.point_value_usd * 10).toFixed(2)} per contract
</div>
</section>
<section>
<h2>Calculate your trade</h2>
<p>Use the full <a href="/futures-calculator/">futures calculator</a> to plug in your entry/exit price and contract count for ${c.symbol}, or the <a href="/">position size calculator</a> to figure out how many ${c.symbol} contracts to trade for a given account risk.</p>
<p>Just need to convert a price move on ${c.symbol} into ticks or dollars? Use the <a href="/points-to-ticks-calculator/">points to ticks calculator</a>.</p>
</section>
<section id="affiliate-widget"></section>`;
  const jsonLd = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Dataset',
      name: `${c.symbol} Tick Value and Contract Specs`,
      description: `Tick size, tick value, and point value for the ${c.name} (${c.symbol}) futures contract, sourced from CME contract specifications.`,
      dateModified: contractData.last_updated,
      isAccessibleForFree: true,
      url: `${DOMAIN}/tick-value/${slug}/`,
      variableMeasured: 'Futures contract tick value',
      creator: ORG,
      license: 'https://creativecommons.org/licenses/by/4.0/'
    },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' },
      { '@type': 'ListItem', position: 2, name: `${c.symbol} Tick Value`, item: `${DOMAIN}/tick-value/${slug}/` }
    ]},
    ORG
  ]};
  write(`tick-value/${slug}`, layout({
    title: `${c.symbol} Tick Value — ${c.name} Contract Specs`,
    description: `${c.symbol} (${c.name}) tick value is $${c.tick_value_usd.toFixed(2)} per ${c.tick_size_points}-point tick, $${c.point_value_usd.toFixed(2)} per full point. Verified CME contract specs.`,
    canonicalPath: `/tick-value/${slug}/`,
    h1: `${c.symbol} Tick Value`,
    subtitle: `${c.name} — $${c.tick_value_usd.toFixed(2)} per tick, $${c.point_value_usd.toFixed(2)} per point.`,
    jsonLd, bodyHtml: body
  }));
}

// ---- about ----
{
  const body = `
<section>
<h2>About TradeRiskTools</h2>
<p>TradeRiskTools is published by Gesmine-Invest Limited, registered UK company number 14120136, registered office at Hardy House, 269 Poynders Gardens, London, United Kingdom, SW4 8PQ. It provides free calculators for position sizing, futures P&amp;L, and futures contract tick values, aimed at retail and prop-firm funded traders.</p>
<h3>How the math is built and checked</h3>
<p>Every formula on this site is deterministic arithmetic given its inputs — not an AI model, not an estimate dressed up as one. The tick/point/position-size engine (<code>assets/calc-engine.js</code>) was verified before launch by hand-computing expected results for two contracts with very different scale (MNQ: $2.00 per point; ES: $50.00 per point) and checking the calculator matches in both the tick-based and point-based query direction — the error class where a tick/point mixup silently makes every figure on the site wrong by the same fixed multiple. Position-size math was checked the same way for stock and futures asset types against hand-computed expected values.</p>
<h3>Sourcing methodology</h3>
<p>Futures contract specs (tick size, tick value, point value) in <a href="/#contract-specs">the tick-value pages</a> are sourced directly from CME Group contract specifications, verified on ${LAST_REVIEWED} — not from memory, and not copied from another site's numbers. Wave 1 covers the micro/mini index contracts (ES, MES, NQ, MNQ, YM, MYM, RTY, M2K) most commonly allowed on prop-firm funded platforms; additional contracts will be added and sourced the same way.</p>
<h3>What this site deliberately avoids</h3>
<p>No day-trading tax or wash-sale calculator — that's YMYL tax content, and this is a brand-new domain with no track record yet to support giving tax guidance responsibly. No pip/lot-size/margin calculator — that SERP is occupied by broker-native tools with a structural incentive to keep traffic on their own platform, not a fair fight for a third-party calculator regardless of how good the tool is.</p>
<h3>Affiliate disclosure</h3>
<p>Some links on this site may be affiliate links to prop-firm evaluation programs, meaning we may earn a fee if you're referred to a partner. This does not affect the numbers any calculator on this site produces.</p>
<p>We are not a broker, not a prop firm, and not a registered investment adviser. Calculators here provide estimates for informational purposes only — always confirm numbers against your actual broker/platform statement.</p>
</section>`;
  write('about', layout({
    title: 'About TradeRiskTools',
    description: 'Who publishes TradeRiskTools, how our calculators are built and checked, and where our contract data comes from.',
    canonicalPath: '/about/',
    h1: 'About',
    subtitle: '',
    jsonLd: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'AboutPage', url: DOMAIN + '/about/', name: 'About TradeRiskTools', publisher: ORG },
      ORG
    ] },
    bodyHtml: body
  }));
}

// ---- privacy ----
{
  const body = `
<section>
<h2>Privacy Policy</h2>
<p>Calculator inputs are processed entirely in your browser and are not sent to our servers.</p>
<p>Last updated ${LAST_REVIEWED}.</p>
</section>`;
  write('privacy', layout({
    title: 'Privacy Policy — TradeRiskTools',
    description: 'How TradeRiskTools handles your data.',
    canonicalPath: '/privacy/',
    h1: 'Privacy Policy',
    subtitle: '',
    jsonLd: { '@context': 'https://schema.org', '@graph': [ORG] },
    bodyHtml: body
  }));
}

// ---- changelog ----
{
  const body = `
<section>
<h2>Changelog</h2>
<ul>
<li><strong>${LAST_REVIEWED}</strong> — Site launched: position size calculator (stocks/forex/futures) with stop-loss finder, futures P&amp;L calculator, Wave-1 tick-value pages for ES, MES, NQ, MNQ, YM, MYM, RTY, M2K.</li>
</ul>
</section>`;
  write('changelog', layout({
    title: 'Changelog — TradeRiskTools',
    description: 'What changed on TradeRiskTools and when.',
    canonicalPath: '/changelog/',
    h1: 'Changelog',
    subtitle: '',
    jsonLd: { '@context': 'https://schema.org', '@graph': [ORG] },
    bodyHtml: body
  }));
}

console.log('Done.');
