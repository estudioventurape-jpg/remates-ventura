/* Robotín · asistente automático de remates (Ventura Legal). Funciona 100 % en el navegador sobre /remates/remates.json.
   No envía lo que escribes a ningún servidor. Información referencial; no es asesoría legal.
   v2 (19/11/2026): «memoria» geográfica (distritos de Lima Metropolitana y Callao por zonas, departamentos y vecinos,
   ciudades principales), respuestas aproximadas cuando no hay coincidencia exacta y contexto de la conversación. */
(function () {
  'use strict';
  var WA = '51927995630', BASE = '/remates/', SS = 'robotin_v2';
  var D = null, ready = null, last = null, shown = 0, F = {}, els = {}, G = {}, DIC = {}, TERMS = [], LG = null, SH = {};
  var FUENTES = [['pj', 'Poder Judicial (REMAJU)', 'REMAJU'], ['sunat', 'SUNAT', 'SUNAT'], ['indecopi', 'INDECOPI', 'INDECOPI']];
  function src(r) { return r[15] || 'pj'; }

  /* ================= MEMORIA GEOGRÁFICA ================= */
  var ZONAS = {
    'lima centro': ['Lima Centro', ['Cercado de Lima', 'Breña', 'La Victoria', 'Rímac', 'San Luis']],
    'lima moderna': ['Lima Moderna', ['Barranco', 'Jesús María', 'La Molina', 'Lince', 'Magdalena del Mar', 'Miraflores', 'Pueblo Libre', 'San Borja', 'San Isidro', 'San Miguel', 'Santiago de Surco', 'Surquillo']],
    'lima norte': ['Lima Norte', ['Ancón', 'Carabayllo', 'Comas', 'Independencia', 'Los Olivos', 'Puente Piedra', 'San Martín de Porres', 'Santa Rosa']],
    'lima este': ['Lima Este', ['Ate', 'Chaclacayo', 'Cieneguilla', 'El Agustino', 'Lurigancho', 'San Juan de Lurigancho', 'Santa Anita']],
    'lima sur': ['Lima Sur', ['Chorrillos', 'Lurín', 'Pachacámac', 'Pucusana', 'Punta Hermosa', 'Punta Negra', 'San Bartolo', 'San Juan de Miraflores', 'Santa María del Mar', 'Villa El Salvador', 'Villa María del Triunfo']]
  };
  var CALLAO = ['Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Ventanilla', 'Mi Perú'];
  var ALIAS_DIST = { 'surco': 'santiago de surco', 'sjl': 'san juan de lurigancho', 'sjm': 'san juan de miraflores', 'smp': 'san martin de porres', 'vmt': 'villa maria del triunfo', 'ves': 'villa el salvador', 'chosica': 'lurigancho', 'cercado': 'cercado de lima', 'centro de lima': 'cercado de lima', 'lima cercado': 'cercado de lima', 'magdalena': 'magdalena del mar', 'san martin de porras': 'san martin de porres', 'carmen de la legua': 'carmen de la legua reynoso' };
  var ALIAS_ZONA = { 'cono norte': 'lima norte', 'cono sur': 'lima sur', 'cono este': 'lima este', 'lima top': 'lima moderna' };
  // departamento: [nombre, vecinos]
  var DEPS = {
    'amazonas': ['Amazonas', ['cajamarca', 'la libertad', 'san martin', 'loreto']],
    'ancash': ['Áncash', ['la libertad', 'huanuco', 'lima']],
    'apurimac': ['Apurímac', ['ayacucho', 'cusco', 'arequipa']],
    'arequipa': ['Arequipa', ['ica', 'ayacucho', 'apurimac', 'cusco', 'puno', 'moquegua']],
    'ayacucho': ['Ayacucho', ['junin', 'huancavelica', 'ica', 'arequipa', 'apurimac', 'cusco']],
    'cajamarca': ['Cajamarca', ['piura', 'lambayeque', 'la libertad', 'amazonas']],
    'callao': ['Callao', ['lima']],
    'cusco': ['Cusco', ['junin', 'ucayali', 'madre de dios', 'puno', 'arequipa', 'apurimac', 'ayacucho']],
    'huancavelica': ['Huancavelica', ['lima', 'junin', 'ayacucho', 'ica']],
    'huanuco': ['Huánuco', ['la libertad', 'san martin', 'loreto', 'ucayali', 'pasco', 'lima', 'ancash']],
    'ica': ['Ica', ['lima', 'huancavelica', 'ayacucho', 'arequipa']],
    'junin': ['Junín', ['pasco', 'ucayali', 'cusco', 'ayacucho', 'huancavelica', 'lima']],
    'la libertad': ['La Libertad', ['lambayeque', 'cajamarca', 'amazonas', 'san martin', 'huanuco', 'ancash']],
    'lambayeque': ['Lambayeque', ['piura', 'cajamarca', 'la libertad']],
    'lima': ['Lima', ['callao', 'ancash', 'huanuco', 'pasco', 'junin', 'huancavelica', 'ica']],
    'loreto': ['Loreto', ['amazonas', 'san martin', 'huanuco', 'ucayali']],
    'madre de dios': ['Madre de Dios', ['ucayali', 'cusco', 'puno']],
    'moquegua': ['Moquegua', ['arequipa', 'puno', 'tacna']],
    'pasco': ['Pasco', ['huanuco', 'ucayali', 'junin', 'lima']],
    'piura': ['Piura', ['tumbes', 'lambayeque', 'cajamarca']],
    'puno': ['Puno', ['madre de dios', 'cusco', 'arequipa', 'moquegua', 'tacna']],
    'san martin': ['San Martín', ['amazonas', 'loreto', 'ucayali', 'huanuco', 'la libertad']],
    'tacna': ['Tacna', ['moquegua', 'puno']],
    'tumbes': ['Tumbes', ['piura']],
    'ucayali': ['Ucayali', ['loreto', 'huanuco', 'pasco', 'junin', 'cusco', 'madre de dios']]
  };
  var ALIAS_DEP = { 'cuzco': 'cusco' };
  var CIUDADES = { 'piura': ['Sullana', 'Talara', 'Paita', 'Catacaos', 'Chulucanas', 'Máncora'], 'lambayeque': ['Chiclayo', 'Ferreñafe', 'Pimentel'], 'la libertad': ['Trujillo', 'Chepén', 'Pacasmayo', 'Huanchaco', 'Huamachuco'], 'cajamarca': ['Jaén', 'Chota', 'Cutervo'], 'amazonas': ['Chachapoyas', 'Bagua'], 'san martin': ['Tarapoto', 'Moyobamba', 'Rioja', 'Juanjuí'], 'loreto': ['Iquitos', 'Yurimaguas', 'Nauta', 'Requena'], 'ucayali': ['Pucallpa'], 'ancash': ['Huaraz', 'Chimbote', 'Nuevo Chimbote', 'Casma', 'Huarmey', 'Caraz'], 'huanuco': ['Tingo María'], 'pasco': ['Cerro de Pasco', 'Oxapampa'], 'junin': ['Huancayo', 'Tarma', 'La Merced', 'Satipo', 'Jauja', 'Chanchamayo', 'Pichanaqui'], 'ayacucho': ['Huamanga', 'Huanta'], 'apurimac': ['Abancay', 'Andahuaylas'], 'cusco': ['Quillabamba', 'Urubamba', 'Sicuani', 'Calca'], 'madre de dios': ['Puerto Maldonado'], 'puno': ['Juliaca'], 'arequipa': ['Camaná', 'Mollendo', 'Cerro Colorado', 'Cayma', 'Yanahuara'], 'moquegua': ['Ilo'], 'ica': ['Chincha', 'Pisco', 'Nazca', 'Paracas'], 'lima': ['Huacho', 'Huaral', 'Barranca', 'Cañete', 'Chancay', 'Lunahuaná', 'Huarochirí', 'Chilca'] };
  var MACROS = {
    'norte del peru': ['el norte del Perú', ['tumbes', 'piura', 'lambayeque', 'la libertad', 'cajamarca', 'ancash']], 'en el norte': ['el norte del Perú', ['tumbes', 'piura', 'lambayeque', 'la libertad', 'cajamarca', 'ancash']],
    'sur del peru': ['el sur del Perú', ['ica', 'arequipa', 'moquegua', 'tacna', 'puno', 'cusco', 'apurimac', 'ayacucho']], 'en el sur': ['el sur del Perú', ['ica', 'arequipa', 'moquegua', 'tacna', 'puno', 'cusco', 'apurimac', 'ayacucho']],
    'selva': ['la selva', ['loreto', 'ucayali', 'san martin', 'madre de dios', 'amazonas']], 'oriente': ['la selva', ['loreto', 'ucayali', 'san martin', 'madre de dios', 'amazonas']],
    'centro del peru': ['el centro del Perú', ['junin', 'pasco', 'huanuco', 'huancavelica', 'ayacucho']], 'sierra central': ['el centro del Perú', ['junin', 'pasco', 'huanuco', 'huancavelica', 'ayacucho']]
  };
  var DIST = {}, CALL = {};
  Object.keys(ZONAS).forEach(function (z) { ZONAS[z][1].forEach(function (d) { DIST[norm(d)] = { n: d, zona: z }; }); });
  DIST.lurigancho.n = 'Lurigancho (Chosica)';
  CALLAO.forEach(function (d) { CALL[norm(d)] = d; });

  /* ================= utilidades ================= */
  function norm(t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function limpio(t) { return norm(t).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(t) { var m = String(t).match(/[\d,]+(?:\.\d+)?/); return m ? parseFloat(m[0].replace(/,/g, '')) : null; }
  function area(r) { var t = r[2] + ' ' + (r[14] || ''), m = t.match(/([\d,]+(?:\.\d+)?)\s*m(?:²|2)(?![\d])/i); if (m) return parseFloat(m[1].replace(/,/g, '')); m = t.match(/(?:area\s*)?(?:ha|has|hás)\.?\s*:?\s*([\d.]+)/i) || t.match(/([\d.]+)\s*(?:ha|has|hás)\b/i); var v = m ? parseFloat(m[1]) : NaN; return v > 0 ? Math.round(v * 10000) : null; }
  function tipo(r) { var t = norm(r[2]); if (/^(casa|vivienda)/.test(t)) return 'casa'; if (/departamento|dpto|duplex/.test(t)) return 'departamento'; if (/^(local|tienda|oficina)/.test(t)) return 'local'; if (/terreno|lote|fraccion|predio|parcela/.test(t)) return 'terreno'; if (/estacionamiento|cochera/.test(t)) return 'estacionamiento'; return 'otro'; }
  function mon(r) { return r[3].indexOf('US$') === 0 ? 'US$' : 'S/'; }
  function link(r) { return BASE + r[4] + '/#r' + r[0]; }
  function fdate(f) { var m = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'], p = f.split('-'); return parseInt(p[2], 10) + ' de ' + m[parseInt(p[1], 10) - 1]; }
  function money(r) { return r[3].replace(/\.00$/, ''); }
  function nf(n) { return Math.round(n).toLocaleString('en-US'); }
  function wa(texto) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto); }
  function clon(o) { return JSON.parse(JSON.stringify(o)); }
  var PL = { casa: 'casas', departamento: 'departamentos', terreno: 'terrenos', local: 'locales comerciales', estacionamiento: 'estacionamientos', otro: 'otros inmuebles' };

  /* ================= servicios (precios definidos por Víctor, 19/11/2026) ================= */
  var SERV = [
    { id: 'consulta', n: 'Consulta personalizada', p: 'S/ 119.90', d: 'Conversación con Víctor Ventura sobre el remate. Incluye el informe del expediente judicial y el de la partida electrónica.', inc: 'Incluye informe del expediente y de la partida' },
    { id: 'partida', n: 'Revisión e informe de la partida electrónica', p: 'S/ 79.90', d: 'Informe escrito de la partida registral del predio: titularidad, cargas y gravámenes inscritos.' },
    { id: 'expediente', n: 'Información detallada del expediente judicial', p: 'S/ 59.90', d: 'Estado y datos relevantes del expediente del que proviene el remate.' }
  ];
  // x = { n: N.° de remate, exp: expediente judicial, par: partida electrónica, desc: ubicación e inmueble }
  function servWa(sv, x) {
    x = x || {};
    var t = 'Hola Víctor, quiero el servicio «' + sv.n + '» (' + sv.p + ').';
    if (!x.n) return wa(t + '\nRemate N.°: ');
    t += '\nRemate N.°: ' + x.n + (x.desc ? ' (' + x.desc + ')' : '');
    if (sv.id !== 'partida') t += '\nExpediente judicial: ' + (x.exp || 'no figura en la ficha');
    if (sv.id !== 'expediente') t += '\nPartida electrónica: ' + (x.par || 'no figura en la ficha');
    return wa(t);
  }
  function servHtml(x) {
    return SERV.map(function (sv) { return '<a class="rv-sv" target="_blank" rel="noopener" href="' + servWa(sv, x) + '"><span><b>' + esc(sv.n) + '</b>' + (sv.inc ? '<i>' + esc(sv.inc) + '</i>' : '') + '<small>' + esc(sv.d) + '</small></span><em>' + sv.p + '</em></a>'; }).join('');
  }
  function datosRemate(r) { return { n: r[0], exp: r[11], par: r[10], desc: r[1] + ', ' + r[2] }; }
  var SERV_NOTA = 'Precio por cada remate. Se coordina y se paga directamente con Víctor Ventura por WhatsApp. Son servicios de información y orientación: no garantizan el resultado del remate.';
  var SERV_CSS = '.rv-sv{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;margin-top:6px;border:1px solid #25a244;border-left:4px solid #25a244;background:#fff;color:#0E1216;text-decoration:none;font:14px/1.3 Inter,system-ui,sans-serif}.rv-sv:hover{background:#F0FAF3}.rv-sv b{display:block;font-weight:600;font-size:13.5px}.rv-sv small{display:block;color:#5A6470;font-size:12px;margin-top:2px}.rv-sv em{font-style:normal;font-weight:600;color:#1b7a34;white-space:nowrap;font-size:14.5px}.rv-sv i{display:block;font-style:normal;font-size:12px;color:#1b7a34;font-weight:600;margin-top:2px}.rv-box{margin-top:auto;padding-top:10px}.rv-dd>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;background:#25a244;color:#fff;font-weight:600;font-size:14px;padding:12px 14px}.rv-dd>summary::-webkit-details-marker{display:none}.rv-dd>summary:after{content:"";width:9px;height:9px;border-right:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(45deg);margin-top:-4px;transition:transform .2s;flex:none}.rv-dd[open]>summary:after{transform:rotate(-135deg);margin-top:4px}.rv-dd>summary:hover{background:#1f8f3b}.rv-dd small.rv-h{display:block;font-size:11.5px;font-weight:500;opacity:.92}.rv-box .rv-g{display:block;text-align:center;margin-top:8px;font-size:13px;color:#20397A;font-weight:600}.rv-box .rv-sv small{display:none}.rv-sec{margin-top:36px}.rv-sec h2{font-family:Newsreader,Georgia,serif;font-weight:500;font-size:26px;border-top:2px solid #0E1216;padding-top:10px;margin:0 0 6px}.rv-sec .rv-gr{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.rv-sec .rv-sv{margin:0;flex-direction:column;align-items:flex-start;padding:14px 16px}.rv-sec .rv-sv em{font-size:20px;font-family:Newsreader,Georgia,serif}.rv-sec p.rv-n{font-size:12.5px;color:#5A6470;margin:10px 0 0}.rb-r .rv-sv{border-radius:8px}@media print{.rv-box,.rv-sec{display:none}}';
  // Servicios en cada ficha de remate y sección general en la página
  function pagina() {
    var st = document.createElement('style'); st.textContent = SERV_CSS; document.head.appendChild(st);
    [].forEach.call(document.querySelectorAll('article.card[id^="r"]'), function (c) {
      if (c.querySelector('.rv-box')) return;
      var n = c.id.slice(1), l = c.querySelector('a.wa'), cl = c.querySelector('.cl'), h = c.querySelector('h3'), cx = c.querySelector('.cx');
      var tx = cx ? cx.textContent : '', par = tx.match(/Partida\s+(\S+)/), exp = tx.match(/Exp\.\s+(\S+)/);
      var x = { n: n, par: par ? par[1] : '', exp: exp ? exp[1] : '', desc: [cl ? cl.textContent.trim() : '', h ? h.textContent.trim() : ''].filter(Boolean).join(', ') };
      var b = document.createElement('div'); b.className = 'rv-box';
      b.innerHTML = '<details class="rv-dd"><summary><span>Servicios para el remate ' + esc(n) + '</span></summary>' + servHtml(x) + '</details>';
      if (l) { l.className = 'rv-g'; l.textContent = 'Otra consulta sobre el remate ' + n; l.target = '_blank'; l.rel = 'noopener'; c.insertBefore(b, l); b.appendChild(l); } else c.appendChild(b);
    });
    var main = document.querySelector('main');
    if (main && !document.querySelector('.rv-sec')) {
      var sec = document.createElement('section'); sec.className = 'rv-sec'; sec.id = 'servicios';
      var hayFichas = !!document.querySelector('article.card[id^="r"]');
      sec.innerHTML = '<h2>Servicios de apoyo para tu remate</h2><p class="note" style="margin:0 0 12px;color:#444C55;font-size:14px">' + (hayFichas ? 'Elige el servicio dentro de la ficha del remate que te interesa, o pídelo aquí e indícanos el número de remate.' : 'Pide el servicio e indícanos el número del remate que te interesa.') + '</p><div class="rv-gr">' + servHtml() + '</div><p class="rv-n">' + SERV_NOTA + '</p>';
      var w = main.querySelector('.w') || main; w.appendChild(sec);
    }
  }

  /* ================= datos ================= */
  function geo(r) {
    var parts = r[1].split(/[,()]/).map(limpio).filter(Boolean), dep = null, i;
    for (i = parts.length - 1; i >= 0 && !dep; i--) { var p = ALIAS_DEP[parts[i]] || parts[i]; if (DEPS[p] && !(i === 0 && parts.length === 1 && DIST[p])) dep = p; }
    var g = { parts: parts, dep: dep, metro: false, zona: null, dist: null };
    if (!dep) { if (DIST[parts[0]]) dep = 'lima'; else if (CALL[parts[0]]) dep = 'callao'; g.dep = dep; }
    if (dep === 'lima' && DIST[parts[0]]) { g.metro = true; g.dist = parts[0]; g.zona = DIST[parts[0]].zona; }
    if (dep === 'lima' && parts[0] === 'lima' && parts.length === 1) { g.metro = true; g.dist = 'cercado de lima'; g.zona = 'lima centro'; }
    return g;
  }
  function hoyLima() { var d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' })); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function tc(t) { return t.replace(/(^|[\s(,])([a-záéíóúñ])/g, function (m, a, c) { return a + c.toUpperCase(); }).replace(/\b(De|Del|La|Las|Los|El|Y)\b/g, function (w, _, i) { return i ? w.toLowerCase() : w; }); }
  // Ubicación de un inmueble de SUNAT a partir de su descripción (la sede que remata puede estar en otra ciudad)
  function ubicSunat(tit, region) {
    var t = ' ' + limpio(tit) + ' ', rk = limpio(region), L = 'A-Za-zÁÉÍÓÚÑáéíóúñ';
    var md = tit.match(new RegExp('distrito de ([' + L + ' ]+?)(?=,|;|\\.| provincia| y | del | departamento|$)', 'i')), mp = tit.match(new RegExp('provincia de ([' + L + ' ]+?)(?=,|;|\\.| y | departamento|$)', 'i'));
    var dist = md ? md[1].trim().toLowerCase() : '', prov = mp ? mp[1].trim().toLowerCase() : '';
    if (limpio(dist) === rk) dist = ''; if (limpio(prov) === rk && rk !== 'lima') prov = '';
    if (rk === 'lima') {
      if (prov && limpio(prov) !== 'lima') return tc((dist ? dist + ', ' : '') + prov) + ' (Lima)';
      var best = ''; Object.keys(DIST).forEach(function (k) { if (t.indexOf(' ' + k + ' ') >= 0 && k.length > best.length) best = k; });
      return best ? DIST[best].n + ', Lima' : 'Lima';
    }
    var parts = [dist, prov].filter(function (x) { return x && limpio(x) !== rk; });
    if (parts.length) return tc(parts.join(', ')) + ' (' + region + ')';
    var city = ''; (CIUDADES[rk] || []).forEach(function (c) { if (!city && t.indexOf(' ' + limpio(c) + ' ') >= 0) city = c; });
    return city ? city + ' (' + region + ')' : region;
  }
  function mapSunat(js) {
    if (!js || !js.remates) return []; var hoy = hoyLima();
    return js.remates.filter(function (x) { return x.fecha >= hoy; }).map(function (x) {
      var t = norm(x.titulo), tp = x.tipo;
      if (tp === 'Inmueble') tp = /construccion|pisos|niveles|vivienda|\bcasa\b/.test(t) ? 'Casa o predio con construcción' : 'Inmueble';
      if (tp === 'Local u oficina') tp = /oficina/.test(t) ? 'Oficina' : /almacen/.test(t) ? 'Local (almacén)' : 'Local comercial';
      var f2 = function (v) { return v ? 'S/ ' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''; };
      return ['S' + x.id, ubicSunat(x.titulo, x.region), tp, f2(x.base), x.fecha, 1, f2(x.tasacion), '', '', '', x.partida || '', '', '', x.cargas || '', x.titulo, 'sunat',
        { n: x.id, url: x.url, hora: x.hora, conv: x.convocatoria, acc: x.acciones, obs: x.obs, local: x.local }];
    });
  }
  function mapIndecopi(js) {
    if (!js || !js.proximos) return []; var hoy = hoyLima(), out = [];
    js.proximos.filter(function (p) { return p.fecha_remate >= hoy; }).forEach(function (p) {
      (p.items || []).forEach(function (it, k) {
        out.push(['I' + p.fecha_remate + '-' + (it.n || k + 1), it.region || p.zona || '', it.tipo || 'Inmueble', it.base || '', p.fecha_remate, 1, it.tasacion || '', '', '', '', it.partida || '', '', '', it.cargas || '', it.titulo || '', 'indecopi',
          { n: it.n || k + 1, url: p.url, pdf: p.pdf_local || p.pdf, com: p.fecha_comunicacion, conv: p.convocatoria }]);
      });
    });
    return out;
  }
  function term(k, o) { if (!DIC[k]) DIC[k] = o; }
  function load() {
    if (ready) return ready;
    function opc(u) { return fetch(BASE + u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
    ready = Promise.all([fetch(BASE + 'remates.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }), opc('otros/sunat.json'), opc('otros/indecopi.json')]).then(function (A) {
      var d = A[0]; D = d; DIC = {};
      D.sunat = mapSunat(A[1]); D.inde = mapIndecopi(A[2]); D.indeInfo = A[2] || null; D.sunatInfo = A[1] || null;
      D.todos = d.remates.concat(D.sunat, D.inde);
      // 1) zonas y Lima
      Object.keys(ZONAS).forEach(function (z) { term(z, { k: 'zona', key: z, n: ZONAS[z][0] }); });
      Object.keys(ALIAS_ZONA).forEach(function (a) { var z = ALIAS_ZONA[a]; term(a, { k: 'zona', key: z, n: ZONAS[z][0] }); });
      term('lima metropolitana', { k: 'metro', key: 'metro', n: 'Lima Metropolitana' }); term('lima', { k: 'metro', key: 'metro', n: 'Lima Metropolitana' });
      ['lima provincias', 'region lima', 'departamento de lima', 'norte chico', 'sur chico'].forEach(function (a) { term(a, { k: 'limaprov', key: 'limaprov', n: 'Lima provincias' }); });
      term('provincias', { k: 'prov', key: 'prov', n: 'provincias (fuera de Lima y Callao)' }); term('provincia', { k: 'prov', key: 'prov', n: 'provincias (fuera de Lima y Callao)' });
      // 2) distritos de Lima Metropolitana y Callao
      Object.keys(DIST).forEach(function (k) { term(k, { k: 'dist', key: k, n: DIST[k].n, zona: DIST[k].zona }); });
      Object.keys(ALIAS_DIST).forEach(function (a) { var k = ALIAS_DIST[a]; if (DIST[k]) term(a, { k: 'dist', key: k, n: DIST[k].n, zona: DIST[k].zona }); else if (CALL[k]) term(a, { k: 'calld', key: k, n: CALL[k] }); });
      Object.keys(CALL).forEach(function (k) { term(k, { k: 'calld', key: k, n: CALL[k] }); });
      // 3) departamentos, macrorregiones y ciudades conocidas
      Object.keys(DEPS).forEach(function (k) { term(k, { k: 'dep', key: k, n: DEPS[k][0] }); });
      Object.keys(ALIAS_DEP).forEach(function (a) { var k = ALIAS_DEP[a]; term(a, { k: 'dep', key: k, n: DEPS[k][0] }); });
      Object.keys(MACROS).forEach(function (k) { term(k, { k: 'macro', key: k, n: MACROS[k][0], deps: MACROS[k][1] }); });
      Object.keys(CIUDADES).forEach(function (dep) { CIUDADES[dep].forEach(function (c) { term(norm(c), { k: 'ciudad', key: limpio(c), n: c, dep: dep }); }); });
      // 4) lo que aparece en los propios remates
      D.todos.forEach(function (r) {
        var g = geo(r); G[r[0]] = g;
        r[1].split(/[,()]/).forEach(function (raw) { var k = limpio(raw); if (k.length > 2 && g.dep) term(k, { k: 'ciudad', key: k, n: raw.trim(), dep: g.dep }); });
      });
      TERMS = Object.keys(DIC).sort(function (a, b) { return b.length - a.length; });
      D.ult = d.ediciones.map(function (e) { return e.fecha; }).sort().pop();
      return D;
    });
    return ready;
  }

  /* ================= lugares ================= */
  function enLugar(r, pl) {
    var g = G[r[0]]; if (!g) return false;
    switch (pl.k) {
      case 'dist': return g.metro && g.dist === pl.key;
      case 'calld': return g.dep === 'callao' && g.parts.indexOf(pl.key) >= 0;
      case 'zona': return g.metro && g.zona === pl.key;
      case 'metro': return g.metro;
      case 'limaprov': return g.dep === 'lima' && !g.metro;
      case 'prov': return !!g.dep && !g.metro && g.dep !== 'callao';
      case 'dep': return g.dep === pl.key;
      case 'macro': return pl.deps.indexOf(g.dep) >= 0;
      default: return g.parts.some(function (p) { return p === pl.key || (' ' + p + ' ').indexOf(' ' + pl.key + ' ') >= 0; }) && (!pl.dep || g.dep === pl.dep);
    }
  }
  function vecinos(dep) { return (DEPS[dep] ? DEPS[dep][1] : []); }
  // niveles de aproximación: de lo más cercano a lo más amplio
  function niveles(pl) {
    var L = [];
    function metroCallao(r) { var g = G[r[0]]; return g.metro || g.dep === 'callao'; }
    function enDeps(ds) { return function (r) { return ds.indexOf(G[r[0]].dep) >= 0; }; }
    if (pl.k === 'dist') {
      L.push({ t: function (r) { var g = G[r[0]]; return g.metro && g.zona === pl.zona; }, l: 'en distritos de la misma zona (' + ZONAS[pl.zona][0] + ')' });
      L.push({ t: metroCallao, l: 'en otros distritos de Lima Metropolitana y el Callao' });
    } else if (pl.k === 'calld') {
      L.push({ t: enDeps(['callao']), l: 'en otros distritos del Callao' }); L.push({ t: metroCallao, l: 'en Lima Metropolitana' });
    } else if (pl.k === 'zona') {
      L.push({ t: metroCallao, l: 'en otras zonas de Lima Metropolitana y el Callao' });
    } else if (pl.k === 'metro') {
      L.push({ t: enDeps(['lima', 'callao']), l: 'en el Callao y en provincias de la región Lima' });
    } else if (pl.k === 'limaprov') {
      L.push({ t: enDeps(['lima', 'callao']), l: 'en Lima Metropolitana y el Callao' });
    } else if (pl.k === 'ciudad' && pl.dep) {
      if (pl.dep === 'lima') L.push({ t: function (r) { var g = G[r[0]]; return g.dep === 'lima' && !g.metro; }, l: 'en otras localidades de Lima provincias' });
      L.push({ t: enDeps([pl.dep]), l: 'en otras localidades de ' + DEPS[pl.dep][0] });
      L.push({ t: enDeps(vecinos(pl.dep)), l: 'en regiones vecinas', v: vecinos(pl.dep) });
    } else if (pl.k === 'dep') {
      L.push({ t: enDeps(vecinos(pl.key)), l: 'en regiones vecinas', v: vecinos(pl.key) });
    }
    return L;
  }
  function explica(pl) {
    if (pl.k === 'dist') return esc(pl.n) + ' es un distrito de Lima Metropolitana (' + ZONAS[pl.zona][0] + ')';
    if (pl.k === 'calld') return esc(pl.n) + ' es un distrito del Callao';
    if (pl.k === 'zona') return esc(pl.n) + ' agrupa a ' + ZONAS[pl.key][1].slice(0, 4).join(', ') + ' y otros distritos';
    if (pl.k === 'ciudad' && pl.dep && limpio(pl.n) !== pl.dep) return esc(pl.n) + ' está en ' + (pl.dep === 'lima' ? 'la región Lima' : DEPS[pl.dep][0]);
    return '';
  }
  function nombreLugar(f) { return f.lug.map(function (p) { return p.n; }).join(' o '); }

  /* ================= interpretación del mensaje ================= */
  function pn(a, u) {
    a = String(a).replace(/,(?=\d{3}\b)/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
    var n = parseFloat(a); if (isNaN(n)) return null; u = u || '';
    if (/^(mil|k)/.test(u)) n *= 1000; else if (/^mill/.test(u)) n *= 1000000; else if (/^(lucas|palos)/.test(u)) n *= (u.charAt(0) === 'l' ? 1000 : 1000000);
    return n;
  }
  function parse(txt) {
    var m = ' ' + norm(txt).replace(/m²/g, 'm2') + ' ', o = {}, mm;
    m = m.replace(/medio millon/g, '500 mil').replace(/un millon/g, '1 millon').replace(/\bcien mil\b/g, '100 mil').replace(/\bcincuenta mil\b/g, '50 mil').replace(/\bdoscientos mil\b/g, '200 mil');
    // área
    mm = m.match(/(\d[\d.,]*)\s*(m2|mts2|mt2|metros cuadrados|metros|mts)\b/);
    if (mm) { o.area = pn(mm[1]); m = m.replace(mm[0], ' '); }
    var ha = m.match(/(\d[\d.,]*)\s*(hectareas?|has?)\b/); if (ha) { o.area = pn(ha[1]) * 10000; m = m.replace(ha[0], ' '); }
    // moneda
    if (/(dolar|dolares|usd|us\$|\$)/.test(m.replace(/s\/\s*\$?/g, ' '))) o.mon = 'US$'; else if (/(\bsol\b|\bsoles\b|s\/)/.test(m)) o.mon = 'S/';
    // N.° de remate (solo si el mensaje es básicamente el número)
    var nr = m.match(/\b(2\d{4})\b/);
    if (nr && !o.mon && !/\b(mil|hasta|desde|presupuesto|tengo|entre)\b/.test(m) && (/remate|numero|nro|n°|ficha|detalle/.test(m) || limpio(m).replace(nr[1], '').trim().split(' ').filter(Boolean).length <= 2)) { o.n = nr[1]; m = m.replace(nr[0], ' '); }
    // precio
    var U = '(mil|k|millones|millon|lucas|palos)?', N = '(\\d[\\d.,]*)', C = '(?:de\\s*)?(?:us\\$|s\\/|\\$)?\\s*';
    var rg = m.match(new RegExp('(?:entre|de)\\s*' + C + N + '\\s*' + U + '\\s*(?:y|a|hasta)\\s*' + C + N + '\\s*' + U));
    if (rg && pn(rg[3], rg[4]) > pn(rg[1], rg[2] || rg[4])) { o.min = pn(rg[1], rg[2] || rg[4]); o.max = pn(rg[3], rg[4]); m = m.replace(rg[0], ' '); }
    else {
      var ap = m.match(new RegExp('(?:alrededor de|aproximadamente|aprox\\.?|cerca de|mas o menos|unos|como)\\s*' + C + N + '\\s*' + U));
      var mx = m.match(new RegExp('(?:hasta|menos de|maximo|max|no mas de|por debajo de|bajo|presupuesto(?: es)?(?: de)?|tengo|cuento con|dispongo de|me alcanza(?: para)?|tope de)\\s*(?:solo\\s*)?(?:unos\\s*)?' + C + N + '\\s*' + U));
      var mi = m.match(new RegExp('(?:desde|mas de|minimo|min|mayor a|mayor de|por encima de|a partir de)\\s*' + C + N + '\\s*' + U));
      if (ap && !mx) { var v = pn(ap[1], ap[2]); if (v >= 1000) { o.min = v * 0.75; o.max = v * 1.25; o.aprox = v; m = m.replace(ap[0], ' '); } }
      if (mx && pn(mx[1], mx[2]) >= 1000) { o.max = pn(mx[1], mx[2]); m = m.replace(mx[0], ' '); }
      if (mi && pn(mi[1], mi[2]) >= 1000) { o.min = pn(mi[1], mi[2]); m = m.replace(mi[0], ' '); }
      if (o.max == null && o.min == null) {
        var b = m.match(new RegExp(N + '\\s*' + U + '\\s*(?:de\\s*)?(?:dolares|usd|soles|sol\\b|us\\$|s\\/)')) || m.match(new RegExp('(?:us\\$|s\\/|\\$)\\s*' + N + '\\s*' + U)) || m.match(new RegExp(N + '\\s*(mil|k|millones|millon|lucas|palos)\\b'));
        if (b && pn(b[1], b[2]) >= 1000) { o.max = pn(b[1], b[2]); o.maxImplicito = true; m = m.replace(b[0], ' '); }
      }
    }
    // tipo (puede ser más de uno) y contexto de uso
    var T = [];
    if (/\b(casas?|viviendas?|chalet|casita)\b/.test(m)) T.push('casa');
    if (/\b(departamentos?|dptos?|depas?|deptos?|duplex|flat|minidepartamento)\b/.test(m)) T.push('departamento');
    if (/\b(terrenos?|lotes?|parcelas?|solares?|predios?|chacras?|fundo)\b/.test(m)) T.push('terreno');
    if (/\b(local(es)?|tiendas?|oficinas?|comercial(es)?|galeria|stands?|almacen(es)?)\b/.test(m)) T.push('local');
    if (/\b(estacionamientos?|cocheras?|garaje)\b/.test(m)) T.push('estacionamiento');
    if (!T.length) {
      if (/para vivir|donde vivir|mi familia|mudarme|mudarnos|primera vivienda|un hogar|algo para vivir/.test(m)) { T = ['casa', 'departamento']; o.uso = 'para vivir'; }
      else if (/para (mi |un |el )?negocio|para (poner|abrir)|emprendimiento/.test(m)) { T = ['local']; o.uso = 'para un negocio'; }
      else if (/para construir|para (un )?proyecto|edificar|para sembrar|agricola|de campo/.test(m)) { T = ['terreno']; o.uso = 'para construir o sembrar'; }
    }
    if (T.length) o.tipo = T;
    // cargas y orden
    if (/(sin|libres? de|limpi[oa]s? de|sin ninguna)\s*(cargas?|hipotecas?|embargos?|gravamen(es)?|deudas?|problemas)|sanead[oa]s?/.test(m)) o.sc = true;
    if (/barat|econom|menor (precio|base)|mas bajo|ganga|oportunidad|remate[s]? bajo|lo minimo/.test(m)) o.ord = 'asc';
    else if (/mas car[oa]|mayor (precio|base)|mas costos|de lujo|exclusiv/.test(m)) o.ord = 'desc';
    else if (/mas grande|mayor area|area mayor|mas ampli|mas extens/.test(m)) o.ord = 'area';
    // lugar
    var p = ' ' + limpio(m) + ' ', lug = [];
    for (var i = 0; i < TERMS.length; i++) {
      var t = TERMS[i], ix = p.indexOf(' ' + t + ' ');
      if (ix < 0) continue;
      if ((t === 'ate' || t === 'santa' || t === 'comas' || t === 'asia') && !new RegExp('(en|de|por|distrito|zona) ' + t + ' ').test(p) && p.trim() !== t) continue;
      if (t === 'provincia' && /provincia de/.test(p)) continue;
      var pl = DIC[t];
      if (!lug.some(function (x) { return x.k === pl.k && x.key === pl.key; })) lug.push({ k: pl.k, key: pl.key, n: pl.n, zona: pl.zona, dep: pl.dep, deps: pl.deps });
      p = p.replace(' ' + t + ' ', '  #  ');
    }
    if (lug.length) o.lug = lug;
    if (/\bsunat\b|tributari/.test(m)) o.src = 'sunat'; else if (/indecopi/.test(m)) o.src = 'indecopi'; else if (/remaju|poder judicial|judiciales/.test(m)) o.src = 'pj';
    if (/todas las (entidades|fuentes)|de todos|todas las instituciones/.test(m)) o.todas = true;
    o.generico = /\b(busco|buscando|quiero|quisiera|necesito|me interesa|hay|tienes|tienen|propiedad(es)?|inmuebles?|comprar|invertir|inversion|algo)\b/.test(m);
    return o;
  }
  function tiene(o) { return o.lug || o.tipo || o.mon || o.min != null || o.max != null || o.area != null || o.sc || o.ord || o.src; }

  /* ================= búsqueda ================= */
  function coincide(r, f, scope) {
    if (f.src && src(r) !== f.src) return false;
    if (f.tipo && f.tipo.length) { var tr = tipo(r); if (f.tipo.indexOf(tr) < 0 && !(tr === 'otro' && src(r) !== 'pj' && f.tipo.indexOf('casa') >= 0)) return false; }
    if (f.mon && mon(r) !== f.mon) return false;
    var b = num(r[3]);
    if (f.min != null && (b === null || b < f.min)) return false;
    if (f.max != null && (b === null || b > f.max)) return false;
    if (f.area != null) { var a = area(r); if (a === null || a < f.area) return false; }
    if (f.sc && !/ninguna declarada/i.test(r[13] || '')) return false;
    if (scope) return scope(r);
    if (f.lug && f.lug.length && !f.lug.some(function (pl) { return enLugar(r, pl); })) return false;
    return true;
  }
  function buscar(f, scope) {
    var out = D.todos.filter(function (r) { return coincide(r, f, scope); }), ord = f.ord || 'rec';
    out.sort(function (x, y) {
      if (ord === 'asc') return (num(x[3]) || 0) - (num(y[3]) || 0);
      if (ord === 'desc') return (num(y[3]) || 0) - (num(x[3]) || 0);
      if (ord === 'area') return (area(y) || 0) - (area(x) || 0);
      return x[4] < y[4] ? 1 : x[4] > y[4] ? -1 : (num(x[3]) || 0) - (num(y[3]) || 0);
    });
    return out;
  }
  function que(f) { return f.tipo && f.tipo.length ? f.tipo.map(function (t) { return PL[t]; }).join(' o ') : 'propiedades'; }
  function precioTxt(f) {
    var c = f.mon ? f.mon + ' ' : '', p = [];
    if (f.min != null && f.max != null) p.push('con base entre ' + c + nf(f.min) + ' y ' + c + nf(f.max));
    else if (f.max != null) p.push('con base hasta ' + c + nf(f.max));
    else if (f.min != null) p.push('con base desde ' + c + nf(f.min));
    else if (f.mon) p.push('con base en ' + (f.mon === 'US$' ? 'dólares' : 'soles'));
    if (f.area != null) p.push('de ' + nf(f.area) + ' m² o más');
    if (f.sc) p.push('sin cargas declaradas');
    return p.join(', ');
  }
  function nomFuente(k) { for (var i = 0; i < FUENTES.length; i++) if (FUENTES[i][0] === k) return FUENTES[i][1]; return ''; }
  function resumenFiltro(f) { return [que(f), f.src ? 'de ' + nomFuente(f.src) : '', f.lug ? 'en ' + nombreLugar(f) : '', precioTxt(f)].filter(Boolean).join(' '); }

  /* ================= interfaz ================= */
  function css() {
    var s = document.createElement('style');
    s.textContent = '.rb-l{position:fixed;right:16px;bottom:16px;z-index:55;display:flex;align-items:center;gap:0;cursor:pointer;border:0;background:none;padding:0;font-family:Inter,system-ui,sans-serif}.rb-av{position:relative;z-index:1;width:124px;height:124px;flex:none}.rb-av:before,.rb-av:after{content:"";position:absolute;left:50%;top:54%;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:radial-gradient(circle,rgba(255,159,28,.55),rgba(255,159,28,0) 70%);animation:rbp 2.4s ease-out infinite}.rb-av:after{animation-delay:1.2s}@keyframes rbp{0%{transform:scale(.7);opacity:.9}100%{transform:scale(1.7);opacity:0}}.rb-av img{position:relative;z-index:1;width:124px;height:124px;filter:drop-shadow(0 8px 12px rgba(0,0,0,.4));animation:rbf 3s ease-in-out infinite,rbw 7s ease-in-out infinite;transform-origin:50% 90%}@keyframes rbf{50%{translate:0 -8px}}@keyframes rbw{0%,82%,100%{rotate:0deg}86%{rotate:-9deg}90%{rotate:8deg}94%{rotate:-5deg}}.rb-dot{position:absolute;z-index:2;right:14px;top:10px;min-width:24px;height:24px;border-radius:12px;background:#E5352B;color:#fff;font:700 13px/24px Inter,system-ui,sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)}.rb-b{background:#FF9F1C;color:#14213D;border-radius:30px;padding:13px 34px 13px 22px;margin-right:-26px;box-shadow:0 6px 18px rgba(0,0,0,.32);text-align:left;line-height:1.25;border:2px solid #fff}.rb-b small{display:block;font-size:12.5px;font-weight:600;opacity:.85}.rb-b b{display:block;font-size:17px;font-weight:700}.rb-l:hover .rb-b{background:#FFB347}.rb-l:hover .rb-av img{scale:1.06}@media(max-width:520px){.rb-l{right:8px;bottom:10px}.rb-av,.rb-av img{width:96px;height:96px}.rb-b{padding:10px 28px 10px 16px;margin-right:-22px}.rb-b b{font-size:15px}.rb-b small{font-size:11.5px}}@media(prefers-reduced-motion:reduce){.rb-av img,.rb-av:before,.rb-av:after{animation:none}}.rb-p{position:fixed;right:14px;bottom:14px;z-index:70;width:min(400px,calc(100vw - 28px));height:min(600px,calc(100vh - 28px));background:#fff;border:1px solid #C3C9D4;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.35);display:none;flex-direction:column;overflow:hidden;font:14px/1.45 Inter,system-ui,sans-serif;color:#0E1216}.rb-p.on{display:flex}.rb-h{background:linear-gradient(135deg,#20397A,#2A4A9C);color:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px}.rb-h img{width:44px;height:44px;background:#fff;border-radius:50%;padding:3px}.rb-h b{display:block;font-size:15px}.rb-h span{font-size:11.5px;opacity:.9}.rb-x{margin-left:auto;background:none;border:0;color:#fff;font-size:24px;cursor:pointer;line-height:1}.rb-m{flex:1;overflow-y:auto;padding:12px;background:#F2F5FB;display:flex;flex-direction:column;gap:8px}.rb-r,.rb-u{max-width:90%;padding:9px 12px;border-radius:14px;word-wrap:break-word}.rb-r{background:#fff;border:1px solid #DFE3EA;align-self:flex-start;border-bottom-left-radius:4px}.rb-r.rb-s{background:#E5EAF6;border-color:#C9D3EC;color:#20397A;font-style:italic}.rb-u{background:#2A4A9C;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}.rb-r a{color:#20397A;font-weight:600}.rb-it{border:1px solid #DFE3EA;border-left:3px solid #5C78C0;background:#fff;padding:8px 10px;margin:6px 0;border-radius:6px;font-size:13px}.rb-it b{color:#20397A}.rb-it .t{font-size:15px;font-weight:600}.rb-it .z{display:flex;gap:10px;margin-top:4px;flex-wrap:wrap}.rb-it .z a{font-size:12.5px}.rb-g{margin:12px 0 2px;padding:6px 10px;border-radius:8px;font-weight:700;font-size:13px;color:#fff;background:#20397A;display:flex;justify-content:space-between;align-items:center}.rb-g.s{background:#0B6B4F}.rb-g.i{background:#7A3E00}.rb-g small{font-weight:600;opacity:.9}.rb-it.s{border-left-color:#0B6B4F}.rb-it.i{border-left-color:#B25E00}.rb-ch{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px;background:#F2F5FB}.rb-ch button{border:1px solid #2A4A9C;color:#2A4A9C;background:#fff;border-radius:16px;padding:5px 11px;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer}.rb-ch button:hover{background:#E5EAF6}.rb-f{display:flex;gap:6px;padding:8px;border-top:1px solid #DFE3EA;background:#fff}.rb-f input{flex:1;padding:10px 12px;border:1px solid #C3C9D4;border-radius:20px;font:inherit;min-width:0}.rb-f button{background:#2A4A9C;color:#fff;border:0;border-radius:20px;padding:0 16px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}.rb-n{font-size:11px;color:#5A6470;padding:0 12px 8px;background:#fff;text-align:center}.rb-d{display:inline-block;width:6px;height:6px;border-radius:50%;background:#8FA4D8;margin:0 2px;animation:rbd 1s infinite}.rb-d:nth-child(2){animation-delay:.2s}.rb-d:nth-child(3){animation-delay:.4s}@keyframes rbd{50%{opacity:.25}}@media print{.rb-l,.rb-p{display:none}}';
    document.head.appendChild(s);
  }
  function guardar() {
    try { sessionStorage.setItem(SS, JSON.stringify({ h: els.m.innerHTML, c: els.chips || [], F: F, ids: last ? last.map(function (r) { return r[0]; }) : null, lg: LG ? { pj: LG.pj.map(function (r) { return r[0]; }), sunat: LG.sunat.map(function (r) { return r[0]; }), indecopi: LG.indecopi.map(function (r) { return r[0]; }) } : null, sh: SH, shown: shown, open: !!els.abierto })); } catch (e) { }
  }
  function build() {
    css();
    var l = document.createElement('button'); l.className = 'rb-l'; l.setAttribute('aria-label', 'Conversar con Robotín, asistente de remates');
    l.innerHTML = '<span class="rb-b"><small>¿Buscas un remate?</small><b>Conversa con Robotín</b></span><span class="rb-av"><img src="' + BASE + 'robotin/robotin.png" alt="" width="124" height="124"><span class="rb-dot" id="rb-dot">1</span></span>';
    document.body.appendChild(l); els.l = l;
    var p = document.createElement('div'); p.className = 'rb-p'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Chat con Robotín');
    p.innerHTML = '<div class="rb-h"><img src="' + BASE + 'robotin/robotin-s.png" alt=""><div><b>Robotín</b><span>Asistente de remates · Poder Judicial, SUNAT e INDECOPI</span></div><button class="rb-x" aria-label="Cerrar">×</button></div><div class="rb-m" id="rb-m" aria-live="polite"></div><div class="rb-ch" id="rb-ch"></div><form class="rb-f"><input id="rb-i" type="text" placeholder="Ej.: busco propiedades en Lince" autocomplete="off" aria-label="Escribe tu consulta"><button type="submit">Enviar</button></form><div class="rb-n">Respuestas automáticas con datos de REMAJU, SUNAT e INDECOPI. Referencial, no es asesoría legal. Lo que escribes no se envía a ningún servidor.</div>';
    document.body.appendChild(p); els.p = p; els.m = p.querySelector('#rb-m'); els.ch = p.querySelector('#rb-ch'); els.i = p.querySelector('#rb-i');
    l.addEventListener('click', abrir);
    document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-robotin-open],[data-robotin-q]'); if (!t) return; e.preventDefault(); var q = t.getAttribute('data-robotin-q'); abrir(); if (q) setTimeout(function () { enviar(q, t.textContent); }, els.m.children.length ? 100 : 1500); });
    p.querySelector('.rb-x').addEventListener('click', cerrar);
    p.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var v = els.i.value.trim(); if (v) { els.i.value = ''; enviar(v); } });
    els.ch.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) enviar(b.getAttribute('data-q'), b.textContent); });
    // al abrir una ficha, el chat se minimiza para dejar ver la página; la conversación se conserva
    els.m.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a && a.getAttribute('data-rb')) { e.preventDefault(); enviar(a.getAttribute('data-rb'), 'Servicios para el remate ' + a.getAttribute('data-rb').split(' ')[1]); return; } if (a && a.getAttribute('href') && a.getAttribute('href').indexOf(BASE) === 0 && !a.target) cerrar(); });
    function pos() { var fab = document.querySelector('.fab'); els.l.style.bottom = (fab && fab.offsetHeight ? fab.offsetHeight + 22 : 14) + 'px'; }
    pos(); window.addEventListener('resize', pos);
    try { if (sessionStorage.getItem(SS + '_visto')) document.getElementById('rb-dot').style.display = 'none'; } catch (e) { }
    // memoria de la conversación mientras dure la visita (se conserva al abrir una ficha)
    try {
      var st = JSON.parse(sessionStorage.getItem(SS) || 'null');
      if (st && st.h) {
        els.m.innerHTML = st.h; F = st.F || {}; shown = st.shown || 0; chips(st.c);
        load().then(function () { var by = {}; D.todos.forEach(function (r) { by[r[0]] = r; }); var mp = function (a) { return (a || []).map(function (i) { return by[i]; }).filter(Boolean); }; if (st.ids) last = mp(st.ids); if (st.lg) { LG = { pj: mp(st.lg.pj), sunat: mp(st.lg.sunat), indecopi: mp(st.lg.indecopi) }; SH = st.sh || {}; } });
        if (st.open) abrir();
      }
    } catch (e) { }
  }
  function abrir() {
    els.abierto = true; els.p.classList.add('on'); els.l.style.display = 'none'; var dot = document.getElementById('rb-dot'); if (dot) dot.style.display = 'none'; try { sessionStorage.setItem(SS + '_visto', '1'); } catch (e) { }
    var fab = document.querySelector('.fab'); if (fab) fab.style.display = 'none';
    if (!els.m.children.length) { load().then(inicio, function () { say('No pude cargar los datos de remates ahora. Puedes usar el <a href="' + BASE + 'buscar/">buscador</a> o escribirle a Víctor por WhatsApp.', 0, [['Hablar con Víctor', 'asesoria']]); }); }
    setTimeout(function () { scroll(); if (window.innerWidth > 700) els.i.focus(); }, 50); guardar();
  }
  function cerrar() {
    els.abierto = false; els.p.classList.remove('on'); els.l.style.display = 'flex';
    var fab = document.querySelector('.fab'); if (fab) fab.style.display = ''; guardar();
  }
  function scroll() { els.m.scrollTop = els.m.scrollHeight; }
  function user(t) { var d = document.createElement('div'); d.className = 'rb-u'; d.textContent = t; els.m.appendChild(d); scroll(); }
  function chips(c) {
    els.chips = c || []; els.ch.innerHTML = '';
    els.chips.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-q', x[1]); b.textContent = x[0]; els.ch.appendChild(b); });
  }
  function burbuja(cls) { var t = document.createElement('div'); t.className = 'rb-r' + (cls ? ' ' + cls : ''); t.innerHTML = '<span class="rb-d"></span><span class="rb-d"></span><span class="rb-d"></span>'; els.m.appendChild(t); scroll(); return t; }
  function say(html, delay, c) {
    var t = burbuja(); chips([]);
    setTimeout(function () { t.innerHTML = html; chips(c); t.scrollIntoView ? els.m.scrollTop = Math.max(0, t.offsetTop - 60) : scroll(); guardar(); }, delay == null ? 450 : delay);
  }
  // «Voy a revisar…» y, enseguida, la respuesta
  function revisarYResponder(aviso, fn) {
    chips([]);
    var a = document.createElement('div'); a.className = 'rb-r rb-s'; a.innerHTML = aviso; els.m.appendChild(a); scroll();
    setTimeout(function () { var r = fn(); var t = burbuja(); setTimeout(function () { t.innerHTML = r[0]; chips(r[1]); els.m.scrollTop = Math.max(0, a.offsetTop - 8); guardar(); }, 700); }, 350);
  }
  var CH_INICIO = [['Casas en Lima', 'casa en lima'], ['Departamentos en Lima', 'departamento en lima'], ['Terrenos', 'busco terrenos'], ['En provincias', 'propiedades en provincias'], ['Remates de SUNAT', 'remates de sunat'], ['Lo más barato', 'lo más barato en soles'], ['¿Dónde hay remates?', 'donde hay remates'], ['¿Cómo funciona?', 'como funciona un remate']];
  function inicio() {
    var u = D.ediciones.filter(function (e) { return e.fecha === D.ult; })[0];
    var ot = D.sunat.length ? ', <b>' + D.sunat.length + ' inmuebles en remate de SUNAT</b>' : '';
    ot += D.inde.length ? ' y <b>' + D.inde.length + ' de INDECOPI</b>' : ' y reviso los catálogos de INDECOPI';
    say('¡Hola! Soy <b>Robotín</b>, el asistente automático de remates de Víctor Ventura. Conozco todo lo publicado en esta página: <b>' + D.remates.length + ' remates del Poder Judicial (REMAJU)</b>' + ot + '. La última edición judicial es del <a href="' + BASE + D.ult + '/">' + fdate(D.ult) + '</a>' + (u ? ' (' + esc(u.resumen.split('·')[0].trim()) + ')' : '') + '.<br><br>Cuéntame con tus palabras qué buscas y dónde, por ejemplo <i>«busco propiedades en Lima»</i> o <i>«una casa en Piura hasta 300 mil soles»</i>. Te mostraré lo que haya en cada entidad, por separado; y si no hay nada exacto, lo más cercano.', 600, CH_INICIO);
  }

  /* ================= respuestas ================= */
  function fcorta(f) { var p = f.split('-'), m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']; return parseInt(p[2], 10) + ' ' + m[parseInt(p[1], 10) - 1]; }
  function item(r) {
    var a = area(r), c = (r[13] || '').trim(), sin = /ninguna declarada/i.test(c), s = src(r), x = r[16] || {};
    if (s === 'pj') return '<div class="rb-it"><div><b>N.° ' + esc(r[0]) + '</b> · ' + esc(r[1]) + '</div><div>' + esc(r[2]) + (a && r[2].indexOf('m²') < 0 ? ' · ' + a.toLocaleString('en-US') + ' m²' : '') + '</div><div class="t">Base ' + esc(money(r)) + '</div><div style="color:#5A6470">' + (sin ? 'Sin cargas declaradas' : 'Con cargas: ' + esc(c.length > 90 ? c.slice(0, 88) + '…' : c)) + ' · edición ' + fdate(r[4]) + '</div><div class="z"><a href="' + link(r) + '">Ver ficha</a><a href="#" data-rb="servicios ' + esc(r[0]) + '">Servicios y consulta</a></div></div>';
    var tit = r[14] || '', corto = tit.length > 120 ? tit.slice(0, 118) + '…' : tit, ent = s === 'sunat' ? 'SUNAT' : 'INDECOPI';
    var msg = 'Hola Víctor, quiero apoyo con un remate de ' + ent + '.\nRemate ' + ent + (s === 'sunat' ? ' N.°: ' + x.n : ': ítem ' + x.n) + ' (' + r[4].split('-').reverse().join('/') + ', ' + r[1] + ')\nInmueble: ' + tit.slice(0, 140) + (r[10] ? '\nPartida electrónica: ' + r[10] : '');
    return '<div class="rb-it ' + (s === 'sunat' ? 's' : 'i') + '"><div><b>' + ent + (s === 'sunat' ? ' N.° ' + esc(x.n) : ' · ítem ' + esc(x.n)) + '</b> · ' + esc(r[1]) + '</div><div>' + esc(r[2]) + (x.acc ? ' · ' + esc(x.acc) + ' de acciones y derechos' : '') + (a ? ' · ' + a.toLocaleString('en-US') + ' m²' : '') + '</div><div style="font-size:12.5px;color:#444C55">' + esc(corto) + '</div><div class="t">Base ' + esc(r[3] ? r[3].replace(/\.00$/, '') : 'por confirmar') + '</div><div style="color:#5A6470">Remate: <b style="color:#0E1216">' + fcorta(r[4]) + (x.hora ? ', ' + esc(x.hora) : '') + '</b>' + (x.conv ? ' · ' + esc(x.conv) + ' convocatoria' : '') + (c ? ' · Cargas: ' + esc(c.charAt(0).toLowerCase() + c.slice(1)) : '') + '</div><div class="z">' + (s === 'sunat' ? '<a href="' + BASE + 'sunat/#s' + esc(x.n) + '">Ver en la lista</a>' : '<a href="' + BASE + 'indecopi/">Ver en la lista</a>') + (x.url ? '<a target="_blank" rel="noopener" href="' + esc(x.url) + '">Aviso oficial</a>' : '') + '<a target="_blank" rel="noopener" href="' + wa(msg) + '">Consultar con Víctor</a></div></div>';
  }
  var PIE = '<small style="color:#5A6470">Información referencial de REMAJU, SUNAT e INDECOPI. Verifica el aviso oficial, la partida en SUNARP, la posesión y las bases antes de ofertar.</small>';
  function agrupa(list) {
    var g = { pj: [], sunat: [], indecopi: [] };
    list.forEach(function (r) { g[src(r)].push(r); });
    if (F.ord !== 'asc' && F.ord !== 'desc' && F.ord !== 'area') ['sunat', 'indecopi'].forEach(function (k) { g[k].sort(function (a, b) { return a[4] < b[4] ? -1 : a[4] > b[4] ? 1 : ((a[16] || {}).hora || '') < ((b[16] || {}).hora || '') ? -1 : 1; }); });
    return g;
  }
  function chipsBase(c) {
    if (!F.sc) c.push(['Solo sin cargas', 'solo sin cargas']);
    if (F.ord !== 'asc') c.push(['Más barato', 'lo mas barato']);
    if (!c.some(function (x) { return x[1] === 'abrir alertas'; })) c.push(['Crear alerta con esto', 'abrir alertas']);
    c.push(['Nueva búsqueda', 'empezar de nuevo']);
    return c;
  }
  function chipsMas() { var c = []; FUENTES.forEach(function (fu) { var k = fu[0], n = LG && LG[k] ? LG[k].length - (SH[k] || 0) : 0; if (n > 0) c.push(['Más de ' + fu[2] + ' (' + n + ')', 'ver mas ' + k]); }); return c; }
  // Muestra los resultados separados por entidad: Poder Judicial (REMAJU), SUNAT e INDECOPI
  function mostrarGrupos(list, extra) {
    LG = agrupa(list); SH = {}; last = list; shown = 0;
    var con = FUENTES.filter(function (fu) { return LG[fu[0]].length; }), por = con.length > 1 ? 3 : 5, h = '';
    con.forEach(function (fu) {
      var k = fu[0], l = LG[k], pg = l.slice(0, por);
      h += '<div class="rb-g' + (k === 'sunat' ? ' s' : k === 'indecopi' ? ' i' : '') + '"><span>' + fu[1] + '</span><small>' + l.length + (l.length === 1 ? ' remate' : ' remates') + '</small></div>';
      pg.forEach(function (r) { h += item(r); }); SH[k] = pg.length;
    });
    var c = chipsMas(); (extra || []).forEach(function (x) { c.push(x); });
    return [h, chipsBase(c)];
  }
  function verMas(k) {
    if (!LG) return null;
    if (!k) { for (var i = 0; i < FUENTES.length; i++) if (LG[FUENTES[i][0]].length > (SH[FUENTES[i][0]] || 0)) { k = FUENTES[i][0]; break; } }
    if (!k || !LG[k] || LG[k].length <= (SH[k] || 0)) return null;
    var d = SH[k] || 0, pg = LG[k].slice(d, d + 5), h = '<div class="rb-g' + (k === 'sunat' ? ' s' : k === 'indecopi' ? ' i' : '') + '"><span>' + nomFuente(k) + '</span><small>' + (d + 1) + ' a ' + (d + pg.length) + ' de ' + LG[k].length + '</small></div>';
    pg.forEach(function (r) { h += item(r); }); SH[k] = d + pg.length;
    return [h, chipsBase(chipsMas())];
  }
  // «3 del Poder Judicial (REMAJU) y 2 de SUNAT. En INDECOPI no hay…»
  function conteo(list, f) {
    var g = { pj: 0, sunat: 0, indecopi: 0 }; list.forEach(function (r) { g[src(r)]++; });
    if (f.src) return '';
    var si = [], no = [];
    FUENTES.forEach(function (fu) { if (g[fu[0]]) si.push('<b>' + g[fu[0]] + '</b> ' + (fu[0] === 'pj' ? 'del ' : 'de ') + fu[1]); else no.push(fu[0]); });
    var t = si.length > 1 ? si.slice(0, -1).join(', ') + ' y ' + si[si.length - 1] : '', n = [], uno = FUENTES.filter(function (fu) { return g[fu[0]]; })[0];
    no.forEach(function (k) { if (k === 'indecopi' && !D.inde.length) n.push('INDECOPI no tiene un remate comunicado por ahora'); else n.push('en ' + (k === 'pj' ? 'el ' : '') + nomFuente(k) + ' no hay coincidencias'); });
    return (si.length > 1 ? ' Son ' + t + '.' : (list.length === 1 ? ' Es ' : ' Todos son ') + (uno[0] === 'pj' ? 'del ' : 'de ') + '<b>' + uno[1] + '</b>.') + (n.length ? ' <small style="color:#5A6470">(' + n.join('; ') + '.)</small>' : '');
  }
  function ordenTxt(f, n) { return n > 5 ? ' Te muestro ' + (f.ord === 'asc' ? 'los más baratos' : f.ord === 'desc' ? 'los de mayor base' : f.ord === 'area' ? 'los de mayor área' : 'los más recientes') + ':' : ''; }
  function cuantos(n) { return n === 1 ? 'este remate' : 'estos <b>' + n + '</b>'; }
  function regionesCon(list, deps) { var s = {}; list.forEach(function (r) { var d = G[r[0]].dep; if (deps.indexOf(d) >= 0) s[DEPS[d][0]] = 1; }); return Object.keys(s).join(', '); }

  // Devuelve [html, chips] con coincidencia exacta o con la mejor aproximación
  function resolver(f, nota) {
    var list = buscar(f), pl = f.lug && f.lug[0], lugar = f.lug ? nombreLugar(f) : '', n;
    shown = 0;
    if (f.src === 'indecopi' && !D.inde.length) { var hi = D.indeInfo && D.indeInfo.historial && D.indeInfo.historial[0]; LG = null; last = null; return ['<b>INDECOPI no tiene un remate comunicado en este momento.</b> Publica su catálogo pocos días antes de cada remate' + (hi ? '; el último fue el ' + fdate(hi.fecha_remate) + ' (comunicado el ' + fdate(hi.fecha_comunicacion) + ')' : '') + '. Reviso su página de lunes a viernes: cuando salga uno lo verás en <a href="' + BASE + 'indecopi/">la sección de INDECOPI</a> y aquí mismo. Mientras tanto puedo buscarte en el Poder Judicial y en SUNAT.', [['Buscar en todas las entidades', 'propiedades de todas las entidades'], ['Remates de SUNAT', 'remates de sunat'], ['Crear alerta', 'abrir alertas']]]; }
    if (list.length) {
      var r = mostrarGrupos(list), ex = '';
      if (pl && pl.k === 'dist') { var hom = D.remates.filter(function (x) { var g = G[x[0]]; return !g.metro && g.parts.indexOf(pl.key) >= 0; }); if (hom.length) ex = ' <small>(Hay otro lugar llamado ' + esc(pl.n) + ' fuera de Lima con ' + hom.length + ' remate' + (hom.length > 1 ? 's' : '') + '; si te referías a ese, dime la región.)</small>'; }
      return ['Sí, encontré <b>' + list.length + '</b> ' + (list.length === 1 ? 'remate' : 'remates') + ' de ' + esc(resumenFiltro(f)) + '.' + conteo(list, f) + (nota ? ' ' + nota : '') + ex + ' A continuación te los muestro' + (f.src ? '' : ' por entidad') + ':' + r[0] + PIE, r[1]];
    }
    var otros = (f.tipo && f.tipo.length) || f.min != null || f.max != null || f.area != null || f.sc || f.mon;
    var levels = pl ? niveles(pl) : [], i, lv, alt;
    var todoLugar = pl ? buscar({ lug: f.lug, src: f.src }).length : 0;
    var extra = [];
    if (pl && todoLugar) extra.push(['Ver todo en ' + pl.n + ' (' + todoLugar + ')', 'todo lugar']);
    if (pl) extra.push(['Avísame si sale algo en ' + pl.n, 'abrir alertas']);
    var noHay = pl ? 'En estos días no hay remates publicados de <b>' + esc(que(f)) + '</b>' + (f.src ? ' de ' + nomFuente(f.src) : '') + ' en <b>' + esc(lugar) + '</b>' + (precioTxt(f) ? ' ' + esc(precioTxt(f)) : '') + '.' : 'No encontré remates de <b>' + esc(resumenFiltro(f)) + '</b> entre los publicados.';
    // 1) mismo pedido, lugares cercanos
    for (i = 0; i < levels.length; i++) {
      lv = levels[i]; alt = buscar(f, lv.t);
      if (alt.length) {
        var r1 = mostrarGrupos(alt, extra), ex1 = explica(pl), dnd = lv.l + (lv.v ? ' (' + regionesCon(alt, lv.v) + ')' : '');
        return [noHay + ' ' + (ex1 ? 'Pero como ' + ex1 + ', ' : 'Pero ') + (alt.length === 1 ? 'te puede interesar' : 'te pueden interesar') + ' ' + cuantos(alt.length) + ' ' + dnd + '.' + conteo(alt, f) + r1[0] + PIE, r1[1]];
      }
    }
    // 2) mismo lugar (y luego cercanos), flexibilizando el pedido
    var relax = [];
    if (f.max != null || f.min != null) { var g1 = clon(f); if (g1.max != null) g1.max = g1.max * 1.25; if (g1.min != null) g1.min = g1.min * 0.75; relax.push([g1, 'ajustando un poco el presupuesto (' + precioTxt({ mon: g1.mon, min: g1.min, max: g1.max }).replace('con base ', '') + ')']); }
    if (f.tipo && f.tipo.length) { var g2 = clon(f); delete g2.tipo; relax.push([g2, 'de otros tipos de inmueble']); }
    if (f.area != null || f.sc) { var g3 = clon(f); delete g3.area; delete g3.sc; relax.push([g3, 'sin exigir ' + [f.area != null ? 'esa área' : '', f.sc ? 'que estén libres de cargas' : ''].filter(Boolean).join(' ni ')]); }
    if (otros) { var g4 = { lug: f.lug, ord: f.ord, src: f.src }; relax.push([g4, 'con otras características']); }
    var scopes = [null].concat(levels);
    for (var j = 0; j < relax.length; j++) for (i = 0; i < scopes.length; i++) {
      lv = scopes[i]; alt = lv ? buscar(relax[j][0], lv.t) : buscar(relax[j][0]);
      if (alt.length) {
        var r2 = mostrarGrupos(alt, extra);
        var donde = !pl ? '' : lv ? ' ' + lv.l + (lv.v ? ' (' + regionesCon(alt, lv.v) + ')' : '') : ' en ' + esc(lugar);
        return [noHay + ' Lo más aproximado que tengo ' + (alt.length === 1 ? 'es' : 'son') + ' ' + cuantos(alt.length) + ' ' + relax[j][1] + donde + '.' + conteo(alt, f) + r2[0] + PIE, r2[1]];
      }
    }
    // 3) nada parecido
    var rec = buscar({ ord: 'rec', src: 'pj' }).slice(0, 3); last = rec; LG = null; n = '';
    rec.forEach(function (x) { n += item(x); }); shown = rec.length;
    return [noHay + ' Tampoco encontré algo parecido cerca. Puedes <b>crear una alerta</b> y Víctor te avisa cuando salga uno. Mientras tanto, estos son los más recientes:' + n + PIE, [['Crear alerta con esto', 'abrir alertas'], ['¿Dónde hay remates?', 'donde hay remates'], ['Nueva búsqueda', 'empezar de nuevo']]];
  }
  function responderBusqueda(f, nota) {
    if ((f.ord === 'asc' || f.ord === 'desc') && !f.mon) {
      var l0 = buscar(f);
      if (l0.some(function (r) { return mon(r) === 'US$'; }) && l0.some(function (r) { return mon(r) === 'S/'; })) { say('Para ordenar por precio necesito comparar en la misma moneda. ¿Te los muestro en <b>soles</b> o en <b>dólares</b>?', 400, [['En soles', 'en soles'], ['En dólares', 'en dólares']]); return; }
    }
    var aviso = 'Voy a revisar si hay <b>' + esc(que(f)) + '</b>' + (f.lug ? ' en <b>' + esc(nombreLugar(f)) + '</b>' : '') + (precioTxt(f) ? ' ' + esc(precioTxt(f)) : '') + ' ' + (f.src ? 'en los remates de ' + nomFuente(f.src) : 'en los remates del Poder Judicial (REMAJU), de SUNAT y de INDECOPI') + '…';
    revisarYResponder(aviso, function () { return resolver(f, nota); });
  }
  function ficha(n) {
    var r = D.remates.filter(function (x) { return x[0] === n; })[0];
    if (!r) { say('No tengo el remate N.° ' + esc(n) + ' en las ediciones publicadas (desde el 6 de noviembre de 2026). Prueba con el <a href="' + BASE + 'buscar/">buscador</a> o descríbeme lo que buscas.', 400, CH_INICIO); return; }
    var h = item(r) + '<div style="font-size:13px">Tasación: <b>' + esc(r[6]) + '</b><br>Base (2/3): <b>' + esc(r[3]) + '</b><br>Oblaje: ' + esc(r[8]) + ' · Arancel: ' + esc(r[9]) + '<br>Partida: ' + esc(r[10]) + '</div><small style="color:#5A6470">Información referencial. Confirma datos y bases en REMAJU.</small>';
    revisarYResponder('Voy a buscar el remate <b>N.° ' + esc(n) + '</b> en mi base…', function () { return ['Esto tengo del remate <b>N.° ' + esc(r[0]) + '</b>:' + h, [['Servicios para este remate', 'servicios ' + r[0]], ['Otra consulta a Víctor', 'asesoria ' + r[0]], ['Nueva búsqueda', 'empezar de nuevo']]]; });
  }
  function cobertura() {
    var c = {}, lm = 0, ca = 0;
    D.todos.forEach(function (r) { var g = G[r[0]]; if (g.metro) lm++; else if (g.dep === 'callao') ca++; else if (g.dep) { var k = g.dep === 'lima' ? 'Lima provincias' : DEPS[g.dep][0]; c[k] = (c[k] || 0) + 1; } });
    var t = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).map(function (k) { return k + ' (' + c[k] + ')'; }).join(', ');
    return ['Sumando Poder Judicial (' + D.remates.length + '), SUNAT (' + D.sunat.length + ')' + (D.inde.length ? ' e INDECOPI (' + D.inde.length + ')' : '') + ', ahora mismo tengo remates en: <b>Lima Metropolitana (' + lm + ')</b>' + (ca ? ', <b>Callao (' + ca + ')</b>' : '') + ' y en provincias: ' + esc(t) + '.<br><br>Dime un distrito, ciudad o región y te muestro lo que hay; si no hay nada exacto, te enseño lo más cercano.', [['Lima Moderna', 'propiedades en lima moderna'], ['Lima Norte', 'propiedades en lima norte'], ['Lima Este', 'propiedades en lima este'], ['Lima Sur', 'propiedades en lima sur'], ['Norte del Perú', 'propiedades en el norte del peru'], ['Sur del Perú', 'propiedades en el sur del peru'], ['Selva', 'propiedades en la selva']]];
  }
  var FAQ = [
    [/coactiv|aduana|otros remates|otras entidades|que entidades|que fuentes|de donde (sacas|salen)/, function () { return ['Reúno los remates de tres entidades y te los muestro por separado:<br>• <b>Poder Judicial (REMAJU)</b>: ' + D.remates.length + ' remates judiciales publicados. <a href="' + BASE + '">Ver</a><br>• <b>SUNAT</b>: ' + D.sunat.length + ' inmuebles embargados por cobranza coactiva. <a href="' + BASE + 'sunat/">Ver</a><br>• <b>INDECOPI</b>: ' + (D.inde.length ? D.inde.length + ' inmuebles en catálogo vigente' : 'sin remate comunicado por ahora (publica el catálogo pocos días antes)') + '. <a href="' + BASE + 'indecopi/">Ver</a><br><br>Dime un lugar o un tipo de inmueble y busco en las tres.', [['Propiedades en Lima', 'propiedades en lima'], ['Remates de SUNAT', 'remates de sunat'], ['Remates de INDECOPI', 'remates de indecopi']]]; }],
    [/servicio|cuanto cuesta|cuanto cobra|precio de|tarifa|honorario|consulta personalizada|informe|expediente|estudio de titulo|revision de (la )?partida|asesor|abogado|cotiz/, function () { return [servicios(), [['Hablar con Víctor', 'asesoria'], ['Buscar remates', 'empezar de nuevo']]]; }],
    [/donde hay|que (distritos|ciudades|regiones|zonas|lugares)|en que (lugares|ciudades|zonas|distritos)|cobertura|de donde tienes/, cobertura],
    [/como funciona|que es (un )?remate|remate judicial|como (se )?participa|como participo|como ofertar|quiero participar|pasos/, function () { return ['Un <b>remate judicial</b> es la venta pública de un bien embargado o hipotecado, ordenada por un juez para cobrar una deuda. En REMAJU (Poder Judicial) cada remate publica una <b>tasación</b>, una <b>base</b> (en estos remates, 2/3 de la tasación), el periodo de <b>inscripción</b> y las fechas de <b>ofertas</b>. Para ofertar normalmente debes inscribirte dentro del plazo y consignar el <b>oblaje</b> (depósito) y el <b>arancel</b>; ambos montos están en la ficha de cada remate y en las bases.<br><br>Antes de ofertar conviene revisar la <b>partida en SUNARP</b> (cargas), la <b>posesión</b> del inmueble y las bases del remate. ¿Te muestro opciones o prefieres que Víctor te oriente?', [['Buscar remates', 'empezar de nuevo'], ['Cargas y SUNARP', 'que son las cargas'], ['Hablar con Víctor', 'asesoria']]]; }],
    [/oblaje|arancel|deposito|garantia|cuanto (hay que )?(pagar|depositar|consignar)/, function () { return ['El <b>oblaje</b> es el depósito que consignas para participar y el <b>arancel</b> es el pago judicial por postor. Sus montos figuran en la ficha de cada remate (en las fichas publicadas aquí el oblaje equivale al 10 % de la tasación, pero confirma siempre en las bases de REMAJU). Dame el N.° de un remate y te muestro sus montos, por ejemplo <i>«remate 26109»</i>.', [['Ver remates recientes', 'lo mas reciente'], ['Hablar con Víctor', 'asesoria']]]; }],
    [/carga|hipoteca|embargo|gravamen|sunarp|partida|titulo|registral/, function () { return ['Las <b>cargas</b> (hipotecas, embargos, anotaciones de demanda) figuran en REMAJU y en la <b>partida registral</b> de SUNARP. Un remate puede venderse con cargas que se mantienen o con cargas que se cancelan: depende de su rango y de las bases. Por eso lo prudente es una <b>revisión de título y cargas</b> antes de ofertar. Víctor ofrece ese servicio; puedo derivarte con el N.° del remate que te interese: <a target="_blank" rel="noopener" href="' + wasolicitud() + '"><b>Escribir a Víctor →</b></a>', [['Solo sin cargas', 'solo sin cargas'], ['Buscar remates', 'empezar de nuevo']]]; }],
    [/posesion|desalojo|ocupante|ocupado|inquilino|entrega del bien/, function () { return ['La <b>posesión</b> no siempre está garantizada: un inmueble rematado puede estar ocupado y la entrega puede requerir trámites. Hay que verificarlo en campo y en el expediente antes de ofertar. Si quieres, Víctor puede orientarte sobre un remate concreto.', [['Hablar con Víctor', 'asesoria'], ['Buscar remates', 'empezar de nuevo']]]; }],
    [/\bbase\b|tasacion|dos tercios|2\/3|descuento|por que (es|son) tan barat/, function () { return ['En los remates publicados aquí la <b>base es 2/3 de la tasación</b> (en un primer remate; si no hay postores puede haber convocatorias posteriores con rebaja). Es un precio de partida, no un precio final: otros postores pueden ofertar más. Revisa siempre cargas, posesión y estado real del inmueble: un precio bajo suele reflejar riesgos.', [['Ver los más baratos', 'lo mas barato'], ['Cargas y SUNARP', 'que son las cargas']]]; }],
    [/alerta|avisame|avisar|notific|suscri|recibir|grupo|comunidad/, function () { return ['Puedes crear una <b>alerta personalizada</b> (ciudad, tipo, precio, área) en <a href="' + BASE + 'alertas/">venturalegal.pe/remates/alertas</a>. Se envía por WhatsApp a Víctor con tus criterios y tu autorización de datos. Por ahora es gratuito.', [['Crear mi alerta', 'abrir alertas'], ['Buscar ahora', 'empezar de nuevo']]]; }],
    [/asesor|abogado|victor|contacto|contactar|whatsapp|hablar con|llamar|cotiz|servicio|humano|persona/, function () { return ['Con gusto. Víctor Ventura (Director – Ventura Legal) puede orientarte en un remate: revisión de título y cargas, análisis de riesgos y acompañamiento durante el remate. Toca el enlace y se abre WhatsApp con tu consulta ya escrita: <a target="_blank" rel="noopener" href="' + wasolicitud() + '"><b>Abrir WhatsApp →</b></a>', [['Seguir buscando', 'empezar de nuevo']]]; }],
    [/gracias|genial|perfecto|excelente|buenazo/, function () { return ['¡Con gusto! Si quieres seguir viendo opciones, dime qué buscas; y si quieres que Víctor revise un remate, te derivo por WhatsApp.', CH_INICIO]; }],
    [/(^|\s)(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal)(\s|$)/, function () { return ['¡Hola! Cuéntame qué buscas y dónde: por ejemplo, <i>«departamento en Miraflores»</i> o <i>«terreno en Piura hasta 80 mil soles»</i>.', CH_INICIO]; }],
    [/ayuda|que puedes|que haces|que sabes|opciones|quien eres/, function () { return ['Soy un asistente automático. Puedo: buscar remates por <b>tipo, distrito, ciudad o región, precio y área</b> (y si no hay nada exacto, mostrarte lo más cercano); darte la ficha de un remate con su <b>N.°</b>; explicarte cómo funciona un remate; y derivarte con Víctor para revisión de título o asesoría.', CH_INICIO]; }]
  ];
  function servicios(n) {
    var r = n ? D.remates.filter(function (x) { return x[0] === n; })[0] : null;
    return (r ? 'Para el remate <b>N.° ' + esc(n) + '</b> (' + esc(r[1]) + ', ' + esc(r[2]) + ') Víctor ofrece estos servicios. Toca el que quieras y se abre WhatsApp con el pedido ya escrito:' : 'Víctor ofrece estos servicios para cualquier remate publicado. Toca el que quieras y se abre WhatsApp; solo indica el número del remate:') + servHtml(r ? datosRemate(r) : null) + '<small style="color:#5A6470">' + SERV_NOTA + '</small>';
  }
  function wasolicitud(n) {
    var t = 'Hola Víctor, escribo desde Robotín (venturalegal.pe/remates).';
    if (n) { var r = D.remates.filter(function (x) { return x[0] === n; })[0]; t += ' Quiero apoyo con el remate N.° ' + n + (r ? ' (' + r[1] + ', ' + r[2] + ', base ' + money(r) + ')' : '') + '.'; }
    else { t += tiene(F) ? ' Estoy buscando: ' + resumenFiltro(F) + '.' : ' Quiero orientación sobre un remate judicial.'; if (last && last.length && tiene(F)) t += ' Me interesan, entre otros, los N.° ' + last.slice(0, 3).map(function (r) { return r[0]; }).join(', ') + '.'; }
    return wa(t);
  }
  function enviar(txt, etiqueta) { user(etiqueta || txt); load().then(function () { procesar(txt); }); }
  function procesar(txt) {
    var m = limpio(txt), k;
    if (/^(empezar de nuevo|nueva busqueda|reiniciar|borrar|limpiar)/.test(m)) { F = {}; last = null; LG = null; SH = {}; say('Listo, empecemos de nuevo. ¿Qué buscas y dónde? Puedes decirme también tu presupuesto.', 350, CH_INICIO); return; }
    if (/^ver mas/.test(m)) { var vk = (m.match(/^ver mas (pj|sunat|indecopi)/) || [])[1], vr = verMas(vk); if (vr) say(vr[0], 500, vr[1]); else say('No hay más resultados en esta búsqueda.', 300, CH_INICIO); return; }
    if (/^todo lugar/.test(m) && F.lug) { F = { lug: F.lug, src: F.src }; if (!F.src) delete F.src; responderBusqueda(F); return; }
    if (/^abrir alertas/.test(m)) {
      var q = [], pl = F.lug && F.lug[0];
      if (pl && /dist|calld|ciudad|dep/.test(pl.k)) q.push('ub=' + encodeURIComponent(pl.n)); else if (pl && /metro|zona/.test(pl.k)) q.push('ub=Lima');
      if (F.mon) q.push('mon=' + encodeURIComponent(F.mon)); if (F.min != null) q.push('min=' + Math.round(F.min)); if (F.max != null) q.push('max=' + Math.round(F.max)); if (F.area != null) q.push('area=' + F.area); if (F.tipo && F.tipo.length) q.push('tp=' + F.tipo[0]); if (F.sc) q.push('sc=1');
      guardar(); location.href = BASE + 'alertas/' + (q.length ? '?' + q.join('&') : ''); return;
    }
    var ms = m.match(/^servicios\s*(\d{5})?$/);
    if (ms) { say(servicios(ms[1]), 450, ms[1] ? [['Ver ficha del ' + ms[1], 'remate ' + ms[1]], ['Seguir buscando', 'empezar de nuevo']] : [['Buscar remates', 'empezar de nuevo']]); return; }
    var mw = m.match(/^(asesoria|titulo)\s*(\d{5})?$/);
    if (mw) { say('Te abro WhatsApp con un mensaje ya escrito para Víctor' + (mw[2] ? ' sobre el remate N.° ' + esc(mw[2]) : '') + '. Solo tienes que enviarlo.<br><a target="_blank" rel="noopener" href="' + wasolicitud(mw[2]) + '"><b>Abrir WhatsApp →</b></a><br><small style="color:#5A6470">Atiende Víctor Ventura personalmente; las respuestas de Robotín no constituyen asesoría legal.</small>', 400, [['Seguir buscando', 'empezar de nuevo']]); return; }
    var o = parse(txt);
    if (o.n && !o.lug && !o.tipo && o.src !== 'sunat') { ficha(o.n); return; }
    var mS = m.match(/\b(\d{3,5})\b/);
    if (o.src === 'sunat' && mS && !o.lug && !o.tipo && o.max == null && o.min == null) { var rs = D.sunat.filter(function (x) { return x[16].n === mS[1]; })[0]; if (rs) { revisarYResponder('Voy a buscar el remate <b>N.° ' + esc(mS[1]) + '</b> de SUNAT…', function () { return ['Esto tengo del remate de <b>SUNAT N.° ' + esc(mS[1]) + '</b>:' + item(rs) + (rs[6] ? '<div style="font-size:13px">Tasación: <b>' + esc(rs[6]) + '</b>' + (rs[10] ? '<br>Partida: ' + esc(rs[10]) : '') + (rs[16].local ? '<br>Lugar del remate: ' + esc(rs[16].local) : '') + (rs[16].obs ? '<br><b>Ojo:</b> ' + esc(rs[16].obs) : '') + '</div>' : '') + PIE, [['Más remates de SUNAT', 'remates de sunat'], ['Nueva búsqueda', 'empezar de nuevo']]]; }); return; } }
    if (o.todas && !tiene(o)) { delete F.src; responderBusqueda(F); return; }
    var esPregunta = /^(que|como|cuanto|cuando|por que|donde hay|en que|quien)\b/.test(m);
    if (!tiene(o) || (esPregunta && !o.lug && !o.tipo && o.max == null && o.min == null)) {
      for (var i = 0; i < FAQ.length; i++) if (FAQ[i][0].test(m)) { var res = FAQ[i][1](); say(res[0], 500, res[1]); return; }
      if (/ultimo|reciente|hoy|nuevos|esta semana|novedades/.test(m)) { F = { ord: 'rec' }; responderBusqueda(F); return; }
      if (o.generico) { say('¡Claro! Para darte opciones que te sirvan, cuéntame un poco más: ¿<b>en qué distrito, ciudad o región</b>?, ¿<b>qué tipo</b> de inmueble (casa, departamento, terreno, local)? y, si quieres, ¿<b>con qué presupuesto</b>? Con uno solo de esos datos ya puedo empezar.', 450, CH_INICIO); return; }
      say('No estoy seguro de haber entendido. Puedo buscar por <b>distrito, ciudad o región</b>, <b>tipo de inmueble</b>, <b>precio</b> y <b>área</b>, o darte la ficha de un remate con su N.°. Ejemplos: <i>«busco propiedades en Lince»</i>, <i>«terreno en Arequipa»</i>, <i>«departamento hasta 200 mil soles»</i>.', 500, CH_INICIO); return;
    }
    // Contexto: ¿sigue la búsqueda anterior o empieza otra?
    var dados = ['lug', 'tipo', 'min', 'max', 'area'].filter(function (x) { return o[x] != null; }).length + (o.min != null && o.max != null ? -1 : 0);
    var palabras = m.split(' ').length;
    var sigue = tiene(F) && (/^(y|o|pero|tambien|ademas|ahora|mejor|solo|entonces|ok|mas bien|en cambio)\b/.test(m) || /\b(tambien|ademas|en cambio|mas bien)\b/.test(m) || dados === 0 || (dados === 1 && palabras <= 4 && !/\b(busco|buscando|quiero|necesito|quisiera)\b/.test(m)));
    var nfil = sigue ? clon(F) : {};
    ['lug', 'tipo', 'mon', 'area', 'sc', 'ord', 'src'].forEach(function (x) { if (o[x] != null) nfil[x] = o[x]; });
    if (o.todas) delete nfil.src;
    if (o.min != null || o.max != null) { delete nfil.min; delete nfil.max; if (o.min != null) nfil.min = o.min; if (o.max != null) nfil.max = o.max; }
    F = nfil;
    var nota = '';
    if (o.aprox) nota = 'Busqué alrededor de ' + (F.mon ? F.mon + ' ' : '') + nf(o.aprox) + ' (25 % arriba o abajo).';
    else if (o.maxImplicito) nota = 'Tomé ese monto como presupuesto máximo para la base.';
    if ((F.max != null || F.min != null) && !F.mon) nota += ' Como no me dijiste la moneda, comparé el monto tanto en soles como en dólares.';
    if (o.uso) nota += ' Entendí que es ' + o.uso + '.';
    responderBusqueda(F, nota.trim());
  }

  function iniciar() { if (document.querySelector('.rb-l')) return; try { pagina(); } catch (e) { } build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
