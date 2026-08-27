const fs = require('fs');
const DOMAIN = 'https://traderisktools.com';
const contractData = require('./data/futures-contracts.json');

const paths = [
  '/', '/futures-calculator/', '/points-to-ticks-calculator/',
  '/about/', '/privacy/', '/changelog/',
  ...contractData.contracts.map(c => `/tick-value/${c.symbol.toLowerCase()}/`)
];

const today = new Date().toISOString().slice(0, 10);
const existing = paths.filter(p => fs.existsSync('.' + p + 'index.html'));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${existing.map(p => `  <url><loc>${DOMAIN}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync('sitemap.xml', xml);
console.log(`sitemap.xml written with ${existing.length} URLs`);
