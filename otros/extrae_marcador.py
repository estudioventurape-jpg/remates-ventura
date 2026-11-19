#!/usr/bin/env python3
"""Extrae de la transcripción de la sesión el último JSON leído entre @@NOMBRE_INI@@ y @@NOMBRE_FIN@@ (evita copiarlo a mano).
Uso: python3 otros/extrae_marcador.py SUNAT /tmp/sunat_raw.json"""
import json, re, sys, glob, os
nombre, salida = sys.argv[1], sys.argv[2]; best = None
rx = re.compile(r'@@%s_INI@@(\[.*?\])@@%s_FIN@@' % (nombre, nombre), re.S)
def walk(o):
    global best
    if isinstance(o, str):
        for m in rx.finditer(o):
            try: best = json.loads(m.group(1))
            except Exception: pass
    elif isinstance(o, dict):
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
files = sorted(glob.glob('/root/.claude/projects/*/*.jsonl'), key=os.path.getmtime)
for line in open(files[-1], encoding='utf-8'):
    if '@@%s_INI@@' % nombre in line:
        try: walk(json.loads(line))
        except Exception: pass
if best is None: sys.exit('No se encontró el marcador %s en %s' % (nombre, files[-1]))
json.dump(best, open(salida, 'w', encoding='utf-8'), ensure_ascii=False); print(len(best), 'registros ->', salida)
