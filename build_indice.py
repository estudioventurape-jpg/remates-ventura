#!/usr/bin/env python3
"""Genera remates.json (índice de ediciones y de todos los remates) leyendo las carpetas AAAA-MM-DD/.
Uso: python3 build_indice.py   (desde la raíz del repo). Cada remate: [numero, ubicacion, inmueble, base, fecha, flag, tasacion, incremento, oblaje, arancel, partida, expediente, resolucion, cargas, direccion]. También agrega el botón «Ediciones y buscador»
a las páginas que aún no lo tengan."""
import re, json, html, glob, os
# ENLACE DE INVITACIÓN AL GRUPO DE WHATSAPP DE REMATES (pégalo aquí cuando exista y vuelve a ejecutar el script).
# Si está vacío, solo se muestra el botón flotante «Escríbeme».
GRUPO_URL = ''
WA_DIRECTO = 'https://wa.me/51927995630?text=Hola%20V%C3%ADctor%2C%20quiero%20apoyo%20con%20un%20remate%20de%20REMAJU'
BTN = '<a class="btn" href="/remates/buscar/">Ediciones anteriores y buscador</a>'
ediciones, remates = [], []
for d in sorted(glob.glob('20??-??-??'), reverse=True):
    p = os.path.join(d, 'index.html')
    if not os.path.isfile(p): continue
    s = open(p, encoding='utf-8').read()
    sub = re.search(r'<div class="sub">(.*?)</div>', s)
    sub = html.unescape(re.sub('<.*?>', '', sub.group(1))) if sub else d
    n_in = re.search(r'(\d+)\s+inmuebles', sub)
    ids = set(re.findall(r'id="r(\w+)"', s))
    filas = re.findall(r'<tr data-q="[^"]*"><td class="n">(.*?)</td><td><b>(.*?)</b><br><span class="s2">(.*?)</span></td><td class="m">(.*?)</td></tr>', s, re.S)
    pdf = next((os.path.basename(x) for x in glob.glob(os.path.join(d, '*.pdf'))), '')
    ediciones.append({'fecha': d, 'url': f'/remates/{d}/', 'pdf': f'/remates/{d}/{pdf}' if pdf else '', 'resumen': sub, 'n': len(filas)})
    # datos ampliados de cada tarjeta (se agregan AL FINAL de cada fila para no romper al buscador)
    detalle = {}
    for art in re.findall(r'<article class="card" id="r(?:\w+)".*?</article>', s, re.S):
        cl = lambda t: html.unescape(re.sub('<.*?>', '', t)).strip() if t else ''
        m = re.search(r'<span class="cn">(.*?)</span>', art)
        if not m: continue
        num = cl(m.group(1))
        g = lambda rx: (re.search(rx, art, re.S) or [None, ''])[1]
        dl = dict(re.findall(r'<dt>(.*?)</dt><dd>(.*?)</dd>', art, re.S))
        cx = cl(g(r'<p class="cx">(.*?)</p>'))
        part = re.search(r'Partida\s+(\S+)', cx); exp = re.search(r'Exp\.\s+(\S+)', cx); res = re.search(r'(Res\..*)$', cx)
        detalle[num] = [cl(g(r'<span>(Tasación[^<]*)</span>')).replace('Tasación', '').strip(),
                        cl(dl.get('Incremento', '')), cl(dl.get('Oblaje', '')), cl(dl.get('Arancel', '')),
                        part.group(1) if part else '', exp.group(1) if exp else '',
                        res.group(1).strip() if res else '', cl(g(r'<p class="cg">(.*?)</p>')).replace('Cargas:', '').strip(),
                        cl(g(r'<p class="cd">(.*?)</p>'))]
    for n, ubic, inm, base in filas:
        c = lambda t: html.unescape(re.sub('<.*?>', '', t)).strip()
        n = c(n)
        remates.append([n, c(ubic), c(inm), c(base), d, 1 if n in ids else 0] + detalle.get(n, [''] * 9))
json.dump({'ediciones': ediciones, 'remates': remates}, open('remates.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(ediciones), 'ediciones;', len(remates), 'remates')
# botón en las páginas (raíz y carpetas)
for p in ['index.html'] + [os.path.join(e['fecha'], 'index.html') for e in ediciones]:
    s = open(p, encoding='utf-8').read()
    if '/remates/buscar/' in s: continue
    s2 = re.sub(r'(<div class="cta">.*?)(</div>)', lambda m: m.group(1) + BTN + m.group(2), s, count=1, flags=re.S)
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2); print('botón agregado:', p)

# botones flotantes de WhatsApp (se regeneran en cada ejecución entre los marcadores)
FAB_CSS = '<style>.fab{position:fixed;right:14px;bottom:14px;z-index:50;display:flex;flex-direction:column;gap:8px;align-items:flex-end}.fab a{display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:30px;color:#fff;font:600 14px Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.28)}.fab .g1{background:#2A4A9C}.fab .g2{background:#25a244}@media(max-width:520px){.fab a{padding:11px 14px;font-size:13px}}@media print{.fab{display:none}}</style>'
def fab_html():
    # Sin botón flotante de WhatsApp (decisión de Víctor, 19/11/2026): la invitación flotante es «Conversa con Robotín».
    # Si existe GRUPO_URL se muestra solo el enlace al grupo.
    g = f'<div class="fab"><a class="g1" href="{GRUPO_URL}" target="_blank" rel="noopener">Únete al grupo de remates</a></div>' if GRUPO_URL else ''
    return f'<!--fab-->{FAB_CSS if GRUPO_URL else ""}{g}<script src="/remates/robotin/robotin.js?v=9" defer></script><!--/fab-->'
paginas = ['index.html', os.path.join('buscar', 'index.html'), os.path.join('alertas', 'index.html'), os.path.join('sunat', 'index.html'), os.path.join('indecopi', 'index.html')] + [os.path.join(e['fecha'], 'index.html') for e in ediciones]
for p in paginas:
    if not os.path.isfile(p): continue
    s = open(p, encoding='utf-8').read()
    if '<!--fab-->' in s:
        s2 = re.sub(r'<!--fab-->.*?<!--/fab-->', lambda m: fab_html(), s, flags=re.S)
    else:
        s2 = s.replace('</body>', fab_html() + '</body>', 1)
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
print('botones flotantes en', len(paginas), 'páginas')

# botón «Crear una alerta» junto a «Ediciones anteriores y buscador»
BTN_AL = '<a class="btn al" href="/remates/alertas/">Crear una alerta</a>'
for p in ['index.html', os.path.join('buscar', 'index.html')] + [os.path.join(e['fecha'], 'index.html') for e in ediciones]:
    s = open(p, encoding='utf-8').read()
    if '/remates/alertas/' in s: continue
    s2 = re.sub(r'(<div class="cta">.*?)(</div>)', lambda m: m.group(1) + BTN_AL + m.group(2), s, count=1, flags=re.S)
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
print('botón de alertas listo')

# Portada con Robotín en lugar del «Resumen» (decisión de Víctor, 19/11/2026): se quita la tabla resumen para que se vea
# directo el detalle y Robotín sea el protagonista. Funciona aunque la plantilla diaria siga generando el Resumen.
HERO_CSS = '<style>.rbh{display:flex;align-items:center;gap:22px;margin:30px 0 8px;padding:22px 26px;background:linear-gradient(120deg,#16295C 0%,#2A4A9C 60%,#3B63C9 100%);color:#fff;border-radius:18px;position:relative;overflow:hidden}.rbh:before{content:"";position:absolute;right:-60px;top:-60px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.07)}.rbh img{width:190px;height:190px;flex:none;filter:drop-shadow(0 10px 16px rgba(0,0,0,.4));animation:rbhf 3s ease-in-out infinite;cursor:pointer;position:relative}@keyframes rbhf{50%{transform:translateY(-8px) rotate(-2deg)}}.rbh .tx{position:relative;min-width:0}.rbh .k{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#FFC94D;font-weight:600}.rbh h2{font-family:Newsreader,Georgia,serif;font-weight:500;font-size:clamp(26px,4.4vw,38px);line-height:1.08;margin:4px 0 8px;border:0;padding:0;color:#fff}.rbh p{margin:0 0 14px;font-size:15px;color:#DCE4F7;max-width:560px}.rbh .go{display:inline-block;background:#FF9F1C;color:#14213D;font-weight:700;font-size:16px;padding:13px 22px;border-radius:30px;border:0;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.3);font-family:inherit}.rbh .go:hover{background:#FFB347}.rbh .ej{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.rbh .ej button{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.45);color:#fff;border-radius:18px;padding:6px 12px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}.rbh .ej button:hover{background:rgba(255,255,255,.25)}@media(max-width:640px){.rbh{flex-direction:column;text-align:center;padding:20px 16px;gap:8px}.rbh img{width:150px;height:150px}.rbh .ej{justify-content:center}.rbh p{font-size:14px}}@media print{.rbh{display:none}}</style>'
HERO = ('<!--rb-hero-->' + HERO_CSS + '<section class="rbh" aria-label="Robotín, asistente de remates">'
        '<img src="/remates/robotin/robotin.png" alt="Robotín, asistente de remates" width="190" height="190" data-robotin-open>'
        '<div class="tx"><div class="k">Asistente automático</div><h2>¿Buscas un remate? Pregúntale a Robotín</h2>'
        '<p>Dile qué buscas y dónde, y te muestra las opciones al instante. Si no hay nada exacto, te enseña lo más cercano.</p>'
        '<button class="go" type="button" data-robotin-open>Conversar con Robotín</button>'
        '<div class="ej"><button type="button" data-robotin-q="casa en lima">Casas en Lima</button><button type="button" data-robotin-q="departamento en lima">Departamentos en Lima</button><button type="button" data-robotin-q="busco terrenos">Terrenos</button><button type="button" data-robotin-q="propiedades en provincias">En provincias</button><button type="button" data-robotin-q="lo más barato en soles">Lo más barato</button></div>'
        '</div></section><!--/rb-hero-->')
n_hero = 0
for p in ['index.html'] + [os.path.join(e['fecha'], 'index.html') for e in ediciones]:
    if not os.path.isfile(p): continue
    s = open(p, encoding='utf-8').read(); s2 = s
    if '<!--rb-hero-->' in s2:
        s2 = re.sub(r'<!--rb-hero-->.*?<!--/rb-hero-->', lambda m: HERO, s2, flags=re.S)
    m = re.search(r'<h2 class="s"><span>01</span>Resumen</h2>(.*?)(?=<h2 class="s"><span>02</span>)', s2, flags=re.S)
    if m:
        nota = re.search(r'<p class="note">.*?</p>', m.group(1), flags=re.S)
        filtro = '<input id="q" type="search" placeholder="Filtrar las fichas de esta página por número, distrito o tipo" aria-label="Filtrar fichas">'
        # la tabla NO se borra: queda oculta porque este script lee de ella los datos de remates.json
        tabla = re.search(r'<div class="tw">.*?</table></div>', m.group(1), flags=re.S)
        oculto = '<div hidden data-resumen="1">' + (tabla.group(0) if tabla else '') + '</div>'
        s2 = s2[:m.start()] + (HERO if '<!--rb-hero-->' not in s2 else '') + oculto + '\n' + s2[m.end():]
        s2 = s2.replace('<h2 class="s"><span>02</span>Detalle</h2>', '<h2 class="s"><span>01</span>Detalle</h2>' + (nota.group(0) if nota else '') + filtro, 1)
        s2 = re.sub(r'<h2 class="s"><span>03</span>', '<h2 class="s"><span>02</span>', s2, count=1)
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
    if '<!--rb-hero-->' in s2: n_hero += 1
print('portada de Robotín (sin tabla resumen) en', n_hero, 'páginas')

# Imagen al compartir el enlace (WhatsApp, Facebook, etc.): Robotín (decisión de Víctor, 19/11/2026).
# La imagen anterior (remates-del-dia.png, 5.6 MB) era demasiado pesada y WhatsApp no la mostraba.
OG_IMG = 'https://venturalegal.pe/remates/robotin/robotin-og.jpg?v=1'
OG = ('<!--og-->' + f'<meta property="og:image" content="{OG_IMG}"><meta property="og:image:secure_url" content="{OG_IMG}">'
      '<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
      '<meta property="og:image:alt" content="Robotín, asistente de remates judiciales de Ventura Legal"><meta property="og:site_name" content="Ventura Legal · Remates judiciales">'
      f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{OG_IMG}">' + '<!--/og-->')
n_og = 0
for p in paginas:
    if not os.path.isfile(p): continue
    s = open(p, encoding='utf-8').read()
    s2 = re.sub(r'<!--og-->.*?<!--/og-->\n?', '', s, flags=re.S)
    s2 = re.sub(r'<meta property="og:image[^>]*>\n?', '', s2)
    s2 = s2.replace('</head>', OG + '\n</head>', 1) if '</head>' in s2 else s2.replace('<style>', OG + '\n<style>', 1)
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
    if '<!--og-->' in s2: n_og += 1
print('imagen para compartir (Robotín) en', n_og, 'páginas')

# Pestañas de fuentes (Poder Judicial · SUNAT · INDECOPI) bajo la cabecera de todas las páginas (19/11/2026).
# Los datos de SUNAT e INDECOPI salen de otros/*.json con build_otros.py (ejecutarlo ANTES que este script).
try: RES = json.load(open(os.path.join('otros', 'resumen.json'), encoding='utf-8'))
except Exception: RES = {}
TAB_CSS = '<style>.fts{border-bottom:1px solid #DFE3EA;background:#F2F5FB}.fts .w{display:flex;gap:6px;padding:8px 16px;overflow-x:auto}.fts a{white-space:nowrap;text-decoration:none;color:#20397A;font:600 13.5px Inter,system-ui,sans-serif;padding:8px 14px;border-radius:20px;border:1px solid #C9D3EC;background:#fff}.fts a.on{background:#2A4A9C;color:#fff;border-color:#2A4A9C}.fts a small{font-weight:500;opacity:.8;margin-left:4px}@media print{.fts{display:none}}</style>'
def tabs(p):
    sec = 'sunat' if p.startswith('sunat') else 'indecopi' if p.startswith('indecopi') else 'pj'
    ns = RES.get('sunat', {}).get('n'); ni = RES.get('indecopi', {}).get('n')
    t = [('pj', '/remates/', 'Poder Judicial (REMAJU)', f'{len(remates)}'), ('sunat', '/remates/sunat/', 'SUNAT', str(ns) if ns is not None else ''), ('indecopi', '/remates/indecopi/', 'INDECOPI', (str(ni) if ni else 'sin remate vigente') if ni is not None else '')]
    return '<!--fts-->' + TAB_CSS + '<nav class="fts" aria-label="Fuentes de remates"><div class="w">' + ''.join(f'<a href="{u}"{" class=\"on\"" if k == sec else ""}>{n}{"<small>" + c + "</small>" if c else ""}</a>' for k, u, n, c in t) + '</div></nav><!--/fts-->'
n_t = 0
for p in paginas:
    if not os.path.isfile(p): continue
    s = open(p, encoding='utf-8').read()
    s2 = re.sub(r'<!--fts-->.*?<!--/fts-->', '', s, flags=re.S)
    s2 = s2.replace('</header>', '</header>' + tabs(p), 1)
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
    if '<!--fts-->' in s2: n_t += 1
print('pestañas de fuentes en', n_t, 'páginas')

# MARCA «Ventura Legal» (decisión de Víctor, 19/11/2026: uniformizar la marca; ya no «Estudio Ventura abogados»).
# Se aplica a TODAS las páginas en cada ejecución, aunque la plantilla diaria traiga la marca anterior:
#  - cabecera: logo + «Ventura Legal · Remates», con enlace a la página principal de Ventura Legal;
#  - botón «Ediciones anteriores y buscador» arriba a la derecha (se quita del grupo de botones para no distraer de «Descargar PDF»);
#  - botón «Crear una alerta» destacado (es el servicio principal de la página);
#  - pie: solo «Ventura Legal» (sin el nombre de Víctor), conservando dirección, correo y teléfono.
MARCA_CSS = ('<!--marca--><style>header.top .w{gap:12px}a.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#0E1216;font-family:Newsreader,Georgia,serif;font-size:21px;font-weight:500;min-width:0}'
  'a.brand img{width:38px;height:38px;flex:none}a.brand span{white-space:nowrap}a.brand small{font-family:Inter,sans-serif;font-size:11px;letter-spacing:1.6px;color:#2A4A9C;text-transform:uppercase;font-weight:600;margin-left:2px;padding-left:10px;border-left:1px solid #C3C9D4}'
  'a.brand:hover span{text-decoration:underline}.hbtn{flex:none;text-decoration:none;font:600 13px Inter,system-ui,sans-serif;color:#20397A;border:1px solid #C3C9D4;padding:8px 14px;border-radius:20px;background:#fff;white-space:nowrap}.hbtn:hover{background:#F2F5FB}.hbtn i{font-style:normal}'
  '@media(max-width:600px){a.brand{font-size:18px}a.brand img{width:32px;height:32px}.hbtn{padding:7px 11px;font-size:12px}.hbtn i{display:none}}'
  '.btn.al{position:relative;overflow:hidden;background:linear-gradient(135deg,#FF9F1C,#FF7A00);border-color:#FF8A0A;color:#14213D;font-weight:700;padding-left:44px;box-shadow:0 6px 16px rgba(255,138,10,.38);border-radius:4px}'
  '.btn.al:before{content:"";position:absolute;left:16px;top:50%;width:18px;height:18px;margin-top:-9px;background:#14213D;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z%27/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z%27/%3E%3C/svg%3E") center/contain no-repeat;animation:alb 2.6s ease-in-out infinite;transform-origin:50% 10%}'
  '@keyframes alb{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-16deg)}82%{transform:rotate(14deg)}88%{transform:rotate(-9deg)}94%{transform:rotate(6deg)}}'
  '.btn.al:after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);animation:als 3.2s ease-in-out infinite}@keyframes als{0%,55%{left:-60%}100%{left:130%}}'
  '.btn.al em{font-style:normal;font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;background:#14213D;color:#fff;padding:2px 7px;border-radius:10px;margin-left:8px;vertical-align:1px}.btn.al:hover{filter:brightness(1.06)}'
  '@media(prefers-reduced-motion:reduce){.btn.al:before,.btn.al:after{animation:none}}@media print{.hbtn{display:none}}</style><!--/marca-->')
HEADER_VL = ('<header class="top"><div class="w"><a class="brand" href="https://venturalegal.pe/" title="Ir a la página principal de Ventura Legal">'
  '<img src="/remates/logo-ventura-legal.png" alt="" width="38" height="38"><span>Ventura Legal</span><small>Remates</small></a>'
  '<a class="hbtn" href="/remates/buscar/">Ediciones anteriores<i> y buscador</i></a></div></header>')
AL_BTN = '<a class="btn al" href="/remates/alertas/">Crear una alerta<em>gratis</em></a>'
n_m = 0
for p in paginas:
    if not os.path.isfile(p): continue
    s = open(p, encoding='utf-8').read()
    s2 = re.sub(r'<!--marca-->.*?<!--/marca-->\n?', '', s, flags=re.S)
    s2 = re.sub(r'<header class="top">.*?</header>', lambda m: HEADER_VL, s2, count=1, flags=re.S)
    s2 = s2.replace('</head>', MARCA_CSS + '\n</head>', 1)
    s2 = re.sub(r'<a class="btn[^"]*" href="/remates/buscar/">Ediciones anteriores y buscador</a>', '', s2)
    s2 = re.sub(r'<a class="btn[^"]*" href="/remates/alertas/">Crear una alerta(?:<em>gratis</em>)?</a>', lambda m: AL_BTN, s2)
    s2 = s2.replace('<div class="nm">Víctor Ventura</div><div>Director – Ventura Legal</div>', '<div class="nm">Ventura Legal</div>')
    s2 = s2.replace('· Estudio Ventura</title>', '· Ventura Legal</title>').replace('Estudio Ventura <i>abogados</i>', 'Ventura Legal').replace('Estudio Ventura Abogados', 'Ventura Legal').replace('Estudio Ventura', 'Ventura Legal')
    if s2 != s: open(p, 'w', encoding='utf-8').write(s2)
    n_m += 1
print('marca Ventura Legal (cabecera con logo, pie y botón de alertas) en', n_m, 'páginas')
