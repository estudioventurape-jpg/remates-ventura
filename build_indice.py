#!/usr/bin/env python3
"""Genera remates.json (índice de ediciones y de todos los remates) leyendo las carpetas AAAA-MM-DD/.
Uso: python3 build_indice.py   (desde la raíz del repo). Cada remate: [numero, ubicacion, inmueble, base, fecha, flag, tasacion, incremento, oblaje, arancel, partida, expediente, resolucion, cargas, direccion]. También agrega el botón «Ediciones y buscador»
a las páginas que aún no lo tengan."""
import re, json, html, glob, os
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
