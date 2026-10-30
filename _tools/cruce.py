# -*- coding: utf-8 -*-
"""Chequeo cruzado: anclas del indice contra las paginas de unidad,
y lista de respuestas numericas configuradas.
"""
import io
import re

from lxml import html as LH


def cargar(ruta):
    return LH.fromstring(io.open(ruta, encoding='utf-8').read())


index = cargar('index.html')
paginas = {}
for n in (1, 2, 3):
    nombre = 'unidad%d.html' % n
    paginas[nombre] = cargar(nombre)

problemas = []
for a in index.xpath('//a[@href]'):
    href = a.get('href')
    if '.html#' not in href:
        continue
    pagina, ancla = href.split('#', 1)
    doc = paginas.get(pagina)
    if doc is None:
        problemas.append('pagina inexistente: ' + pagina)
    elif doc.get_element_by_id(ancla, None) is None:
        problemas.append('ancla inexistente: ' + href)

badges = [b.get('data-badge-tema') for b in index.xpath('//*[@data-badge-tema]')]
temas = []
for nombre, doc in paginas.items():
    temas += [s.get('id') for s in doc.xpath("//section[contains(@class,'tema')]")]

print('anclas del indice:', len(index.xpath("//a[contains(@href,'.html#')]")))
print('problemas de anclas:', problemas or 'ninguno')
print('badges en el indice:', len(badges), '| temas en unidades:', len(temas))
print('badges sin tema:', sorted(set(badges) - set(temas)) or 'ninguno')
print('temas sin badge:', sorted(set(temas) - set(badges)) or 'ninguno')

print('\nrespuestas numericas configuradas:')
for nombre, doc in [('index.html', index)] + list(paginas.items()):
    for sol in doc.xpath("//div[contains(@class,'solucion')][@data-valor]"):
        print('  %-18s %-14s %s' % (nombre, sol.get('id'), sol.get('data-valor')))
