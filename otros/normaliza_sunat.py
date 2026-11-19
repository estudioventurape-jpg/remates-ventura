#!/usr/bin/env python3
"""Convierte la lectura cruda de rematestributarios.sunat.gob.pe (formato compacto del scraper de otros/scraper_sunat.js)
en otros/sunat.json. Uso: python3 otros/normaliza_sunat.py /ruta/sunat_raw.json AAAA-MM-DD(fecha de lectura)
Reglas: solo inmuebles; SIN nombres de deudores, ejecutores, martilleros ni terceros (las cargas se resumen por tipo)."""
import json, re, sys, unicodedata
raw = json.load(open(sys.argv[1], encoding='utf-8')); hoy = sys.argv[2]
def norm(t): return ''.join(c for c in unicodedata.normalize('NFD', (t or '').lower()) if unicodedata.category(c) != 'Mn')
def num(t):
    t = re.sub(r'[^\d.,]', '', str(t or '')).rstrip('.,')
    if not t: return None
    if ',' in t and '.' in t: t = t.replace(',', '')
    try: return round(float(t), 2)
    except ValueError: return None
DEPS = ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali']
SEDES = {'chimbote': 'Áncash', 'trujillo': 'La Libertad', 'chiclayo': 'Lambayeque', 'huancayo': 'Junín', 'iquitos': 'Loreto', 'pucallpa': 'Ucayali', 'tarapoto': 'San Martín', 'juliaca': 'Puno', 'huaraz': 'Áncash', 'huacho': 'Lima', 'canete': 'Lima'}
def region(tit, dep):
    t = ' ' + re.sub(r'[^a-z ]', ' ', norm(tit)) + ' '; best = None
    for d in DEPS:
        i = t.rfind(' ' + norm(d) + ' ')
        if i >= 0 and (best is None or i > best[0]): best = (i, d)
    if best: return best[1]
    for k, v in SEDES.items():
        if ' ' + k + ' ' in t: return v
    nd = norm(dep)
    for d in DEPS:
        if norm(d) == nd: return d
    return SEDES.get(nd, dep)
def tipo(tit):
    t = norm(tit)
    if re.search(r'departamento n|dpto|duplex', t): return 'Departamento'
    if re.search(r'\bstand\b|oficina|local comercial|almacen|uso comercial|tienda', t): return 'Local u oficina'
    if re.search(r'ubic\.? ?ru|rural|rustico|parcela|predio s/n|eriazo|\bha\b|has\b|hectarea', t): return 'Terreno rural'
    if re.search(r'terreno', t): return 'Terreno'
    return 'Inmueble'
def cargas(g):
    t = norm(g); p = []
    if not t.strip(): return 'No se indican en el aviso'
    if 'hipoteca' in t: p.append('hipoteca')
    if 'anticresis' in t: p.append('anticresis')
    if 'servidumbre' in t: p.append('servidumbre')
    if 'demanda' in t: p.append('anotación de demanda')
    if 'embargo' in t or 'inscripcion' in t:
        otros = re.search(r'embargo[^.]{0,80}(caja|banco|juzgado|judicial|essalud|municipal)', t)
        p.append('embargo de SUNAT' + (' y de otros acreedores' if otros else ''))
    r = ', '.join(p)
    return (r[0].upper() + r[1:] if r else 'Ver aviso oficial')
CONV = [(r'^(primer|1)', '1.ª'), (r'^(segund|2)', '2.ª'), (r'^(tercer|3)', '3.ª')]
out, omit = [], []
for n, f, h, dep, tit, base, tas, conv, local, sis, grav, partida, igv in raw:
    b, t = num(base), num(tas); c = ''
    cn = norm(conv)
    if not re.match(r'^[\d.,\s]+$', cn):
        for rx, v in CONV:
            if re.match(rx, cn): c = v
    if not c and num(conv) and not b: b = num(conv)          # dato mal digitado en el portal
    if b and t and b > t: b, t = t, b
    if re.search(r'ataud|vehicul|camioneta|maquina|mercaderia', norm(tit)) or not (b or t):
        omit.append(n); continue
    acc = re.search(r'(\d+(?:[.,]\d+)?)\s*%', tit) if re.search(r'acciones|derechos|%\s*del', norm(tit)) else None
    obs = []
    if not c: obs.append('convocatoria no indicada en el portal')
    if not num(base): obs.append('precio base por confirmar en el aviso oficial')
    out.append({'id': n, 'fecha': f, 'hora': h, 'dependencia': dep, 'region': region(tit, dep), 'tipo': tipo(tit),
                'titulo': re.sub(r'\s+', ' ', tit).strip(), 'base': b, 'tasacion': t, 'convocatoria': c,
                'acciones': acc.group(1).replace(',', '.') + ' %' if acc else '', 'partida': partida,
                'cargas': cargas(grav), 'igv': 'incluye IGV' if norm(igv).startswith('s') else 'no incluye IGV',
                'local': local.strip(), 'sistema': sis, 'obs': '; '.join(obs),
                'url': 'https://rematestributarios.sunat.gob.pe/node/' + n})
out.sort(key=lambda x: (x['fecha'], x['hora']))
json.dump({'actualizado': hoy, 'fuente': 'https://rematestributarios.sunat.gob.pe/por-fecha', 'remates': out, 'omitidos': omit},
          open('otros/sunat.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(out), 'inmuebles SUNAT;', len(omit), 'omitidos (no son inmuebles o sin precio):', omit)
