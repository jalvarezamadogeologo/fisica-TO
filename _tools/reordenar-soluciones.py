# -*- coding: utf-8 -*-
"""Reordena los bloques de solución de una página de unidad.

- Si el ejercicio ya tiene botón "Ver solución", mueve el <div class="solucion">
  para que quede inmediatamente después del botón.
- Si no lo tiene (práctica autónoma), crea el botón delante del bloque.

Uso: python _tools_reordenar_soluciones.py unidad1.html
"""
import io
import re
import sys

RUTA = sys.argv[1]

with io.open(RUTA, encoding='utf-8') as f:
    html = f.read()

patron_div = re.compile(
    r'[ \t]*<div class="solucion" id="([^"]+)"([^>]*)>(.*?)</div>\n', re.S)

bloques = list(patron_div.finditer(html))
if not bloques:
    print('sin bloques de solucion')
    sys.exit(0)

def buscar_boton(texto, ident):
    return re.search(
        r'<button class="btn-solucion" data-target="%s"[^>]*>.*?</button>' % re.escape(ident),
        texto, re.S)

ediciones = []   # (inicio, fin, reemplazo)
creados = 0

for m in bloques:
    ident = m.group(1)
    attrs = m.group(2)
    cuerpo = m.group(3)
    bloque = '<div class="solucion" id="%s"%s>%s</div>\n' % (ident, attrs, cuerpo)

    boton = buscar_boton(html, ident)
    if boton:
        ediciones.append((m.start(), m.end(), ''))
        ediciones.append((boton.end(), boton.end(), '\n' + bloque))
    else:
        nuevo = ('<button class="btn-solucion" data-target="%s" type="button">'
                 'Ver solución ▼</button>\n' % ident) + bloque
        ediciones.append((m.start(), m.end(), nuevo))
        creados += 1

# aplicar de atrás hacia adelante para no invalidar posiciones
for inicio, fin, reemplazo in sorted(ediciones, key=lambda e: (e[0], e[1]), reverse=True):
    html = html[:inicio] + reemplazo + html[fin:]

with io.open(RUTA, 'w', encoding='utf-8') as f:
    f.write(html)

print('%s: %d bloques, %d botones creados' % (RUTA, len(bloques), creados))
