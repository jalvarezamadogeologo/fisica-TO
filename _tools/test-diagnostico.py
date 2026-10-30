# -*- coding: utf-8 -*-
"""Genera una copia de index.html con un script de prueba del diagnóstico."""
import io

CLAVE = {'d1': 'c', 'd2': 'b', 'd3': 'b', 'd4': 'c', 'd5': 'a',
         'd6': 'a', 'd7': 'b', 'd8': 'b', 'd9': 'b', 'd10': 'c'}

import sys
if '--todas-a' in sys.argv:
    CLAVE = {k: 'a' for k in CLAVE}

PRUEBA = """
<div id="salida-prueba"></div>
<script>
document.addEventListener('DOMContentLoaded', function () {
  var clave = %s;
  Object.keys(clave).forEach(function (k) {
    var r = document.querySelector('input[name="' + k + '"][value="' + clave[k] + '"]');
    if (r) r.checked = true;
  });
  document.getElementById('form-diagnostico').dispatchEvent(
    new Event('submit', { cancelable: true }));
  var res = document.getElementById('resultado-diag');
  var fb = document.getElementById('fb-diag-d10');
  document.getElementById('salida-prueba').textContent =
    'PRUEBA || clase=' + res.className + ' || texto=' + res.textContent +
    ' || fb10=' + fb.textContent;
});
</script>
""" % ('{' + ', '.join("'%s': '%s'" % (k, v) for k, v in CLAVE.items()) + '}')

h = io.open('index.html', encoding='utf-8').read()
h = h.replace('</body>', PRUEBA + '</body>', 1)
io.open('_test2.html', 'w', encoding='utf-8').write(h)
print('generado _test2.html')
