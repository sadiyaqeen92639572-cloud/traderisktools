/*
 * Renders the prop-firm affiliate card grid from /data/providers.json into any
 * element with id="affiliate-widget". Edit providers.json to add/remove firms —
 * never hardcode a firm name in a page template.
 */
(function () {
  const mount = document.getElementById('affiliate-widget');
  if (!mount) return;

  fetch('/data/providers.json')
    .then((r) => r.json())
    .then((data) => {
      const active = (data.providers || []).filter((p) => p.active);
      if (!active.length) {
        mount.innerHTML = '';
        return;
      }
      const cards = active
        .map(
          (p) => `
        <a class="provider-card" href="${p.url}" rel="sponsored noopener" target="_blank">
          <div class="provider-name">${p.name}</div>
          <div class="provider-blurb">${p.blurb}</div>
        </a>`
        )
        .join('');
      mount.innerHTML = `
        <div class="provider-grid">${cards}</div>
        <p class="affiliate-disclosure">Some links above are affiliate links — we may earn a fee if you sign up through them. This does not affect any calculator result on this site.</p>
      `;
    })
    .catch(() => {
      mount.innerHTML = '';
    });
})();
