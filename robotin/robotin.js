/* Robotín · asistente automático de remates (Ventura Legal). Funciona 100 % en el navegador sobre /remates/remates.json.
   No envía lo que escribes a ningún servidor. Información referencial; no es asesoría legal. */
(function () {
  'use strict';
  var WA = '51927995630', BASE = '/remates/';
  var D = null, ready = null, last = null, shown = 0, F = {}, typing = null;
  var els = {};

  function norm(t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(t) { var m = String(t).match(/[\d,]+(?:\.\d+)?/); return m ? parseFloat(m[0].replace(/,/g, '')) : null; }
  function area(r) { var t = r[2] + ' ' + (r[14] || ''), m = t.match(/([\d,]+(?:\.\d+)?)\s*m²/); if (m) return parseFloat(m[1].replace(/,/g, '')); m = t.match(/([\d.]+)\s*ha\b/i); return m ? parseFloat(m[1]) * 10000 : null; }
  function tipo(r) { var t = norm(r[2]); if (/^(casa|vivienda)/.test(t)) return 'casa'; if (/departamento|dpto|duplex/.test(t)) return 'departamento'; if (/^(local|tienda|oficina)/.test(t)) return 'local'; if (/terreno|lote|fraccion|predio|parcela/.test(t)) return 'terreno'; if (/estacionamiento|cochera/.test(t)) return 'estacionamiento'; return 'otro'; }
  function mon(r) { return r[3].indexOf('US$') === 0 ? 'US$' : 'S/'; }
  function link(r) { return BASE + r[4] + '/#r' + r[0]; }
  function fdate(f) { var m = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'], p = f.split('-'); return parseInt(p[2], 10) + ' de ' + m[parseInt(p[1], 10) - 1]; }
  function money(r) { return r[3].replace(/\.00$/, ''); }
  function wa(texto) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto); }

  /* ---------- datos ---------- */
  function load() {
    if (ready) return ready;
    ready = fetch(BASE + 'remates.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
      D = d; D.lugares = {};
      d.remates.forEach(function (r) {
        r[1].replace(/\)/g, '').split(/[,(]/).forEach(function (p) { p = norm(p).trim(); if (p.length > 2) D.lugares[p] = 1; });
      });
      D.nombres = Object.keys(D.lugares).sort(function (a, b) { return b.length - a.length; });
      D.ult = d.ediciones.map(function (e) { return e.fecha; }).sort().pop();
      return D;
    });
    return ready;
  }

  /* ---------- interpretación del mensaje ---------- */
  function parseNum(s, unit) {
    var n = parseFloat(String(s).replace(/,/g, ''));
    if (isNaN(n)) return null;
    unit = norm(unit || '');
    if (/^(mil|k)/.test(unit)) n *= 1000; else if (/^mill/.test(unit)) n *= 1000000;
    return n;
  }
  function parse(txt) {
    var m = norm(txt), o = {}, mm;
    // área
    mm = m.match(/(\d[\d.,]*)\s*(m2|m²|mts2|metros cuadrados|metros|mts|m\b)/);
    if (mm) { o.area = parseNum(mm[1].replace(/\./g, function (x, i, s) { return /\.\d{3}($|\D)/.test(s.slice(i)) ? '' : '.'; })); m = m.replace(mm[0], ' '); }
    var ha = m.match(/(\d[\d.]*)\s*(hectareas?|has?\b)/); if (ha) { o.area = parseFloat(ha[1]) * 10000; m = m.replace(ha[0], ' '); }
    // N° de remate
    var nr = m.match(/\b(2\d{4})\b/); if (nr) { o.n = nr[1]; m = m.replace(nr[0], ' '); }
    // moneda
    if (/(dolar|dolares|usd|us\$|\$)/.test(m)) o.mon = 'US$'; else if (/(sol\b|soles|s\/)/.test(m)) o.mon = 'S/';
    // precio
    var U = '(mil|k|millones|millon)?', N = '(\\d[\\d.,]*)';
    var rg = m.match(new RegExp('entre\\s*' + N + '\\s*' + U + '\\s*(?:y|a)\\s*' + N + '\\s*' + U));
    function pn(a, u) { return parseNum(a.replace(/\.(?=\d{3}\b)/g, ''), u); }
    if (rg) { o.min = pn(rg[1], rg[2] || rg[4]); o.max = pn(rg[3], rg[4]); m = m.replace(rg[0], ' '); }
    else {
      var mx = m.match(new RegExp('(?:hasta|menos de|maximo|max|no mas de|por debajo de|bajo|presupuesto de|presupuesto)\\s*(?:de\\s*)?(?:us\\$|s\\/|\\$)?\\s*' + N + '\\s*' + U));
      var mi = m.match(new RegExp('(?:desde|mas de|minimo|min|mayor a|mayor de|por encima de)\\s*(?:de\\s*)?(?:us\\$|s\\/|\\$)?\\s*' + N + '\\s*' + U));
      if (mx) { o.max = pn(mx[1], mx[2]); m = m.replace(mx[0], ' '); }
      if (mi) { o.min = pn(mi[1], mi[2]); m = m.replace(mi[0], ' '); }
      if (!mx && !mi) {
        var bare = m.match(new RegExp(N + '\\s*' + U + '\\s*(?:dolares|usd|soles|sol\\b|us\\$|s\\/)'));
        var pre = m.match(new RegExp('(?:us\\$|s\\/|\\$)\\s*' + N + '\\s*' + U));
        var b = bare || pre;
        if (b) { o.max = pn(b[1], b[2]); o.maxImplicito = true; m = m.replace(b[0], ' '); }
      }
    }
    // tipo
    if (/\b(casas?|viviendas?|chalet)\b/.test(m)) o.tipo = 'casa';
    else if (/\b(departamentos?|dptos?|depas?|duplex|flat)\b/.test(m)) o.tipo = 'departamento';
    else if (/\b(terrenos?|lotes?|parcelas?|solares?|predios?|chacras?)\b/.test(m)) o.tipo = 'terreno';
    else if (/\b(locales?|tiendas?|oficinas?|comerciales?)\b/.test(m)) o.tipo = 'local';
    else if (/\b(estacionamientos?|cocheras?)\b/.test(m)) o.tipo = 'estacionamiento';
    // cargas
    if (/(sin|libre de|limpio de|sin ninguna)\s*(cargas?|hipotecas?|embargos?|gravamenes|gravamen)|sin problemas legales|libres? de cargas/.test(m)) o.sc = true;
    // orden
    if (/(mas|menos)\s*(barat|econom)|barat[oa]s?|economic[oa]s?|menor precio|menor base|mas bajo/.test(m)) o.ord = 'asc';
    else if (/mas caro|mayor precio|mayor base|mas costoso/.test(m)) o.ord = 'desc';
    else if (/mas grande|mayor area|area mayor|mas amplio/.test(m)) o.ord = 'area';
    // lugar
    var padded = ' ' + m.replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ') + ' ', lug = [];
    for (var i = 0; i < D.nombres.length; i++) { var nm = D.nombres[i]; if (padded.indexOf(' ' + nm + ' ') >= 0) { var dup = lug.some(function (l) { return l.indexOf(nm) >= 0; }); if (!dup) lug.push(nm); } }
    if (lug.length) o.lug = lug;
    o._m = m;
    return o;
  }
  function tiene(o) { return o.lug || o.tipo || o.mon || o.min != null || o.max != null || o.area != null || o.sc || o.ord; }

  /* ---------- búsqueda ---------- */
  function coincide(r, f) {
    if (f.tipo && tipo(r) !== f.tipo) return false;
    if (f.mon && mon(r) !== f.mon) return false;
    var b = num(r[3]);
    if (f.min != null && (b === null || b < f.min)) return false;
    if (f.max != null && (b === null || b > f.max)) return false;
    if (f.area != null) { var a = area(r); if (a === null || a < f.area) return false; }
    if (f.sc && !/ninguna declarada/i.test(r[13] || '')) return false;
    if (f.lug && f.lug.length) {
      var h = norm(r[1]), ok = f.lug.some(function (l) {
        if (l === 'lima') return h.indexOf('lima') >= 0 || h.indexOf(',') < 0;
        return h.replace(/[^a-z0-9 ]/g, ' ').indexOf(l) >= 0;
      });
      if (!ok) return false;
    }
    return true;
  }
  function buscar(f) {
    var out = D.remates.filter(function (r) { return coincide(r, f); });
    var ord = f.ord || 'rec';
    out.sort(function (x, y) {
      if (ord === 'asc') return (num(x[3]) || 0) - (num(y[3]) || 0);
      if (ord === 'desc') return (num(y[3]) || 0) - (num(x[3]) || 0);
      if (ord === 'area') return (area(y) || 0) - (area(x) || 0);
      return x[4] < y[4] ? 1 : x[4] > y[4] ? -1 : (num(x[3]) || 0) - (num(y[3]) || 0);
    });
    return out;
  }
  function resumenFiltro(f) {
    var p = [];
    if (f.tipo) p.push(f.tipo === 'otro' ? 'otro inmueble' : f.tipo);
    if (f.lug) p.push('en ' + f.lug.map(function (x) { return x.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }).join(' o '));
    if (f.mon) p.push('base en ' + (f.mon === 'US$' ? 'dólares' : 'soles'));
    if (f.min != null) p.push('desde ' + (f.mon || '') + ' ' + f.min.toLocaleString('en-US'));
    if (f.max != null) p.push('hasta ' + (f.mon || '') + ' ' + f.max.toLocaleString('en-US'));
    if (f.area != null) p.push('de ' + f.area.toLocaleString('en-US') + ' m² o más');
    if (f.sc) p.push('sin cargas declaradas');
    return p.join(', ');
  }

  /* ---------- interfaz ---------- */
  function css() {
    var s = document.createElement('style');
    s.textContent = '.rb-l{position:fixed;right:14px;z-index:55;display:flex;align-items:flex-end;gap:8px;cursor:pointer;border:0;background:none;padding:0}.rb-l img{width:76px;height:76px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35));animation:rbf 3s ease-in-out infinite}@keyframes rbf{50%{transform:translateY(-6px)}}.rb-b{background:#fff;color:#0E1216;border:1px solid #C3C9D4;border-radius:14px 14px 4px 14px;padding:9px 12px;font:600 13px Inter,system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.18);max-width:190px;text-align:left;margin-bottom:22px}.rb-b i{font-style:normal;color:#2A4A9C}.rb-p{position:fixed;right:14px;bottom:14px;z-index:70;width:min(390px,calc(100vw - 28px));height:min(580px,calc(100vh - 28px));background:#fff;border:1px solid #C3C9D4;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.35);display:none;flex-direction:column;overflow:hidden;font:14px/1.45 Inter,system-ui,sans-serif;color:#0E1216}.rb-p.on{display:flex}.rb-h{background:linear-gradient(135deg,#20397A,#2A4A9C);color:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px}.rb-h img{width:44px;height:44px;background:#fff;border-radius:50%;padding:3px}.rb-h b{display:block;font-size:15px}.rb-h span{font-size:11.5px;opacity:.9}.rb-x{margin-left:auto;background:none;border:0;color:#fff;font-size:24px;cursor:pointer;line-height:1}.rb-m{flex:1;overflow-y:auto;padding:12px;background:#F2F5FB;display:flex;flex-direction:column;gap:8px}.rb-r,.rb-u{max-width:88%;padding:9px 12px;border-radius:14px;word-wrap:break-word}.rb-r{background:#fff;border:1px solid #DFE3EA;align-self:flex-start;border-bottom-left-radius:4px}.rb-u{background:#2A4A9C;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}.rb-r a{color:#20397A;font-weight:600}.rb-it{border:1px solid #DFE3EA;border-left:3px solid #5C78C0;background:#fff;padding:8px 10px;margin:6px 0;border-radius:6px;font-size:13px}.rb-it b{color:#20397A}.rb-it .t{font-size:15px;font-weight:600}.rb-it .z{display:flex;gap:10px;margin-top:4px;flex-wrap:wrap}.rb-it .z a{font-size:12.5px}.rb-ch{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px;background:#F2F5FB}.rb-ch button{border:1px solid #2A4A9C;color:#2A4A9C;background:#fff;border-radius:16px;padding:5px 11px;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer}.rb-ch button:hover{background:#E5EAF6}.rb-f{display:flex;gap:6px;padding:8px;border-top:1px solid #DFE3EA;background:#fff}.rb-f input{flex:1;padding:10px 12px;border:1px solid #C3C9D4;border-radius:20px;font:inherit;min-width:0}.rb-f button{background:#2A4A9C;color:#fff;border:0;border-radius:20px;padding:0 16px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}.rb-n{font-size:11px;color:#5A6470;padding:0 12px 8px;background:#fff;text-align:center}.rb-d{display:inline-block;width:6px;height:6px;border-radius:50%;background:#8FA4D8;margin:0 2px;animation:rbd 1s infinite}.rb-d:nth-child(2){animation-delay:.2s}.rb-d:nth-child(3){animation-delay:.4s}@keyframes rbd{50%{opacity:.25}}@media print{.rb-l,.rb-p{display:none}}';
    document.head.appendChild(s);
  }
  function build() {
    css();
    var l = document.createElement('button'); l.className = 'rb-l'; l.setAttribute('aria-label', 'Abrir chat con Robotín');
    l.innerHTML = '<span class="rb-b" id="rb-b">¿Buscas un remate? <i>Pregúntale a Robotín</i></span><img src="' + BASE + 'robotin/robotin-s.png" alt="Robotín" width="76" height="76">';
    document.body.appendChild(l); els.l = l;
    var p = document.createElement('div'); p.className = 'rb-p'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Chat con Robotín');
    p.innerHTML = '<div class="rb-h"><img src="' + BASE + 'robotin/robotin-s.png" alt=""><div><b>Robotín</b><span>Asistente automático de remates judiciales</span></div><button class="rb-x" aria-label="Cerrar">×</button></div><div class="rb-m" id="rb-m" aria-live="polite"></div><div class="rb-ch" id="rb-ch"></div><form class="rb-f"><input id="rb-i" type="text" placeholder="Ej.: casa en Lima hasta 100 mil dólares" autocomplete="off" aria-label="Escribe tu consulta"><button type="submit">Enviar</button></form><div class="rb-n">Respuestas automáticas con datos de REMAJU. Referencial, no es asesoría legal. Lo que escribes no se envía a ningún servidor.</div>';
    document.body.appendChild(p); els.p = p; els.m = p.querySelector('#rb-m'); els.ch = p.querySelector('#rb-ch'); els.i = p.querySelector('#rb-i');
    l.addEventListener('click', abrir);
    p.querySelector('.rb-x').addEventListener('click', cerrar);
    p.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var v = els.i.value.trim(); if (v) { els.i.value = ''; enviar(v); } });
    els.ch.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) enviar(b.getAttribute('data-q'), b.textContent); });
    function pos() { var fab = document.querySelector('.fab'); els.l.style.bottom = (fab ? fab.offsetHeight + 22 : 14) + 'px'; }
    pos(); window.addEventListener('resize', pos);
    setTimeout(function () { var b = document.getElementById('rb-b'); if (b && !els.abierto) b.style.display = 'none'; }, 14000);
  }
  function abrir() {
    els.abierto = true; els.p.classList.add('on'); els.l.style.display = 'none';
    var fab = document.querySelector('.fab'); if (fab) fab.style.display = 'none';
    if (!els.m.children.length) { load().then(inicio, function () { say('No pude cargar los datos de remates ahora. Puedes usar el <a href="' + BASE + 'buscar/">buscador</a> o escribirme por WhatsApp.', 0, [['Hablar con Víctor', 'asesoria']]); }); }
    setTimeout(function () { els.i.focus(); }, 50);
  }
  function cerrar() {
    els.abierto = false; els.p.classList.remove('on'); els.l.style.display = 'flex';
    var fab = document.querySelector('.fab'); if (fab) fab.style.display = '';
    var b = document.getElementById('rb-b'); if (b) b.style.display = 'none';
  }
  function scroll() { els.m.scrollTop = els.m.scrollHeight; }
  function user(t) { var d = document.createElement('div'); d.className = 'rb-u'; d.textContent = t; els.m.appendChild(d); scroll(); }
  function chips(c) {
    els.ch.innerHTML = '';
    (c || []).forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-q', x[1]); b.textContent = x[0]; els.ch.appendChild(b); });
  }
  function say(html, delay, c) {
    var t = document.createElement('div'); t.className = 'rb-r'; t.innerHTML = '<span class="rb-d"></span><span class="rb-d"></span><span class="rb-d"></span>'; els.m.appendChild(t); scroll(); chips([]);
    setTimeout(function () { t.innerHTML = html; chips(c); scroll(); }, delay == null ? 450 : delay);
  }
  var CH_INICIO = [['Casas en Lima', 'casa en lima'], ['Terrenos', 'terreno'], ['Departamentos', 'departamento'], ['Lo más barato', 'lo más barato en soles'], ['Sin cargas', 'sin cargas'], ['¿Cómo funciona?', 'como funciona un remate'], ['Crear alerta', 'alerta']];
  function inicio() {
    var u = D.ediciones.filter(function (e) { return e.fecha === D.ult; })[0];
    say('¡Hola! Soy <b>Robotín</b>, el asistente automático de los remates judiciales de Víctor Ventura. Tengo <b>' + D.remates.length + ' remates</b> publicados en ' + D.ediciones.length + ' ediciones; la última es del <a href="' + BASE + D.ult + '/">' + fdate(D.ult) + '</a>' + (u ? ' (' + esc(u.resumen.split('·')[0].trim()) + ')' : '') + '.<br><br>Cuéntame qué buscas: tipo de inmueble, ciudad, precio o área. Por ejemplo: <i>“casa en Lima hasta 100 mil dólares”</i>.', 600, CH_INICIO);
  }

  /* ---------- conversación ---------- */
  function item(r) {
    var a = area(r), c = (r[13] || '').trim(), sin = /ninguna declarada/i.test(c);
    return '<div class="rb-it"><div><b>N.° ' + esc(r[0]) + '</b> · ' + esc(r[1]) + '</div><div>' + esc(r[2]) + (a ? ' · ' + a.toLocaleString('en-US') + ' m²' : '') + '</div><div class="t">Base ' + esc(money(r)) + '</div><div style="color:#5A6470">' + (sin ? 'Sin cargas declaradas' : 'Con cargas: ' + esc(c.length > 90 ? c.slice(0, 88) + '…' : c)) + ' · edición ' + fdate(r[4]) + '</div><div class="z"><a href="' + link(r) + '">Ver ficha</a><a target="_blank" rel="noopener" href="' + wa('Hola Víctor, quiero apoyo con el remate N.° ' + r[0] + ' (' + r[1] + ', ' + r[2] + ', base ' + money(r) + ') de REMAJU. Vi la información en venturalegal.pe/remates') + '">Consultar con Víctor</a></div></div>';
  }
  function mostrar(list, f, desde) {
    var pg = list.slice(desde, desde + 5), h = '';
    pg.forEach(function (r) { h += item(r); });
    shown = desde + pg.length;
    var c = [];
    if (shown < list.length) c.push(['Ver más (' + (list.length - shown) + ')', 'ver mas']);
    c.push(['Solo sin cargas', 'sin cargas']); c.push(['Más barato', 'lo mas barato']); c.push(['Nueva búsqueda', 'empezar de nuevo']); c.push(['Crear alerta con esto', 'abrir alertas']);
    return [h, c];
  }
  function responderBusqueda(f, nota) {
    var list = buscar(f); last = list; shown = 0;
    if (f.ord === 'asc' || f.ord === 'desc') { if (!f.mon && list.some(function (r) { return mon(r) === 'US$'; }) && list.some(function (r) { return mon(r) === 'S/'; })) {
      say('Para ordenar por precio necesito comparar en la misma moneda. ¿Te muestro los remates en <b>soles</b> o en <b>dólares</b>?', 400, [['En soles', 'soles'], ['En dólares', 'dólares']]); return; } }
    if (!list.length) {
      var alt = [], keys = [['tipo', 'el tipo de inmueble'], ['lug', 'la ubicación'], ['mon', 'la moneda'], ['max', 'el precio máximo'], ['min', 'el precio mínimo'], ['area', 'el área'], ['sc', 'el filtro «sin cargas»']];
      keys.forEach(function (k) { if (f[k[0]] != null) { var g = JSON.parse(JSON.stringify(f)); delete g[k[0]]; var n = buscar(g).length; if (n) alt.push([k[1], n, k[0]]); } });
      var t = 'No encontré remates con <b>' + esc(resumenFiltro(f)) + '</b> entre los publicados.';
      var c = [];
      if (alt.length) { t += ' Si flexibilizas alguno de estos criterios sí hay opciones:'; alt.forEach(function (a) { c.push(['Sin ' + a[0] + ' → ' + a[1], 'quitar ' + a[2]]); }); }
      else t += ' Prueba con otra ciudad o tipo de inmueble.';
      c.push(['Crear alerta con esto', 'abrir alertas']); c.push(['Nueva búsqueda', 'empezar de nuevo']);
      say(t, 500, c); return;
    }
    var r = mostrar(list, f, 0);
    var intro = 'Encontré <b>' + list.length + '</b> remate' + (list.length === 1 ? '' : 's') + (resumenFiltro(f) ? ' · ' + esc(resumenFiltro(f)) : '') + '.' + (nota ? ' ' + nota : '') + (list.length > 5 ? ' Te muestro ' + (f.ord === 'asc' ? 'los más baratos' : f.ord === 'desc' ? 'los de mayor base' : f.ord === 'area' ? 'los de mayor área' : 'los más recientes') + ':' : '');
    say(intro + r[0] + '<small style="color:#5A6470">Información referencial de REMAJU. Verifica la partida en SUNARP, la posesión y las bases antes de ofertar.</small>', 600, r[1]);
  }
  function ficha(n) {
    var r = D.remates.filter(function (x) { return x[0] === n; })[0];
    if (!r) { say('No tengo el remate N.° ' + esc(n) + ' en las ediciones publicadas (desde el 6 de noviembre de 2026). Prueba con el <a href="' + BASE + 'buscar/">buscador</a> o descríbeme lo que buscas.', 400, CH_INICIO); return; }
    var h = item(r) + '<div style="font-size:13px">Tasación: <b>' + esc(r[6]) + '</b><br>Base (2/3): <b>' + esc(r[3]) + '</b><br>Oblaje: ' + esc(r[8]) + ' · Arancel: ' + esc(r[9]) + '<br>Partida: ' + esc(r[10]) + '</div><small style="color:#5A6470">Información referencial. Confirma datos y bases en REMAJU.</small>';
    say('Esto tengo del remate <b>N.° ' + esc(r[0]) + '</b>:' + h, 500, [['Hablar con Víctor sobre este remate', 'asesoria ' + r[0]], ['Revisión de título y cargas', 'titulo'], ['Nueva búsqueda', 'empezar de nuevo']]);
  }
  var FAQ = [
    [/como funciona|que es (un )?remate|remate judicial|como (se )?participa|como participo|como ofertar|quiero participar/, function () { return ['Un <b>remate judicial</b> es la venta pública de un bien embargado o hipotecado, ordenada por un juez para cobrar una deuda. En REMAJU (Poder Judicial) cada remate publica una <b>tasación</b>, una <b>base</b> (en estos remates, 2/3 de la tasación), el periodo de <b>inscripción</b> y las fechas de <b>ofertas</b>. Para ofertar normalmente debes inscribirte dentro del plazo y consignar el <b>oblaje</b> (depósito) y el <b>arancel</b>; ambos montos están en la ficha de cada remate y en las bases.<br><br>Antes de ofertar conviene revisar la <b>partida en SUNARP</b> (cargas), la <b>posesión</b> del inmueble y las bases del remate. ¿Te muestro opciones o prefieres que Víctor te oriente?', [['Buscar remates', 'empezar de nuevo'], ['Cargas y SUNARP', 'cargas'], ['Hablar con Víctor', 'asesoria']]]; }],
    [/oblaje|arancel|deposito|garantia|cuanto (hay que )?(pagar|depositar|consignar)/, function () { return ['El <b>oblaje</b> es el depósito que consignas para participar y el <b>arancel</b> es el pago judicial por postor. Sus montos figuran en la ficha de cada remate (en las fichas publicadas aquí el oblaje equivale al 10 % de la tasación, pero confirma siempre en las bases de REMAJU). Dame el N.° de un remate y te muestro sus montos, por ejemplo <i>«26109»</i>.', [['Ver remates recientes', 'lo mas reciente'], ['Hablar con Víctor', 'asesoria']]]; }],
    [/carga|hipoteca|embargo|gravamen|sunarp|partida|titulo|registral|estudio de titulo/, function () { return ['Las <b>cargas</b> (hipotecas, embargos, anotaciones de demanda) figuran en REMAJU y en la <b>partida registral</b> de SUNARP. Un remate puede venderse con cargas que se mantienen o con cargas que se cancelan: depende de su rango y de las bases. Por eso lo prudente es una <b>revisión de título y cargas</b> antes de ofertar. Víctor ofrece ese servicio de revisión; puedo derivarte con el N.° del remate que te interese: <a target="_blank" rel="noopener" href="' + wasolicitud() + '"><b>Escribir a Víctor →</b></a>', [['Solicitar revisión de título', 'titulo'], ['Solo sin cargas', 'sin cargas'], ['Buscar remates', 'empezar de nuevo']]]; }],
    [/posesion|desalojo|ocupante|ocupado|inquilino|entrega del bien/, function () { return ['La <b>posesión</b> no siempre está garantizada: un inmueble rematado puede estar ocupado y la entrega puede requerir trámites. Hay que verificarlo en campo y en el expediente antes de ofertar. Si quieres, Víctor puede orientarte sobre un remate concreto.', [['Hablar con Víctor', 'asesoria'], ['Buscar remates', 'empezar de nuevo']]]; }],
    [/base|tasacion|dos tercios|2\/3|descuento|por que es tan barat/, function () { return ['En los remates publicados aquí la <b>base es 2/3 de la tasación</b> (en un primer remate; si no hay postores puede haber convocatorias posteriores con rebaja). Es un precio de partida, no un precio final: otros postores pueden ofertar más. Revisa siempre cargas, posesión y estado real del inmueble: un precio bajo suele reflejar riesgos.', [['Ver los más baratos', 'lo mas barato'], ['Cargas y SUNARP', 'cargas']]]; }],
    [/alerta|avisame|avisar|notific|suscri|recibir|grupo|comunidad/, function () { var e = BASE + 'alertas/'; return ['Puedes crear una <b>alerta personalizada</b> (ciudad, tipo, precio, área) en <a href="' + e + '">' + 'venturalegal.pe/remates/alertas</a>. Se envía por WhatsApp a Víctor con tus criterios y tu autorización de datos. Por ahora es gratuito.', [['Crear mi alerta', 'abrir alertas'], ['Buscar ahora', 'empezar de nuevo']]]; }],
    [/asesor|abogado|victor|contacto|contactar|whatsapp|hablar|llamar|cotiz|precio del servicio|cuanto cuesta el servicio|servicio/, function () { return ['Con gusto. Víctor Ventura (Director – Ventura Legal) puede orientarte en un remate: revisión de título y cargas, análisis de riesgos y acompañamiento durante el remate. Toca el enlace y se abre WhatsApp con tu consulta ya escrita: <a target="_blank" rel="noopener" href="' + wasolicitud() + '"><b>Abrir WhatsApp →</b></a>', [['Seguir buscando', 'empezar de nuevo'], ['Seguir buscando', 'empezar de nuevo']]]; }],
    [/gracias|genial|perfecto|ok gracias|listo gracias/, function () { return ['¡Con gusto! Si quieres seguir viendo opciones, dime qué buscas; y si quieres que Víctor revise un remate, te derivo por WhatsApp.', CH_INICIO]; }],
    [/(^|\s)(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal)(\s|$)/, function () { return ['¡Hola! Cuéntame qué buscas: tipo de inmueble, ciudad, rango de precio o área mínima.', CH_INICIO]; }],
    [/ayuda|que puedes|que haces|opciones/, function () { return ['Puedo: buscar remates por <b>tipo, ciudad, precio y área</b>; mostrarte la ficha de un remate si me das su <b>N.°</b>; explicarte cómo funciona un remate; y derivarte con Víctor para revisión de título o asesoría.', CH_INICIO]; }]
  ];
  function wasolicitud(n) {
    var t = 'Hola Víctor, escribo desde Robotín (venturalegal.pe/remates).';
    if (n) { var r = D.remates.filter(function (x) { return x[0] === n; })[0]; t += ' Quiero apoyo con el remate N.° ' + n + (r ? ' (' + r[1] + ', ' + r[2] + ', base ' + money(r) + ')' : '') + '.'; }
    else { var rs = resumenFiltro(F); t += rs ? ' Estoy buscando: ' + rs + '.' : ' Quiero orientación sobre un remate judicial.'; if (last && last.length) t += ' Me interesan, entre otros, los N.° ' + last.slice(0, 3).map(function (r) { return r[0]; }).join(', ') + '.'; }
    return wa(t);
  }
  function enviar(txt, etiqueta) {
    user(etiqueta || txt);
    load().then(function () { procesar(txt); });
  }
  function procesar(txt) {
    var m = norm(txt).trim();
    if (/^(empezar de nuevo|nueva busqueda|reiniciar|borrar|limpiar)/.test(m)) { F = {}; last = null; say('Listo, empecemos de nuevo. ¿Qué tipo de inmueble, en qué ciudad y con qué presupuesto?', 350, CH_INICIO); return; }
    if (/^ver mas/.test(m)) { if (last && shown < last.length) { var r = mostrar(last, F, shown); say(r[0], 500, r[1]); } else say('No hay más resultados en esta búsqueda.', 300, CH_INICIO); return; }
    if (/^abrir alertas/.test(m)) { var q = []; if (F.lug) q.push('ub=' + encodeURIComponent(F.lug[0])); if (F.mon) q.push('mon=' + encodeURIComponent(F.mon)); if (F.min != null) q.push('min=' + F.min); if (F.max != null) q.push('max=' + F.max); if (F.area != null) q.push('area=' + F.area); if (F.tipo) q.push('tp=' + F.tipo); if (F.sc) q.push('sc=1'); location.href = BASE + 'alertas/' + (q.length ? '?' + q.join('&') : ''); return; }
    var mw = m.match(/^(asesoria|titulo)\s*(\d{5})?/);
    if (mw) { say('Te abro WhatsApp con un mensaje ya escrito para Víctor' + (mw[2] ? ' sobre el remate N.° ' + esc(mw[2]) : '') + '. Solo tienes que enviarlo. <br><a target="_blank" rel="noopener" href="' + wasolicitud(mw[2]) + '"><b>Abrir WhatsApp →</b></a><br><small style="color:#5A6470">Atiende Víctor Ventura personalmente; las respuestas de Robotín no constituyen asesoría legal.</small>', 400, [['Seguir buscando', 'empezar de nuevo']]); return; }
    if (/^quitar /.test(m)) { var k = m.split(' ')[1]; delete F[k]; responderBusqueda(F); return; }
    var o = parse(txt);
    if (o.n && !o.lug && !o.tipo) { ficha(o.n); return; }
    // ¿es búsqueda?
    var q = tiene(o);
    if (!q) {
      for (var i = 0; i < FAQ.length; i++) if (FAQ[i][0].test(m)) { var res = FAQ[i][1](); say(res[0], 500, res[1]); return; }
      if (/ultimo|reciente|hoy|nuevos|esta semana|hay algo/.test(m)) { F = { ord: 'rec' }; responderBusqueda(F); return; }
      say('No estoy seguro de haber entendido. Puedo buscar por <b>tipo</b> (casa, departamento, terreno, local, estacionamiento), <b>ciudad</b>, <b>precio</b> y <b>área</b>, o darte la ficha de un remate con su N.°. Ejemplos: <i>«terreno en Arequipa»</i>, <i>«departamento hasta 200 mil soles»</i>, <i>«lo más barato en dólares»</i>.', 500, CH_INICIO); return;
    }
    // FAQ con criterios (p. ej. «sin cargas» también es filtro): prevalece la búsqueda
    var esNueva = o.lug || o.tipo || o.min != null || o.max != null || o.area != null;
    var nf = (esNueva && !/\b(tambien|ademas|y que sea|y sin|ahora|solo)\b/.test(m)) ? {} : JSON.parse(JSON.stringify(F));
    ['lug', 'tipo', 'mon', 'min', 'max', 'area', 'sc', 'ord'].forEach(function (k) { if (o[k] != null) nf[k] = o[k]; });
    if (/dolares|usd/.test(m)) nf.mon = 'US$'; if (/\bsoles\b/.test(m)) nf.mon = 'S/';
    F = nf;
    responderBusqueda(F, o.maxImplicito ? 'Tomé ese monto como presupuesto máximo para la base.' : '');
  }

  function iniciar() { if (document.querySelector('.rb-l')) return; build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
