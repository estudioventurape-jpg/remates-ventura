// Lector de rematestributarios.sunat.gob.pe (ejecutar con javascript_tool de Claude in Chrome, en una pestaña abierta en
// https://rematestributarios.sunat.gob.pe/por-fecha). Recorre TODAS las páginas (?pag=2, 3, …) mientras haya remates con fecha
// de hoy en adelante y abre cada «Continuar leyendo» (/node/N) para leer el detalle. Solo categoría Inmuebles.
// No copia nombres de deudores, ejecutores ni martilleros. Al terminar deja el resultado en la propia página, entre
// @@SUNAT_INI@@ y @@SUNAT_FIN@@: leerlo con get_page_text. Cambiar HOY por la fecha del día (AAAA-MM-DD).
window.__r = null; window.__log = [];
(async () => {
  const HOY = '2026-11-19';
  const M = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
  const P = new DOMParser(); let items = [];
  for (let p = 1; p <= 40; p++) {
    const d = P.parseFromString(await (await fetch('/por-fecha' + (p > 1 ? '?pag=' + p : ''))).text(), 'text/html');
    const as = [...d.querySelectorAll('a')].filter(a => /Continuar/.test(a.textContent)); let fut = 0, n = 0;
    for (const a of as) {
      const c = a.closest('.views-row') || a.parentElement.parentElement, tx = c.textContent.replace(/\s+/g, ' ').trim();
      const m = tx.match(/Fecha \w+, (\d+) (\w+) (\d{4})/); if (!m) continue; n++;
      const f = m[3] + '-' + String(M[m[2]]).padStart(2, '0') + '-' + m[1].padStart(2, '0'); if (f >= HOY) fut++;
      const cat = tx.match(/Dependencia\s+(.*?)\s*\|\s*([^,]+),/) || [];
      items.push({ node: a.getAttribute('href').match(/\d+/)[0], f, cat: (cat[1] || '').trim(), dep: (cat[2] || '').trim() });
    }
    window.__log.push('p' + p + ':' + n + '/' + fut); if (!n || !fut) break;
  }
  const g = (d, l) => { const m = d.match(new RegExp('(?:^| ¦ )' + l + ' ¦ (.*?)(?= ¦ |$)')); return m ? m[1].trim() : ''; };
  const seen = {}, out = [];
  for (const i of items.filter(i => i.f >= HOY && /Inmueble/i.test(i.cat))) {
    if (seen[i.node]) continue; seen[i.node] = 1;
    const d = P.parseFromString(await (await fetch('/node/' + i.node)).text(), 'text/html');
    const m = d.querySelector('article') || d.querySelector('.region-content') || d.body;
    const det = m.innerText.split('\n').map(s => s.trim()).filter(Boolean).join(' ¦ ');
    const tit = ((d.querySelector('h1') || {}).textContent || '').replace(/\s+/g, ' ').trim(), otros = g(det, 'Otros');
    const pm = (tit + ' ' + otros).match(/PARTIDA[^0-9P]{0,25}(P?\d[\d-]{4,})/i) || tit.match(/\((P?\d{7,})\)/), fh = g(det, 'fecha').match(/(\d+:\d+)/);
    out.push([i.node, i.f, fh ? fh[1] : '', i.dep, tit, g(det, 'Precio Base'), g(det, 'Precio de Tasación'), g(det, 'Número de remate'),
      g(det, 'Local del Remate').slice(0, 170), g(det, 'Sistema de remate'), g(det, 'Grávamenes').slice(0, 330), pm ? pm[1] : '', g(det, '¿Incluye IGV\\?')]);
  }
  window.__r = out;
  document.body.innerHTML = '<main><article><h1>DATOS</h1><pre id="dd"></pre></article></main>';
  document.getElementById('dd').textContent = '@@SUNAT_INI@@' + JSON.stringify(out) + '@@SUNAT_FIN@@';
})().catch(e => window.__log.push('ERR ' + e));
'iniciado'; // esperar ~30 s y consultar: JSON.stringify({log: window.__log, n: window.__r && window.__r.length})
