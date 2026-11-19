#!/usr/bin/env python3
"""Cruza el registro de alertas con los remates publicados y prepara los avisos (Ventura Legal).
Uso (raíz del repo):  python3 alertas_match.py registro.json AAAA-MM-DD [salida.json]
 - registro.json: copia local del documento del proyecto claude/remaju-diario/alertas-registro.json
 - escribe salida.json con «correos» (para Gmail send_message), «whatsapp» (mensajes listos con enlace wa.me) y
   «registro_nuevo» (el registro con lo enviado ya marcado: guardarlo en el proyecto SOLO después de enviar los correos).
Reglas: primer aviso = bienvenida con lo vigente; después solo cuando hay remates nuevos que encajan; las alertas
semanales salen los viernes; nunca se repite un remate ya avisado; sin nombres de partes."""
import json, re, sys, ast, html, unicodedata, datetime
from urllib.parse import quote
reg = json.load(open(sys.argv[1], encoding='utf-8')); hoy = sys.argv[2]; salida = sys.argv[3] if len(sys.argv) > 3 else 'alertas_salida.json'
D = json.load(open('remates.json', encoding='utf-8'))['remates']
try: S = json.load(open('otros/sunat.json', encoding='utf-8'))['remates']
except Exception: S = []
src = open('alertas/index.html', encoding='utf-8').read()
lit = lambda n: ast.literal_eval(re.search(r'var ' + n + r'=(\[.*?\]|\{.*?\});', src, re.S).group(1))
LM, CALLAO, PROV, CIU = lit('LM'), lit('CALLAO'), lit('PROV'), lit('CIU')
def norm(t): return ''.join(c for c in unicodedata.normalize('NFD', (t or '').lower()) if unicodedata.category(c) != 'Mn')
def lmkey(n): return re.sub(r' \(.*\)', '', norm(n))
LMK = [lmkey(x) for x in LM]
def num(t):
    m = re.search(r'[\d,]+(?:\.\d+)?', str(t)); return float(m.group(0).replace(',', '')) if m else None
def area(txt):
    m = re.search(r'([\d,]+(?:\.\d+)?)\s*m(?:²|2)(?!\d)', txt, re.I)
    if m: return float(m.group(1).replace(',', ''))
    m = re.search(r'(?:ha|has|hás)\.?\s*:?\s*([\d.]+)', txt, re.I) or re.search(r'([\d.]+)\s*(?:ha|has|hás)\b', txt, re.I)
    try: return float(m.group(1)) * 10000 if m else None
    except ValueError: return None
def tipo(t):
    t = norm(t)
    if re.match(r'(casa|vivienda)', t): return 'casa'
    if re.search(r'departamento|dpto|duplex', t): return 'departamento'
    if re.match(r'(local|tienda|oficina|stand)', t): return 'local'
    if re.search(r'terreno|lote|fraccion|predio|parcela', t): return 'terreno'
    if re.search(r'estacionamiento|cochera', t): return 'estacionamiento'
    return 'otro'
def dep_de(loc):
    h = norm(loc); q0 = re.split(r'[,(]', h)[0].strip(); resto = h[len(q0):]
    if q0 in LMK and (not resto.strip() or 'lima' in resto) and 'callao' not in resto: return 'Lima Metropolitana'
    for d in PROV:
        k = norm(d).replace(' (provincias)', '')
        if k != 'lima' and re.search(r'(^|[^a-z])' + re.escape(k) + r'([^a-z]|$)', h): return d
    if 'callao' in h: return 'Callao'
    if q0 == 'lima' and ',' not in h: return 'Lima Metropolitana'
    return 'Lima (provincias)' if 'lima' in h else ''
def en_ubic(loc, z, sub):
    if not z: return True
    if dep_de(loc) != z: return False
    if not sub: return True
    h = norm(loc); k = lmkey(sub).replace(' cercado', ''); p0 = re.split(r'[,(]', h)[0].strip()
    if z == 'Lima Metropolitana': return p0 == k or (k == 'cercado de lima' and p0 == 'lima')
    if z == 'Callao': return (not any(norm(x) in h for x in CALLAO[1:])) if k == 'callao' else k in h
    if k in h.replace(norm(z).replace(' (provincias)', ''), ' '): return True
    if norm(z) == k and len(re.split(r'[,(]', h)) == 1: return True
    return any(c in h for c in CIU.get(sub, []))
def loc_sunat(x):
    """Ubicación comparable de un inmueble de SUNAT (la sede que remata puede estar en otra ciudad)."""
    t = x['titulo']; reg_ = x['region']; tn = ' ' + re.sub(r'[^a-z0-9 ]', ' ', norm(t)) + ' '
    md = re.search(r'distrito de ([A-Za-zÁÉÍÓÚÑáéíóúñ ]+?)(?=,|;|\.| provincia| y | del | departamento|$)', t, re.I)
    mp = re.search(r'provincia de ([A-Za-zÁÉÍÓÚÑáéíóúñ ]+?)(?=,|;|\.| y | departamento|$)', t, re.I)
    dist = md.group(1).strip() if md else ''; prov = mp.group(1).strip() if mp else ''
    if norm(reg_) == 'lima':
        if prov and norm(prov) != 'lima': return f'{dist}, {prov} (Lima)'.strip(', ')
        best = max((k for k in LMK if f' {k} ' in tn), key=len, default='')
        return (best + ', Lima') if best else 'Lima'
    parts = [p for p in (dist, prov) if p and norm(p) != norm(reg_)]
    extra = ' '.join(c for cs in CIU.values() for c in cs if f' {c} ' in tn)
    return (', '.join(parts) + ' ' + extra + f' ({reg_})').strip() if (parts or extra) else reg_
def cumple(a, loc, tp, moneda, base, ar, sin_cargas):
    if not en_ubic(loc, a.get('zona') or '', a.get('sub') or ''): return False
    if a.get('tipos') and tp not in a['tipos'] and not (tp == 'otro*' and 'casa' in a['tipos']): return False
    if a.get('mon') and moneda != a['mon']: return False
    if a.get('min') is not None and (base is None or base < a['min']): return False
    if a.get('max') is not None and (base is None or base > a['max']): return False
    if a.get('area') is not None and (ar is None or ar < a['area']): return False
    if a.get('sc') and not sin_cargas: return False
    return True
def fcorta(f): d = datetime.date.fromisoformat(f); return f'{d.day:02d}/{d.month:02d}/{d.year}'
def ubic_txt(a):
    z, s = a.get('zona') or '', a.get('sub') or ''
    if not z: return 'todo el Perú'
    esd = z in ('Lima Metropolitana', 'Callao')
    return (f'{s}, {z}' if esd else f'provincia de {s}, ' + z.replace(' (provincias)', '')) if s else z
def criterios(a):
    p = [ubic_txt(a)]
    if a.get('tipos'): p.append(', '.join(a['tipos']))
    if a.get('min') is not None or a.get('max') is not None: p.append('base ' + (a.get('mon') or '') + f" {int(a.get('min') or 0):,} a " + (f"{int(a['max']):,}" if a.get('max') is not None else 'sin límite'))
    elif a.get('mon'): p.append('base en ' + ('dólares' if a['mon'] == 'US$' else 'soles'))
    if a.get('area') is not None: p.append(f"desde {int(a['area']):,} m²")
    if a.get('sc'): p.append('sin cargas declaradas')
    return ' · '.join(p)
hoy_d = datetime.date.fromisoformat(hoy); desde = (hoy_d - datetime.timedelta(days=10)).isoformat()
correos, was, resumen = [], [], []
E_ = html.escape
for a in reg.get('alertas', []):
    if not a.get('activo', True) or not a.get('consentimiento'): continue
    env = set(a.get('enviados', [])); pj, su = [], []
    for r in D:
        if r[4] < desde or r[0] in env: continue
        if cumple(a, r[1], tipo(r[2]), 'US$' if r[3].startswith('US$') else 'S/', num(r[3]), area(r[2] + ' ' + (r[14] if len(r) > 14 else '')), bool(re.search('ninguna declarada', r[13] or '', re.I))): pj.append(r)
    for x in S:
        if x['fecha'] < hoy or ('S' + x['id']) in env: continue
        tp = {'Departamento': 'departamento', 'Local u oficina': 'local', 'Terreno': 'terreno', 'Terreno rural': 'terreno'}.get(x['tipo'], 'otro*')
        if cumple(a, loc_sunat(x), tp, 'S/', x.get('base'), area(x['titulo']), False): su.append(x)
    primera = not a.get('bienvenida')
    if not primera and not (pj or su): continue
    if not primera and a.get('semanal') and hoy_d.weekday() != 4: continue
    pj.sort(key=lambda r: (r[4], r[0]), reverse=True); su.sort(key=lambda x: (x['fecha'], x['hora']))
    n = len(pj) + len(su); nom = a['nombre'].split()[0].title() if a.get('nombre') else ''
    li = lambda t, u, extra: f'<tr><td style="padding:10px 12px;border-bottom:1px solid #DFE3EA;font:14px Arial,sans-serif;color:#0E1216">{t}<br><span style="color:#5A6470;font-size:13px">{extra}</span></td><td style="padding:10px 12px;border-bottom:1px solid #DFE3EA;white-space:nowrap"><a href="{u}" style="color:#20397A;font:bold 13px Arial,sans-serif">Ver ficha</a></td></tr>'
    h = [f'<div style="max-width:620px;margin:0 auto;font:15px/1.5 Arial,sans-serif;color:#0E1216"><p style="font:bold 20px Georgia,serif;margin:0 0 4px">Ventura Legal <span style="font:bold 11px Arial;letter-spacing:1.5px;color:#2A4A9C">· REMATES</span></p><hr style="border:0;border-top:2px solid #0E1216;margin:6px 0 16px">',
         f'<p>Hola{", " + E_(nom) if nom else ""}:</p>']
    if primera: h.append(f'<p><b>Tu alerta de remates ya está activa.</b> Te escribiremos a este correo cuando se publique un remate que encaje con lo que buscas.</p>')
    h.append(f'<p style="background:#F2F5FB;border:1px solid #DFE3EA;padding:10px 12px;font-size:14px"><b>Tu alerta:</b> {E_(criterios(a))}</p>')
    t = []
    if n:
        h.append(f'<p>{"Ahora mismo hay" if primera else "Hay"} <b>{n} remate{"s" if n != 1 else ""}</b> que {"encajan" if n != 1 else "encaja"} con tu alerta:</p>')
        t.append(f'{"Ahora mismo hay" if primera else "Hay"} {n} remate{"s" if n != 1 else ""} que {"encajan" if n != 1 else "encaja"} con tu alerta ({criterios(a)}):')
        if pj:
            h.append('<p style="font:bold 13px Arial;color:#fff;background:#20397A;padding:6px 10px;margin:14px 0 0">Poder Judicial (REMAJU) · ' + str(len(pj)) + '</p><table style="width:100%;border-collapse:collapse">')
            for r in pj[:12]:
                u = f'https://venturalegal.pe/remates/{r[4]}/#r{r[0]}'
                h.append(li(f'<b>N.° {E_(r[0])}</b> · {E_(r[1])} · {E_(r[2])}', u, f'Base {E_(r[3])} · edición del {fcorta(r[4])}'))
            h.append('</table>' + (f'<p style="font-size:13px;color:#5A6470">y {len(pj) - 12} más en <a href="https://venturalegal.pe/remates/buscar/">el buscador</a>.</p>' if len(pj) > 12 else ''))
            for r in pj[:4]: t.append(f'• REMAJU N.° {r[0]} · {r[1]} · {r[2]} · base {r[3]}')
        if su:
            h.append('<p style="font:bold 13px Arial;color:#fff;background:#0B6B4F;padding:6px 10px;margin:14px 0 0">SUNAT · ' + str(len(su)) + '</p><table style="width:100%;border-collapse:collapse">')
            for x in su[:12]:
                b = f"S/ {x['base']:,.2f}" if x.get('base') else 'por confirmar'
                h.append(li(f"<b>SUNAT N.° {E_(x['id'])}</b> · {E_(x['region'])} · {E_(x['titulo'][:110])}", f"https://venturalegal.pe/remates/sunat/#s{x['id']}", f"Base {b} · remate el {fcorta(x['fecha'])}{', ' + x['hora'] if x.get('hora') else ''}"))
            h.append('</table>' + (f'<p style="font-size:13px;color:#5A6470">y {len(su) - 12} más en <a href="https://venturalegal.pe/remates/sunat/">la sección de SUNAT</a>.</p>' if len(su) > 12 else ''))
            for x in su[:max(1, 4 - min(len(pj), 4))]: t.append(f"• SUNAT N.° {x['id']} · {x['region']} · remate el {fcorta(x['fecha'])}" + (f" · base S/ {x['base']:,.0f}" if x.get('base') else ''))
        if n > len(t) - 1: t.append(f'…y {n - (len(t) - 1)} más.')
    else:
        h.append('<p>Por ahora no hay remates publicados que encajen; te avisaremos cuando aparezca uno.</p>')
        t.append(f'Tu alerta de remates ya está activa ({criterios(a)}). Por ahora no hay remates que encajen; te avisaremos cuando aparezca uno.')
    h.append('<p style="margin-top:18px"><a href="https://venturalegal.pe/remates/" style="background:#2A4A9C;color:#fff;padding:11px 18px;text-decoration:none;font:bold 14px Arial,sans-serif;display:inline-block">Ver todos los remates</a></p>')
    h.append('<p style="font-size:14px">¿Quieres que revisemos alguno antes de ofertar? Ofrecemos consulta personalizada, informe de la partida electrónica e información del expediente judicial; pídelos desde la ficha de cada remate o respondiendo este correo.</p>')
    h.append('<p style="font-size:12.5px;color:#5A6470;border-top:1px solid #DFE3EA;padding-top:10px">Información referencial tomada de REMAJU y del portal de remates de SUNAT; no constituye asesoría de inversión ni recomendación de compra. Los remates pueden suspenderse o modificarse: verifica siempre el aviso oficial, la partida en SUNARP, la posesión y las bases.<br>Recibes este correo porque creaste una alerta en venturalegal.pe/remates/alertas y autorizaste el uso de tus datos para este fin (Ley N.° 29733). Para modificarla o dejar de recibir avisos, responde este correo con la palabra BAJA.</p>')
    h.append('<p style="font:bold 15px Georgia,serif;margin:14px 0 0">Ventura Legal</p><p style="font-size:12.5px;color:#5A6470;margin:2px 0">Av. Juan de Arona N.° 755, San Isidro – Lima · victor@venturalegal.pe · 927 995 630</p></div>')
    asunto = ('Tu alerta de remates está activa' + (f': {n} remate{"s" if n != 1 else ""} que encaja{"n" if n != 1 else ""}' if n else '')) if primera else f'{n} remate{"s" if n != 1 else ""} nuevo{"s" if n != 1 else ""} para tu alerta · {ubic_txt(a)}'
    texto = (f'Hola{", " + nom if nom else ""}. Te escribe Ventura Legal por tu alerta de remates.\n' + '\n'.join(t) + '\nDetalle y fichas: https://venturalegal.pe/remates/\nInformación referencial. Responde BAJA si ya no deseas recibir avisos.')
    ids = [r[0] for r in pj] + ['S' + x['id'] for x in su]
    correos.append({'alerta': a['id'], 'to': a['email'], 'subject': asunto + ' | Ventura Legal', 'htmlBody': ''.join(h), 'body': texto, 'ids': ids})
    tel = re.sub(r'\D', '', a.get('tel') or '')
    if len(tel) == 9 and tel.startswith('9'): was.append({'alerta': a['id'], 'nombre': a['nombre'], 'tel': '51' + tel, 'texto': texto, 'enlace': 'https://wa.me/51' + tel + '?text=' + quote(texto)})
    a['enviados'] = sorted(env | set(ids)); a['bienvenida'] = True; a['ultimo_aviso'] = hoy
    resumen.append(f"{a['id']}: {'bienvenida, ' if primera else ''}{len(pj)} REMAJU + {len(su)} SUNAT -> {a['email']}{' + WhatsApp' if len(tel) == 9 else ''}")
reg['actualizado'] = hoy
json.dump({'fecha': hoy, 'correos': correos, 'whatsapp': was, 'registro_nuevo': reg}, open(salida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(correos), 'correos y', len(was), 'mensajes de WhatsApp preparados ->', salida)
for x in resumen: print(' ', x)
