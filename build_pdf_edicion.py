#!/usr/bin/env python3
"""Genera el PDF de una edición a partir de su página web (AAAA-MM-DD/index.html), con la marca «Ventura Legal».
Uso (raíz del repo): python3 build_pdf_edicion.py AAAA-MM-DD [AAAA-MM-DD ...]   |   python3 build_pdf_edicion.py todas
Deja remates-AAAA-MM-DD.pdf en la carpeta de la edición y en la raíz. Reemplaza al build_pdf.py antiguo (datos a mano).
Requiere Playwright (Chromium). No lleva el nombre de Víctor: firma «Ventura Legal» (decisión del 19/11/2026)."""
import re, sys, os, glob, base64, html
from playwright.sync_api import sync_playwright
LOGO = 'data:image/png;base64,' + base64.b64encode(open('logo-ventura-legal.png', 'rb').read()).decode()
CSS = """
*{box-sizing:border-box}body{font-family:Inter,sans-serif;color:#0E1216;font-size:10.5px;line-height:1.45;margin:0}
.lab{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#2A4A9C;font-weight:600}
h1{font-family:Lora,serif;font-weight:500;font-size:36px;margin:6px 0 4px;letter-spacing:-.3px}
.sub{font-family:Lora,serif;font-style:italic;color:#5A6470;font-size:14px}
.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #C3C9D4;padding-bottom:12px}
.fecha{color:#5A6470;font-size:11px;text-align:right}
h2.s{font-family:Lora,serif;font-weight:500;font-size:21px;border-top:2px solid #0E1216;padding-top:8px;margin:22px 0 10px;break-after:avoid}h2.s span{color:#2A4A9C;margin-right:8px}
.cr{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.crc{background:#E5EAF6;padding:10px 12px}.crc.b{background:#F2F5FB;border:1px solid #DFE3EA}
.crc h2{font-weight:600;font-size:11px;margin:0 0 5px;font-family:Inter,sans-serif}.crc p{font-size:10px;color:#444C55;margin:2px 0}
.note{font-size:10px;color:#444C55;margin:0}
table{width:100%;border-collapse:collapse;margin-top:6px}th{background:#0E1216;color:#F4F5F7;font-size:8.5px;letter-spacing:1px;text-transform:uppercase;text-align:left;padding:6px 8px;font-weight:600}th.k{background:#2A4A9C;text-align:right}
td{padding:5px 8px;border-bottom:1px solid #DFE3EA;font-size:9.5px}td.n{font-weight:600;color:#20397A;width:46px}td.m{text-align:right;font-family:Lora,serif;font-size:11.5px;background:#F2F5FB;white-space:nowrap;width:128px}
td .s2{color:#444C55}tr.g td{background:#E5EAF6;font-weight:600;font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:#20397A;border:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.card{border:1px solid #DFE3EA;border-top:3px solid #5C78C0;padding:8px 10px;break-inside:avoid;font-size:9px;line-height:1.4}
.ct{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px}.cn{font-family:Lora,serif;font-size:14px;font-weight:500;color:#20397A}.cl{font-size:8.5px;letter-spacing:.8px;text-transform:uppercase;color:#5A6470}
.card h3{font-weight:600;font-size:10px;margin:0}.cd{color:#444C55;margin:0 0 3px}.base{background:#F2F5FB;padding:3px 6px;margin:3px 0;font-size:9.5px;display:flex;gap:10px;align-items:baseline}.base b{font-weight:600}
dl{display:flex;gap:14px;margin:3px 0}dl div{display:flex;gap:4px}dt{color:#5A6470;font-size:8.5px}dd{margin:0;font-size:8.5px;font-weight:500}
.cx{color:#444C55;font-size:8.5px;margin:1px 0}.cg{margin:3px 0 0;font-size:8.5px}
.av{background:#E5EAF6;padding:12px 14px;margin-top:14px;font-size:10px;color:#222;break-inside:avoid}.av p{margin:0 0 6px}
.firma{margin-top:22px;border-top:1px solid #0E1216;padding-top:8px;width:320px;break-inside:avoid;display:flex;gap:10px;align-items:center}.firma img{width:34px;height:34px}
.firma .nm{font-family:Lora,serif;font-weight:500;font-size:16px}.firma .ct2{font-size:10px;color:#5A6470}
"""
MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']
def una(d, pg):
    s = open(os.path.join(d, 'index.html'), encoding='utf-8').read()
    g = lambda rx: (re.search(rx, s, re.S) or [None, ''])[1]
    y, m, dd = d.split('-'); fecha = f'{dd}/{m}/{y}'
    sub = g(r'<div class="sub">(.*?)</div>'); cr = g(r'(<div class="cr">.*?</div></div>)')
    tabla = g(r'(<table id="tb">.*?</table>)')
    nota = g(r'(<p class="note">.*?</p>)')
    cards = re.findall(r'<article class="card" id="r\w+".*?</article>', s, re.S)
    cards = [re.sub(r'<a class="wa".*?</a>', '', re.sub(r'<article([^>]*)>', '<div class="card">', c)).replace('</article>', '</div>') for c in cards]
    av = g(r'(<div class="av">.*?</div>)\s*</main>') or g(r'<h2 class="s"><span>0\d</span>Antes de ofertar</h2>\s*(<div class="av">.*?</div>)')
    av = av.replace('Escríbeme al 927 995 630', 'Escríbenos al 927 995 630').replace('Escríbeme: 927 995 630', 'Escríbenos al 927 995 630')
    body = f'''<div class="top"><div><div class="lab">Remates judiciales · REMAJU</div><h1>Remates del día</h1><div class="sub">{sub}</div></div>
<div class="fecha">Lima, {int(dd)} de {MES[int(m) - 1]} de {y}<br>Fuente: REMAJU, Poder Judicial</div></div>
{cr}
<h2 class="s"><span>01</span>Resumen</h2>{nota}{tabla}
<h2 class="s"><span>02</span>Detalle</h2><div class="grid">{''.join(cards)}</div>
<h2 class="s"><span>03</span>Antes de ofertar</h2>{av}
<div class="firma"><img src="{LOGO}" alt=""><div><div class="nm">Ventura Legal</div><div class="ct2">venturalegal.pe/remates · victor@venturalegal.pe · 927 995 630</div></div></div>'''
    doc = f"<!doctype html><html lang='es'><head><meta charset='utf-8'><title>Remates judiciales {fecha} · Ventura Legal</title><style>{CSS}</style></head><body>{body}</body></html>"
    hdr = f'''<div style="width:100%;padding:0 0.7in;font-family:Lora,serif;font-size:11px;display:flex;justify-content:space-between;align-items:center;color:#0E1216">
<span style="display:flex;align-items:center;gap:6px"><img src="{LOGO}" style="width:20px;height:20px"><span style="font-size:15px">Ventura Legal</span></span>
<span style="font-family:Inter,sans-serif;font-size:7.5px;letter-spacing:1.4px;color:#5A6470">REMATES JUDICIALES · {fecha}</span></div>'''
    ftr = '''<div style="width:100%;font-family:Inter,sans-serif;font-size:7.5px;color:#5A6470;border-top:1px solid #C3C9D4;padding-top:5px;margin:0 0.7in;display:flex;justify-content:space-between">
<span>Ventura Legal · Av. Juan de Arona N.° 755, San Isidro – Lima · victor@venturalegal.pe · 927 995 630</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'''
    pg.set_content(doc, wait_until='load')
    out = os.path.join(d, f'remates-{d}.pdf')
    pg.pdf(path=out, format='A4', print_background=True, display_header_footer=True, header_template=hdr, footer_template=ftr,
           margin={'top': '0.95in', 'bottom': '0.85in', 'left': '0.7in', 'right': '0.7in'})
    open(f'remates-{d}.pdf', 'wb').write(open(out, 'rb').read())
    print(d, len(cards), 'fichas ->', out, os.path.getsize(out) // 1024, 'KB')
fechas = sys.argv[1:]
if fechas == ['todas']: fechas = sorted(x for x in glob.glob('20??-??-??') if os.path.isfile(os.path.join(x, 'index.html')))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for d in fechas: una(d, pg)
    b.close()
