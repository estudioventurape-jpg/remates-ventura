#!/usr/bin/env python3
"""Genera /sunat/index.html y /indecopi/index.html a partir de otros/sunat.json y otros/indecopi.json.
Uso (raíz del repo): python3 build_otros.py   y DESPUÉS python3 build_indice.py (pone Robotín, pestañas de fuentes e imagen al compartir)."""
import json, html, re, os, datetime
E_ = html.escape
MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']
DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
def fl(f, dia=True):
    d = datetime.date.fromisoformat(f)
    return (DIA[d.weekday()] + ' ' if dia else '') + f'{d.day} de {MES[d.month - 1]} de {d.year}'
def fc(f): d = datetime.date.fromisoformat(f); return f'{d.day:02d}/{d.month:02d}/{d.year}'
def soles(v): return 'S/ ' + f'{v:,.2f}' if v else 'por confirmar'
base = open('alertas/index.html', encoding='utf-8').read()
STYLE = re.search(r'<style>.*?</style>', base, re.S).group(0)
FONTS = '\n'.join(re.findall(r'<link[^>]*fonts[^>]*>', base))
HEADER = re.search(r'<header class="top">.*?</header>', base, re.S).group(0)
FOOTER = re.search(r'<footer>.*?</footer>', base, re.S).group(0)
EXTRA = '<style>.fch{font-family:Newsreader,Georgia,serif;font-size:22px;font-weight:500;margin:26px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--l1)}.fch small{font-family:Inter,sans-serif;font-size:12px;color:var(--g2);margin-left:8px;letter-spacing:.4px}.tag{display:inline-block;font-size:11px;letter-spacing:.6px;text-transform:uppercase;background:var(--soft);color:var(--dblue);padding:2px 8px;margin:0 6px 6px 0;font-weight:600}.tag.h{background:#FFE9C7;color:#7A4A00}.card h3{font-size:14.5px;line-height:1.35;font-weight:600}.of{display:block;text-align:center;margin-top:8px;font-size:13px;color:var(--dblue);font-weight:600}.hide{display:none!important}.vac{background:var(--soft2);border:1px solid var(--l2);padding:18px 20px;font-size:15px}table.h td{vertical-align:top}table.h a{color:var(--dblue);font-weight:600}</style>'
def pagina(titulo, desc, cuerpo, script=''):
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E_(titulo)} · Ventura Legal</title>
<meta name="description" content="{E_(desc)}">
<meta property="og:title" content="{E_(titulo)}">
<meta property="og:description" content="{E_(desc)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{FONTS}
{STYLE}{EXTRA}
</head><body>
{HEADER}
<main class="w">
{cuerpo}
</main>
{FOOTER}
{script}
</body></html>'''
CTA = '<div class="cta"><a class="btn p" href="/remates/">Remates del Poder Judicial</a><a class="btn al" href="/remates/alertas/">Crear una alerta</a></div>'
WA = 'https://wa.me/51927995630?text='
from urllib.parse import quote

# ---------------- SUNAT ----------------
S = json.load(open('otros/sunat.json', encoding='utf-8')); rem = S['remates']; act = S['actualizado']
fechas = sorted(set(r['fecha'] for r in rem))
h = [f'<div class="lab">Remates tributarios · SUNAT</div><h1>Remates de SUNAT</h1><div class="sub">{len(rem)} inmuebles en remate · lectura del {fl(act, False)}</div>', CTA,
     f'<p class="note" style="margin-top:14px">Inmuebles embargados por la SUNAT que salen a remate público (cobranza coactiva). Se muestran los remates con fecha de hoy en adelante, tomados de <a href="{S["fuente"]}" target="_blank" rel="noopener">rematestributarios.sunat.gob.pe</a>. El precio base y la tasación están en soles. El remate se hace en el local de la SUNAT que indica cada ficha, que puede estar en otra ciudad que el inmueble.</p>',
     '<input id="q" type="search" placeholder="Filtrar por ciudad, región o tipo de inmueble" aria-label="Filtrar remates">']
for f in fechas:
    grupo = [r for r in rem if r['fecha'] == f]
    h.append(f'<div class="fg" data-f="{f}"><h2 class="fch">Remate del {fl(f)}<small>{len(grupo)} inmuebles</small></h2><div class="grid">')
    for r in grupo:
        msg = f'Hola Víctor, quiero apoyo con un remate de SUNAT.\nRemate SUNAT N.°: {r["id"]} ({fc(r["fecha"])}, {r["region"]})\nInmueble: {r["titulo"][:140]}' + (f'\nPartida electrónica: {r["partida"]}' if r['partida'] else '')
        tags = f'<span class="tag">{E_(r["tipo"])}</span>' + (f'<span class="tag">{r["convocatoria"]} convocatoria</span>' if r['convocatoria'] else '') + (f'<span class="tag h">{E_(r["acciones"])} de acciones y derechos</span>' if r['acciones'] else '')
        h.append(f'''<article class="card" id="s{r["id"]}" data-q="{E_((r["id"] + " " + r["region"] + " " + r["dependencia"] + " " + r["tipo"] + " " + r["titulo"]).lower())}"><div class="ct"><span class="cn">{r["id"]}</span><span class="cl">{E_(r["region"])}</span></div>
<div style="margin-top:6px">{tags}</div><h3>{E_(r["titulo"])}</h3>
<div class="base"><span>Tasación {soles(r["tasacion"])}</span><b>Base {soles(r["base"])}</b></div>
<dl><div><dt>Fecha</dt><dd>{fc(r["fecha"])}</dd></div><div><dt>Hora</dt><dd>{E_(r["hora"] or "—")}</dd></div><div><dt>Sistema</dt><dd>{E_(r["sistema"] or "—")}</dd></div></dl>
<p class="cx">{("Partida " + E_(r["partida"]) + " · ") if r["partida"] else ""}Precios: {r["igv"]} · Sede SUNAT {E_(r["dependencia"])}</p>
<p class="cx">Lugar del remate: {E_(r["local"])}</p>
<p class="cg"><b>Cargas:</b> {E_(r["cargas"])} (detalle en el aviso oficial){(". <b>Ojo:</b> " + E_(r["obs"])) if r["obs"] else ""}</p>
<a class="wa" target="_blank" rel="noopener" href="{WA + quote(msg)}">Consultar por este remate</a><a class="of" target="_blank" rel="noopener" href="{r["url"]}">Ver aviso oficial en SUNAT</a></article>''')
    h.append('</div></div>')
h.append('<div class="vac hide" id="vac">Por ahora no hay remates de SUNAT vigentes en esta lista. Se actualiza de lunes a viernes.</div>')
h.append('<div class="av" style="margin-top:30px"><p style="margin:0">Información referencial tomada del portal de remates de la SUNAT en la fecha indicada; no constituye asesoría de inversión ni recomendación de compra. Los remates pueden suspenderse o modificarse: confirma siempre el aviso oficial, la partida en SUNARP y la posesión del inmueble. No se publican datos de los deudores.</p></div>')
JS = '''<script>(function(){var d=new Date(new Date().toLocaleString('en-US',{timeZone:'America/Lima'})),hoy=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2),n=0;
document.querySelectorAll('.fg').forEach(function(g){if(g.getAttribute('data-f')<hoy)g.classList.add('hide');else{n++;if(g.getAttribute('data-f')===hoy){var s=g.querySelector('small');s.textContent='HOY · '+s.textContent}}});
var v=document.getElementById('vac');if(v&&!n)v.classList.remove('hide');
var q=document.getElementById('q');if(q)q.addEventListener('input',function(){var t=q.value.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').trim();document.querySelectorAll('article.card').forEach(function(c){var k=c.getAttribute('data-q').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');c.classList.toggle('hide',t&&k.indexOf(t)<0)})})})();</script>'''
os.makedirs('sunat', exist_ok=True)
open('sunat/index.html', 'w', encoding='utf-8').write(pagina('Remates de SUNAT: inmuebles en remate', f'{len(rem)} inmuebles en remate de la SUNAT: base, tasación, fecha, lugar y cargas. Lectura del {fc(act)}. Información referencial.', '\n'.join(h), JS))

# ---------------- INDECOPI ----------------
I = json.load(open('otros/indecopi.json', encoding='utf-8')); act = I['actualizado']
prox = sorted(I.get('proximos', []), key=lambda x: x['fecha_remate']); hist = I.get('historial', [])
h = [f'<div class="lab">Ejecución coactiva · INDECOPI</div><h1>Remates de INDECOPI</h1><div class="sub">{"%d catálogo%s de remate vigente%s" % (len(prox), "s" * (len(prox) != 1), "s" * (len(prox) != 1)) if prox else "Sin remate comunicado por ahora"} · revisión del {fl(act, False)}</div>', CTA,
     f'<p class="note" style="margin-top:14px">El INDECOPI remata inmuebles embargados por su Unidad de Ejecución Coactiva. Publica el catálogo <b>pocos días antes</b> de cada remate en <a href="{I["fuente"]}" target="_blank" rel="noopener">gob.pe/indecopi</a>; por eso aquí verás dos fechas: la de <b>comunicación</b> (cuándo se publicó el catálogo) y la del <b>remate</b>. Revisamos la página de lunes a viernes.</p>']
if prox:
    for p in prox:
        h.append(f'<div class="fg" data-f="{p["fecha_remate"]}"><h2 class="fch">Remate del {fl(p["fecha_remate"])}<small>comunicado el {fc(p["fecha_comunicacion"])}</small></h2>')
        h.append(f'<p style="margin:0 0 10px"><span class="tag">{E_(p.get("zona", ""))}</span>' + (f'<span class="tag">{p["convocatoria"]} convocatoria</span>' if p.get('convocatoria') else '') + f'</p><p class="note">{E_(p["titulo"])}' + (f' {E_(p["lugar"])}' if p.get('lugar') else '') + '</p>')
        h.append('<div class="cta" style="margin:10px 0 14px">' + (f'<a class="btn p" href="{p["pdf_local"]}" target="_blank" rel="noopener">Descargar catálogo (PDF)</a>' if p.get('pdf_local') else '') + f'<a class="btn" href="{p["pdf"]}" target="_blank" rel="noopener">Catálogo en gob.pe</a><a class="btn" href="{p["url"]}" target="_blank" rel="noopener">Publicación oficial</a></div>')
        if p.get('items'):
            h.append('<div class="grid">')
            for k, it in enumerate(p['items'], 1):
                msg = f'Hola Víctor, quiero apoyo con un remate de INDECOPI.\nRemate del {fc(p["fecha_remate"])} · ítem {it.get("n", k)}\nInmueble: {it["titulo"][:140]}' + (f'\nPartida electrónica: {it["partida"]}' if it.get('partida') else '')
                h.append(f'''<article class="card" data-q=""><div class="ct"><span class="cn">Ítem {E_(str(it.get("n", k)))}</span><span class="cl">{E_(it.get("region", p.get("zona", "")))}</span></div><h3>{E_(it["titulo"])}</h3>
<div class="base"><span>Tasación {E_(it.get("tasacion", "ver catálogo"))}</span><b>Base {E_(it.get("base", "ver catálogo"))}</b></div>
<p class="cx">{("Partida " + E_(it["partida"])) if it.get("partida") else ""}</p><p class="cg"><b>Cargas:</b> {E_(it.get("cargas", "ver catálogo"))}</p>
<a class="wa" target="_blank" rel="noopener" href="{WA + quote(msg)}">Consultar por este inmueble</a></article>''')
            h.append('</div>')
        h.append('</div>')
h.append('<div class="vac' + (' hide' if prox else '') + '" id="vac"><b>No hay un remate de INDECOPI comunicado en este momento.</b> ' + (f'El último fue el {fl(hist[0]["fecha_remate"])} (catálogo comunicado el {fc(hist[0]["fecha_comunicacion"])}).' if hist else '') + ' Cuando publiquen un nuevo catálogo lo verás aquí, con el PDF para descargar. Si quieres que te avisemos, <a href="/remates/alertas/">crea una alerta</a>.</div>')
if hist:
    h.append('<h2 class="s"><span>·</span>Catálogos anteriores</h2><div class="tw"><table class="h"><tr><th>Remate</th><th>Comunicado</th><th>Catálogo</th><th class="k">Documento</th></tr>')
    for x in hist:
        h.append(f'<tr><td class="n">{fc(x["fecha_remate"])}</td><td>{fc(x["fecha_comunicacion"])}</td><td><b>{E_(x.get("zona", ""))}</b> · {E_(x.get("convocatoria", ""))} convocatoria<br><span class="s2" style="color:var(--g2);font-size:13px">{E_(x["titulo"])}{(" — " + E_(x["obs"])) if x.get("obs") else ""}</span></td><td class="m" style="font-family:Inter,sans-serif;font-size:14px"><a href="{x["pdf"]}" target="_blank" rel="noopener">PDF</a> · <a href="{x["url"]}" target="_blank" rel="noopener">gob.pe</a></td></tr>')
    h.append('</table></div>')
h.append('<div class="av" style="margin-top:30px"><p style="margin:0">Información referencial tomada de las publicaciones del INDECOPI en gob.pe en la fecha indicada; no constituye asesoría de inversión ni recomendación de compra. Confirma siempre el catálogo oficial, la partida en SUNARP y la posesión del inmueble.</p></div>')
JSI = '''<script>(function(){var d=new Date(new Date().toLocaleString('en-US',{timeZone:'America/Lima'})),hoy=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2),n=0;
document.querySelectorAll('.fg').forEach(function(g){if(g.getAttribute('data-f')<hoy)g.classList.add('hide');else n++});var v=document.getElementById('vac');if(v&&!n)v.classList.remove('hide')})();</script>'''
os.makedirs('indecopi', exist_ok=True)
open('indecopi/index.html', 'w', encoding='utf-8').write(pagina('Remates de INDECOPI: catálogos de inmuebles', 'Remates públicos de inmuebles del INDECOPI: fecha de comunicación, fecha de remate y catálogo para descargar. Información referencial.', '\n'.join(h), JSI))
json.dump({'sunat': {'n': len(rem), 'actualizado': S['actualizado'], 'fechas': fechas}, 'indecopi': {'n': len(prox), 'actualizado': act, 'ultimo': hist[0]['fecha_remate'] if hist else ''}}, open('otros/resumen.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('SUNAT:', len(rem), 'inmuebles en', len(fechas), 'fechas · INDECOPI:', len(prox), 'vigentes,', len(hist), 'anteriores')
