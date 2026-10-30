# -*- coding: utf-8 -*-
"""Verificación de consistencia de las páginas de la guía (XPath, sin cssselect).

Uso: python _tools_verificar.py index.html unidad1.html ...
"""
import io
import os
import sys

from lxml import html as LH


def elementos(doc, xpath):
    return doc.xpath(xpath)


def verificar(ruta):
    print('=' * 64)
    print(ruta)
    doc = LH.fromstring(io.open(ruta, encoding='utf-8').read())

    ids = [e.get('id') for e in doc.iter() if e.get('id')]
    duplicados = sorted({i for i in ids if ids.count(i) > 1})
    print('ids:', len(ids), '| duplicados:', duplicados or 'ninguno')

    faltantes = []
    for e in doc.xpath('//*[@data-target]'):
        clases = e.get('class') or ''
        if 'btn-validar' in clases:
            continue  # estos apuntan a <id>-resp / <id>-sol / <id>-msg
        if doc.get_element_by_id(e.get('data-target'), None) is None:
            faltantes.append(e.get('data-target'))
    print('data-target sin destino:', faltantes or 'ninguno')

    rotos = []
    for a in doc.xpath('//a[@href]'):
        href = a.get('href')
        if href.startswith('#'):
            if doc.get_element_by_id(href[1:], None) is None:
                rotos.append(href)
        elif href.endswith('.html'):
            base = href.split('#')[0]
            if base and not os.path.exists(os.path.join(os.path.dirname(ruta), base)):
                rotos.append(href)
    print('enlaces/anclas rotos:', rotos or 'ninguno')

    problemas = []
    for inp in doc.xpath('//input[@data-enter-valida]'):
        base = inp.get('data-enter-valida')
        sol = doc.get_element_by_id(base + '-sol', None)
        if sol is None:
            problemas.append(base + ': falta ' + base + '-sol')
        elif not sol.get('data-valor'):
            problemas.append(base + ': solucion sin data-valor')
    print('ejercicios numericos con problema:', problemas or 'ninguno')

    form_problemas = []
    for form in doc.xpath("//form[contains(concat(' ', normalize-space(@class), ' '),"
                          " ' autoevaluacion-form ') and @data-tema]"):
        tema = form.get('data-tema')
        total = int(form.get('data-correctas') or 0)
        for i in range(1, total + 1):
            radios = form.xpath(".//input[@name='%s-p%d']" % (tema, i))
            valores = [r.get('value') for r in radios]
            if len(radios) < 2:
                form_problemas.append('%s-p%d sin opciones' % (tema, i))
            if form.get('data-resp%d' % i) not in valores:
                form_problemas.append('%s-p%d: data-resp%d no coincide con opciones' % (tema, i, i))
            if doc.get_element_by_id('fb-%s-p%d' % (tema, i), None) is None:
                form_problemas.append('%s-p%d: falta feedback' % (tema, i))
        if doc.get_element_by_id('resultado-auto-' + tema, None) is None:
            form_problemas.append(tema + ': falta resultado-auto')
    print('autoevaluaciones con problema:', form_problemas or 'ninguno')

    temas = [s.get('id') for s in doc.xpath(
        "//section[contains(concat(' ', normalize-space(@class), ' '), ' tema ')]")]
    badges = [b.get('data-badge-tema') for b in doc.xpath('//*[@data-badge-tema]')]
    print('temas:', len(temas), '| badges:', len(badges))
    if temas and set(temas) != set(badges):
        print('  DESAJUSTE temas/badges:', sorted(set(temas) ^ set(badges)))


for ruta in sys.argv[1:]:
    verificar(ruta)
