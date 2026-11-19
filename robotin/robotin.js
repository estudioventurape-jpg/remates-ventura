/* Robotín · asistente automático de remates (Ventura Legal). Funciona 100 % en el navegador sobre /remates/remates.json.
   No envía lo que escribes a ningún servidor. Información referencial; no es asesoría legal.
   v2 (19/11/2026): «memoria» geográfica (distritos de Lima Metropolitana y Callao por zonas, departamentos y vecinos,
   ciudades principales), respuestas aproximadas cuando no hay coincidencia exacta y contexto de la conversación. */
(function () {
  'use strict';
  var WA = '51927995630', BASE = '/remates/', SS = 'robotin_v2';
  var D = null, ready = null, last = null, shown = 0, F = {}, els = {}, G = {}, DIC = {}, TERMS = [];

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
  function area(r) { var t = r[2] + ' ' + (r[14] || ''), m = t.match(/([\d,]+(?:\.\d+)?)\s*m²/); if (m) return parseFloat(m[1].replace(/,/g, '')); m = t.match(/([\d.]+)\s*ha\b/i); return m ? parseFloat(m[1]) * 10000 : null; }
  function tipo(r) { var t = norm(r[2]); if (/^(casa|vivienda)/.test(t)) return 'casa'; if (/departamento|dpto|duplex/.test(t)) return 'departamento'; if (/^(local|tienda|oficina)/.test(t)) return 'local'; if (/terreno|lote|fraccion|predio|parcela/.test(t)) return 'terreno'; if (/estacionamiento|cochera/.test(t)) return 'estacionamiento'; return 'otro'; }
  function mon(r) { return r[3].indexOf('US$') === 0 ? 'US$' : 'S/'; }
  function link(r) { return BASE + r[4] + '/#r' + r[0]; }
  function fdate(f) { var m = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'], p = f.split('-'); return parseInt(p[2], 10) + ' de ' + m[parseInt(p[1], 10) - 1]; }
  function money(r) { return r[3].replace(/\.00$/, ''); }
  function nf(n) { return Math.round(n).toLocaleString('en-US'); }
  function wa(texto) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto); }
  function clon(o) { return JSON.parse(JSON.stringify(o)); }
  var PL = { casa: 'casas', departamento: 'departamentos', terreno: 'terrenos', local: 'locales comerciales', estacionamiento: 'estacionamientos', otro: 'otros inmuebles' };

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
  function term(k, o) { if (!DIC[k]) DIC[k] = o; }
  function load() {
    if (ready) return ready;
    ready = fetch(BASE + 'remates.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
      D = d; DIC = {};
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
      d.remates.forEach(function (r) {
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
    if (/\b(locales?|tiendas?|oficinas?|comercial(es)?|galeria|stand)\b/.test(m)) T.push('local');
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
    o.generico = /\b(busco|buscando|quiero|quisiera|necesito|me interesa|hay|tienes|tienen|propiedad(es)?|inmuebles?|comprar|invertir|inversion|algo)\b/.test(m);
    return o;
  }
  function tiene(o) { return o.lug || o.tipo || o.mon || o.min != null || o.max != null || o.area != null || o.sc || o.ord; }

  /* ================= búsqueda ================= */
  function coincide(r, f, scope) {
    if (f.tipo && f.tipo.length && f.tipo.indexOf(tipo(r)) < 0) return false;
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
    var out = D.remates.filter(function (r) { return coincide(r, f, scope); }), ord = f.ord || 'rec';
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
  function resumenFiltro(f) { return [que(f), f.lug ? 'en ' + nombreLugar(f) : '', precioTxt(f)].filter(Boolean).join(' '); }

  /* ================= interfaz ================= */
  function css() {
    var s = document.createElement('style');
    s.textContent = '.rb-l{position:fixed;right:14px;bottom:14px;z-index:55;display:flex;align-items:center;gap:0;cursor:pointer;border:0;background:none;padding:0;font-family:Inter,system-ui,sans-serif}.rb-l img{width:78px;height:78px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35));animation:rbf 3s ease-in-out infinite;position:relative;z-index:1}@keyframes rbf{50%{transform:translateY(-6px)}}.rb-b{background:#2A4A9C;color:#fff;border-radius:26px;padding:10px 26px 10px 18px;margin-right:-18px;box-shadow:0 4px 14px rgba(0,0,0,.28);text-align:left;line-height:1.25}.rb-b small{display:block;font-size:11.5px;font-weight:500;opacity:.9}.rb-b b{display:block;font-size:14.5px;font-weight:600}.rb-l:hover .rb-b{background:#20397A}@media(max-width:520px){.rb-l img{width:66px;height:66px}.rb-b{padding:8px 22px 8px 14px}.rb-b b{font-size:13.5px}}.rb-p{position:fixed;right:14px;bottom:14px;z-index:70;width:min(400px,calc(100vw - 28px));height:min(600px,calc(100vh - 28px));background:#fff;border:1px solid #C3C9D4;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.35);display:none;flex-direction:column;overflow:hidden;font:14px/1.45 Inter,system-ui,sans-serif;color:#0E1216}.rb-p.on{display:flex}.rb-h{background:linear-gradient(135deg,#20397A,#2A4A9C);color:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px}.rb-h img{width:44px;height:44px;background:#fff;border-radius:50%;padding:3px}.rb-h b{display:block;font-size:15px}.rb-h span{font-size:11.5px;opacity:.9}.rb-x{margin-left:auto;background:none;border:0;color:#fff;font-size:24px;cursor:pointer;line-height:1}.rb-m{flex:1;overflow-y:auto;padding:12px;background:#F2F5FB;display:flex;flex-direction:column;gap:8px}.rb-r,.rb-u{max-width:90%;padding:9px 12px;border-radius:14px;word-wrap:break-word}.rb-r{background:#fff;border:1px solid #DFE3EA;align-self:flex-start;border-bottom-left-radius:4px}.rb-r.rb-s{background:#E5EAF6;border-color:#C9D3EC;color:#20397A;font-style:italic}.rb-u{background:#2A4A9C;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}.rb-r a{color:#20397A;font-weight:600}.rb-it{border:1px solid #DFE3EA;border-left:3px solid #5C78C0;background:#fff;padding:8px 10px;margin:6px 0;border-radius:6px;font-size:13px}.rb-it b{color:#20397A}.rb-it .t{font-size:15px;font-weight:600}.rb-it .z{display:flex;gap:10px;margin-top:4px;flex-wrap:wrap}.rb-it .z a{font-size:12.5px}.rb-ch{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px;background:#F2F5FB}.rb-ch button{border:1px solid #2A4A9C;color:#2A4A9C;background:#fff;border-radius:16px;padding:5px 11px;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer}.rb-ch button:hover{background:#E5EAF6}.rb-f{display:flex;gap:6px;padding:8px;border-top:1px solid #DFE3EA;background:#fff}.rb-f input{flex:1;padding:10px 12px;border:1px solid #C3C9D4;border-radius:20px;font:inherit;min-width:0}.rb-f button{background:#2A4A9C;color:#fff;border:0;border-radius:20px;padding:0 16px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}.rb-n{font-size:11px;color:#5A6470;padding:0 12px 8px;background:#fff;text-align:center}.rb-d{display:inline-block;width:6px;height:6px;border-radius:50%;background:#8FA4D8;margin:0 2px;animation:rbd 1s infinite}.rb-d:nth-child(2){animation-delay:.2s}.rb-d:nth-child(3){animation-delay:.4s}@keyframes rbd{50%{opacity:.25}}@media print{.rb-l,.rb-p{display:none}}';
    document.head.appendChild(s);
  }
  function guardar() {
    try { sessionStorage.setItem(SS, JSON.stringify({ h: els.m.innerHTML, c: els.chips || [], F: F, ids: last ? last.map(function (r) { return r[0]; }) : null, shown: shown, open: !!els.abierto })); } catch (e) { }
  }
  function build() {
    css();
    var l = document.createElement('button'); l.className = 'rb-l'; l.setAttribute('aria-label', 'Conversar con Robotín, asistente de remates');
    l.innerHTML = '<span class="rb-b"><small>¿Buscas un remate?</small><b>Conversa con Robotín</b></span><img src="' + BASE + 'robotin/robotin-s.png" alt="" width="78" height="78">';
    document.body.appendChild(l); els.l = l;
    var p = document.createElement('div'); p.className = 'rb-p'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Chat con Robotín');
    p.innerHTML = '<div class="rb-h"><img src="' + BASE + 'robotin/robotin-s.png" alt=""><div><b>Robotín</b><span>Asistente automático de remates judiciales</span></div><button class="rb-x" aria-label="Cerrar">×</button></div><div class="rb-m" id="rb-m" aria-live="polite"></div><div class="rb-ch" id="rb-ch"></div><form class="rb-f"><input id="rb-i" type="text" placeholder="Ej.: busco propiedades en Lince" autocomplete="off" aria-label="Escribe tu consulta"><button type="submit">Enviar</button></form><div class="rb-n">Respuestas automáticas con datos de REMAJU. Referencial, no es asesoría legal. Lo que escribes no se envía a ningún servidor.</div>';
    document.body.appendChild(p); els.p = p; els.m = p.querySelector('#rb-m'); els.ch = p.querySelector('#rb-ch'); els.i = p.querySelector('#rb-i');
    l.addEventListener('click', abrir);
    p.querySelector('.rb-x').addEventListener('click', cerrar);
    p.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var v = els.i.value.trim(); if (v) { els.i.value = ''; enviar(v); } });
    els.ch.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) enviar(b.getAttribute('data-q'), b.textContent); });
    // al abrir una ficha, el chat se minimiza para dejar ver la página; la conversación se conserva
    els.m.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a && a.getAttribute('href') && a.getAttribute('href').indexOf(BASE) === 0 && !a.target) cerrar(); });
    function pos() { var fab = document.querySelector('.fab'); els.l.style.bottom = (fab && fab.offsetHeight ? fab.offsetHeight + 22 : 14) + 'px'; }
    pos(); window.addEventListener('resize', pos);
    // memoria de la conversación mientras dure la visita (se conserva al abrir una ficha)
    try {
      var st = JSON.parse(sessionStorage.getItem(SS) || 'null');
      if (st && st.h) {
        els.m.innerHTML = st.h; F = st.F || {}; shown = st.shown || 0; chips(st.c);
        load().then(function () { if (st.ids) { var by = {}; D.remates.forEach(function (r) { by[r[0]] = r; }); last = st.ids.map(function (i) { return by[i]; }).filter(Boolean); } });
        if (st.open) abrir();
      }
    } catch (e) { }
  }
  function abrir() {
    els.abierto = true; els.p.classList.add('on'); els.l.style.display = 'none';
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
  var CH_INICIO = [['Casas en Lima', 'casa en lima'], ['Departamentos en Lima', 'departamento en lima'], ['Terrenos', 'busco terrenos'], ['En provincias', 'propiedades en provincias'], ['Lo más barato', 'lo más barato en soles'], ['¿Dónde hay remates?', 'donde hay remates'], ['¿Cómo funciona?', 'como funciona un remate']];
  function inicio() {
    var u = D.ediciones.filter(function (e) { return e.fecha === D.ult; })[0];
    say('¡Hola! Soy <b>Robotín</b>, el asistente automático de los remates judiciales de Víctor Ventura. Tengo <b>' + D.remates.length + ' remates</b> publicados en ' + D.ediciones.length + ' ediciones; la última es del <a href="' + BASE + D.ult + '/">' + fdate(D.ult) + '</a>' + (u ? ' (' + esc(u.resumen.split('·')[0].trim()) + ')' : '') + '.<br><br>Cuéntame con tus palabras qué buscas y dónde. Por ejemplo: <i>«busco propiedades en Lince»</i> o <i>«una casa para vivir en Trujillo hasta 100 mil dólares»</i>. Si no hay nada exacto, te muestro lo más cercano.', 600, CH_INICIO);
  }

  /* ================= respuestas ================= */
  function item(r) {
    var a = area(r), c = (r[13] || '').trim(), sin = /ninguna declarada/i.test(c);
    return '<div class="rb-it"><div><b>N.° ' + esc(r[0]) + '</b> · ' + esc(r[1]) + '</div><div>' + esc(r[2]) + (a && r[2].indexOf('m²') < 0 ? ' · ' + a.toLocaleString('en-US') + ' m²' : '') + '</div><div class="t">Base ' + esc(money(r)) + '</div><div style="color:#5A6470">' + (sin ? 'Sin cargas declaradas' : 'Con cargas: ' + esc(c.length > 90 ? c.slice(0, 88) + '…' : c)) + ' · edición ' + fdate(r[4]) + '</div><div class="z"><a href="' + link(r) + '">Ver ficha</a><a target="_blank" rel="noopener" href="' + wa('Hola Víctor, quiero apoyo con el remate N.° ' + r[0] + ' (' + r[1] + ', ' + r[2] + ', base ' + money(r) + ') de REMAJU. Vi la información en venturalegal.pe/remates') + '">Consultar con Víctor</a></div></div>';
  }
  var PIE = '<small style="color:#5A6470">Información referencial de REMAJU. Verifica la partida en SUNARP, la posesión y las bases antes de ofertar.</small>';
  function mostrar(list, desde, extra) {
    var pg = list.slice(desde, desde + 5), h = '';
    pg.forEach(function (r) { h += item(r); });
    shown = desde + pg.length;
    var c = [];
    if (shown < list.length) c.push(['Ver más (' + (list.length - shown) + ')', 'ver mas']);
    (extra || []).forEach(function (x) { c.push(x); });
    if (!F.sc) c.push(['Solo sin cargas', 'solo sin cargas']);
    if (F.ord !== 'asc') c.push(['Más barato', 'lo mas barato']);
    if (!c.some(function (x) { return x[1] === 'abrir alertas'; })) c.push(['Crear alerta con esto', 'abrir alertas']);
    c.push(['Nueva búsqueda', 'empezar de nuevo']);
    return [h, c];
  }
  function ordenTxt(f, n) { return n > 5 ? ' Te muestro ' + (f.ord === 'asc' ? 'los más baratos' : f.ord === 'desc' ? 'los de mayor base' : f.ord === 'area' ? 'los de mayor área' : 'los más recientes') + ':' : ''; }
  function cuantos(n) { return n === 1 ? 'este remate' : 'estos <b>' + n + '</b>'; }
  function regionesCon(list, deps) { var s = {}; list.forEach(function (r) { var d = G[r[0]].dep; if (deps.indexOf(d) >= 0) s[DEPS[d][0]] = 1; }); return Object.keys(s).join(', '); }

  // Devuelve [html, chips] con coincidencia exacta o con la mejor aproximación
  function resolver(f, nota) {
    var list = buscar(f), pl = f.lug && f.lug[0], lugar = f.lug ? nombreLugar(f) : '', n;
    shown = 0;
    if (list.length) {
      last = list; var r = mostrar(list, 0), ex = '';
      if (pl && pl.k === 'dist') { var hom = D.remates.filter(function (x) { var g = G[x[0]]; return !g.metro && g.parts.indexOf(pl.key) >= 0; }); if (hom.length) ex = ' <small>(Hay otro lugar llamado ' + esc(pl.n) + ' fuera de Lima con ' + hom.length + ' remate' + (hom.length > 1 ? 's' : '') + '; si te referías a ese, dime la región.)</small>'; }
      return ['Sí, encontré <b>' + list.length + '</b> ' + (list.length === 1 ? 'remate' : 'remates') + ': ' + esc(resumenFiltro(f)) + '.' + (nota ? ' ' + nota : '') + ex + ordenTxt(f, list.length) + r[0] + PIE, r[1]];
    }
    var otros = (f.tipo && f.tipo.length) || f.min != null || f.max != null || f.area != null || f.sc || f.mon;
    var levels = pl ? niveles(pl) : [], i, lv, alt;
    var todoLugar = pl ? buscar({ lug: f.lug }).length : 0;
    var extra = [];
    if (pl && todoLugar) extra.push(['Ver todo en ' + pl.n + ' (' + todoLugar + ')', 'todo lugar']);
    if (pl) extra.push(['Avísame si sale algo en ' + pl.n, 'abrir alertas']);
    var noHay = pl ? 'En estos días no hay remates publicados de <b>' + esc(que(f)) + '</b> en <b>' + esc(lugar) + '</b>' + (precioTxt(f) ? ' ' + esc(precioTxt(f)) : '') + '.' : 'No encontré remates de <b>' + esc(resumenFiltro(f)) + '</b> entre los publicados.';
    // 1) mismo pedido, lugares cercanos
    for (i = 0; i < levels.length; i++) {
      lv = levels[i]; alt = buscar(f, lv.t);
      if (alt.length) {
        last = alt; var r1 = mostrar(alt, 0, extra), ex1 = explica(pl), dnd = lv.l + (lv.v ? ' (' + regionesCon(alt, lv.v) + ')' : '');
        return [noHay + ' ' + (ex1 ? 'Pero como ' + ex1 + ', ' : 'Pero ') + (alt.length === 1 ? 'te puede interesar' : 'te pueden interesar') + ' ' + cuantos(alt.length) + ' ' + dnd + ':' + r1[0] + PIE, r1[1]];
      }
    }
    // 2) mismo lugar (y luego cercanos), flexibilizando el pedido
    var relax = [];
    if (f.max != null || f.min != null) { var g1 = clon(f); if (g1.max != null) g1.max = g1.max * 1.25; if (g1.min != null) g1.min = g1.min * 0.75; relax.push([g1, 'ajustando un poco el presupuesto (' + precioTxt({ mon: g1.mon, min: g1.min, max: g1.max }).replace('con base ', '') + ')']); }
    if (f.tipo && f.tipo.length) { var g2 = clon(f); delete g2.tipo; relax.push([g2, 'de otros tipos de inmueble']); }
    if (f.area != null || f.sc) { var g3 = clon(f); delete g3.area; delete g3.sc; relax.push([g3, 'sin exigir ' + [f.area != null ? 'esa área' : '', f.sc ? 'que estén libres de cargas' : ''].filter(Boolean).join(' ni ')]); }
    if (otros) { var g4 = { lug: f.lug, ord: f.ord }; relax.push([g4, 'con otras características']); }
    var scopes = [null].concat(levels);
    for (var j = 0; j < relax.length; j++) for (i = 0; i < scopes.length; i++) {
      lv = scopes[i]; alt = lv ? buscar(relax[j][0], lv.t) : buscar(relax[j][0]);
      if (alt.length) {
        last = alt; var r2 = mostrar(alt, 0, extra);
        var donde = !pl ? '' : lv ? ' ' + lv.l + (lv.v ? ' (' + regionesCon(alt, lv.v) + ')' : '') : ' en ' + esc(lugar);
        return [noHay + ' Lo más aproximado que tengo ' + (alt.length === 1 ? 'es' : 'son') + ' ' + cuantos(alt.length) + ' ' + relax[j][1] + donde + ':' + r2[0] + PIE, r2[1]];
      }
    }
    // 3) nada parecido
    var rec = buscar({ ord: 'rec' }).slice(0, 3); last = rec; n = '';
    rec.forEach(function (x) { n += item(x); }); shown = rec.length;
    return [noHay + ' Tampoco encontré algo parecido cerca. Puedes <b>crear una alerta</b> y Víctor te avisa cuando salga uno. Mientras tanto, estos son los más recientes:' + n + PIE, [['Crear alerta con esto', 'abrir alertas'], ['¿Dónde hay remates?', 'donde hay remates'], ['Nueva búsqueda', 'empezar de nuevo']]];
  }
  function responderBusqueda(f, nota) {
    if ((f.ord === 'asc' || f.ord === 'desc') && !f.mon) {
      var l0 = buscar(f);
      if (l0.some(function (r) { return mon(r) === 'US$'; }) && l0.some(function (r) { return mon(r) === 'S/'; })) { say('Para ordenar por precio necesito comparar en la misma moneda. ¿Te los muestro en <b>soles</b> o en <b>dólares</b>?', 400, [['En soles', 'en soles'], ['En dólares', 'en dólares']]); return; }
    }
    var aviso = 'Voy a revisar si hay <b>' + esc(que(f)) + '</b>' + (f.lug ? ' en <b>' + esc(nombreLugar(f)) + '</b>' : '') + (precioTxt(f) ? ' ' + esc(precioTxt(f)) : '') + ' en mi base de remates…';
    revisarYResponder(aviso, function () { return resolver(f, nota); });
  }
  function ficha(n) {
    var r = D.remates.filter(function (x) { return x[0] === n; })[0];
    if (!r) { say('No tengo el remate N.° ' + esc(n) + ' en las ediciones publicadas (desde el 6 de noviembre de 2026). Prueba con el <a href="' + BASE + 'buscar/">buscador</a> o descríbeme lo que buscas.', 400, CH_INICIO); return; }
    var h = item(r) + '<div style="font-size:13px">Tasación: <b>' + esc(r[6]) + '</b><br>Base (2/3): <b>' + esc(r[3]) + '</b><br>Oblaje: ' + esc(r[8]) + ' · Arancel: ' + esc(r[9]) + '<br>Partida: ' + esc(r[10]) + '</div><small style="color:#5A6470">Información referencial. Confirma datos y bases en REMAJU.</small>';
    revisarYResponder('Voy a buscar el remate <b>N.° ' + esc(n) + '</b> en mi base…', function () { return ['Esto tengo del remate <b>N.° ' + esc(r[0]) + '</b>:' + h, [['Hablar con Víctor sobre este remate', 'asesoria ' + r[0]], ['Revisión de título y cargas', 'titulo ' + r[0]], ['Nueva búsqueda', 'empezar de nuevo']]]; });
  }
  function cobertura() {
    var c = {}, lm = 0, ca = 0;
    D.remates.forEach(function (r) { var g = G[r[0]]; if (g.metro) lm++; else if (g.dep === 'callao') ca++; else if (g.dep) { var k = g.dep === 'lima' ? 'Lima provincias' : DEPS[g.dep][0]; c[k] = (c[k] || 0) + 1; } });
    var t = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).map(function (k) { return k + ' (' + c[k] + ')'; }).join(', ');
    return ['Ahora mismo tengo remates en: <b>Lima Metropolitana (' + lm + ')</b>' + (ca ? ', <b>Callao (' + ca + ')</b>' : '') + ' y en provincias: ' + esc(t) + '.<br><br>Dime un distrito, ciudad o región y te muestro lo que hay; si no hay nada exacto, te enseño lo más cercano.', [['Lima Moderna', 'propiedades en lima moderna'], ['Lima Norte', 'propiedades en lima norte'], ['Lima Este', 'propiedades en lima este'], ['Lima Sur', 'propiedades en lima sur'], ['Norte del Perú', 'propiedades en el norte del peru'], ['Sur del Perú', 'propiedades en el sur del peru'], ['Selva', 'propiedades en la selva']]];
  }
  var FAQ = [
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
  function wasolicitud(n) {
    var t = 'Hola Víctor, escribo desde Robotín (venturalegal.pe/remates).';
    if (n) { var r = D.remates.filter(function (x) { return x[0] === n; })[0]; t += ' Quiero apoyo con el remate N.° ' + n + (r ? ' (' + r[1] + ', ' + r[2] + ', base ' + money(r) + ')' : '') + '.'; }
    else { t += tiene(F) ? ' Estoy buscando: ' + resumenFiltro(F) + '.' : ' Quiero orientación sobre un remate judicial.'; if (last && last.length && tiene(F)) t += ' Me interesan, entre otros, los N.° ' + last.slice(0, 3).map(function (r) { return r[0]; }).join(', ') + '.'; }
    return wa(t);
  }
  function enviar(txt, etiqueta) { user(etiqueta || txt); load().then(function () { procesar(txt); }); }
  function procesar(txt) {
    var m = limpio(txt), k;
    if (/^(empezar de nuevo|nueva busqueda|reiniciar|borrar|limpiar)/.test(m)) { F = {}; last = null; say('Listo, empecemos de nuevo. ¿Qué buscas y dónde? Puedes decirme también tu presupuesto.', 350, CH_INICIO); return; }
    if (/^ver mas/.test(m)) { if (last && shown < last.length) { var r = mostrar(last, shown); say(r[0], 500, r[1]); } else say('No hay más resultados en esta búsqueda.', 300, CH_INICIO); return; }
    if (/^todo lugar/.test(m) && F.lug) { F = { lug: F.lug }; responderBusqueda(F); return; }
    if (/^abrir alertas/.test(m)) {
      var q = [], pl = F.lug && F.lug[0];
      if (pl && /dist|calld|ciudad|dep/.test(pl.k)) q.push('ub=' + encodeURIComponent(pl.n)); else if (pl && /metro|zona/.test(pl.k)) q.push('ub=Lima');
      if (F.mon) q.push('mon=' + encodeURIComponent(F.mon)); if (F.min != null) q.push('min=' + Math.round(F.min)); if (F.max != null) q.push('max=' + Math.round(F.max)); if (F.area != null) q.push('area=' + F.area); if (F.tipo && F.tipo.length) q.push('tp=' + F.tipo[0]); if (F.sc) q.push('sc=1');
      guardar(); location.href = BASE + 'alertas/' + (q.length ? '?' + q.join('&') : ''); return;
    }
    var mw = m.match(/^(asesoria|titulo)\s*(\d{5})?$/);
    if (mw) { say('Te abro WhatsApp con un mensaje ya escrito para Víctor' + (mw[2] ? ' sobre el remate N.° ' + esc(mw[2]) : '') + '. Solo tienes que enviarlo.<br><a target="_blank" rel="noopener" href="' + wasolicitud(mw[2]) + '"><b>Abrir WhatsApp →</b></a><br><small style="color:#5A6470">Atiende Víctor Ventura personalmente; las respuestas de Robotín no constituyen asesoría legal.</small>', 400, [['Seguir buscando', 'empezar de nuevo']]); return; }
    var o = parse(txt);
    if (o.n && !o.lug && !o.tipo) { ficha(o.n); return; }
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
    ['lug', 'tipo', 'mon', 'area', 'sc', 'ord'].forEach(function (x) { if (o[x] != null) nfil[x] = o[x]; });
    if (o.min != null || o.max != null) { delete nfil.min; delete nfil.max; if (o.min != null) nfil.min = o.min; if (o.max != null) nfil.max = o.max; }
    F = nfil;
    var nota = '';
    if (o.aprox) nota = 'Busqué alrededor de ' + (F.mon ? F.mon + ' ' : '') + nf(o.aprox) + ' (25 % arriba o abajo).';
    else if (o.maxImplicito) nota = 'Tomé ese monto como presupuesto máximo para la base.';
    if ((F.max != null || F.min != null) && !F.mon) nota += ' Como no me dijiste la moneda, comparé el monto tanto en soles como en dólares.';
    if (o.uso) nota += ' Entendí que es ' + o.uso + '.';
    responderBusqueda(F, nota.trim());
  }

  function iniciar() { if (document.querySelector('.rb-l')) return; build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
