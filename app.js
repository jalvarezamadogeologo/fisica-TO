/* ==========================================================================
   Guía de Estudio de Física — CBA0210
   app.js — único archivo de comportamiento.

   Contenido:
     1. Utilidades y almacenamiento del progreso (localStorage)
     2. Badges de estado y checklist de dominio
     3. Progreso global (index)
     4. Soluciones y pistas progresivas
     5. Validación de respuestas numéricas
     6. Autoevaluaciones de 3 preguntas
     7. Test diagnóstico (10 preguntas, con explicación por pregunta)
     8. Calculadoras
   ========================================================================== */

/* ---------------------------- 1. Utilidades ---------------------------- */

var CLAVE_PROGRESO = 'fisica-to-progreso';

function $(id) { return document.getElementById(id); }

/* Acepta coma o punto decimal y también separador de miles (2.000 → 2000). */
function parseNumero(valor) {
  if (valor === null || valor === undefined) return NaN;
  var s = String(valor).trim().replace(/\s/g, '');
  if (s === '') return NaN;

  /* Separador de miles: 2.000 / 1.234.567 (solo si el resultado es >= 1000,
     para no convertir 0.500 en 500). */
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    var conPuntos = parseFloat(s.replace(/\./g, ''));
    if (conPuntos >= 1000) return conPuntos;
  }
  if (/^\d{1,3}(,\d{3})+$/.test(s)) {
    var conComas = parseFloat(s.replace(/,/g, ''));
    if (conComas >= 1000) return conComas;
  }
  return parseFloat(s.replace(',', '.'));
}

function leerProgreso() {
  try {
    var raw = localStorage.getItem(CLAVE_PROGRESO);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function guardarProgreso(progreso) {
  try {
    localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(progreso));
  } catch (e) {
    /* localStorage no disponible: el progreso no persiste, la guía sigue funcionando. */
  }
}

function estadoTema(id) {
  var progreso = leerProgreso();
  return (progreso[id] && progreso[id].estado) || 'no-iniciado';
}

function marcarEstado(id, estado) {
  if (!id) return;
  var progreso = leerProgreso();
  progreso[id] = progreso[id] || {};
  progreso[id].estado = estado;
  progreso[id].actualizado = new Date().toISOString();
  guardarProgreso(progreso);
  pintarEstado(id, estado);
}

/* ------------------- 2. Badges y checklist de dominio ------------------- */

var TEXTOS_ESTADO = {
  'no-iniciado': 'No iniciado',
  'iniciado': 'En progreso',
  'enprogreso': 'En progreso',
  'dominado': 'Dominado'
};

function pintarEstado(id, estado) {
  var badges = document.querySelectorAll('[data-badge-tema="' + id + '"]');
  for (var i = 0; i < badges.length; i++) {
    var b = badges[i];
    b.className = 'badge';
    b.classList.add(estado === 'no-iniciado' ? 'iniciado-off' : estado);
    b.textContent = TEXTOS_ESTADO[estado] || estado;
  }
  var checks = document.querySelectorAll('input[type="checkbox"][data-tema="' + id + '"]');
  for (var j = 0; j < checks.length; j++) {
    checks[j].checked = (estado === 'dominado');
    var etiqueta = checks[j].closest('label') || checks[j].parentNode;
    if (etiqueta && etiqueta.classList.contains('marcado')) {
      etiqueta.classList.toggle('marcado', estado === 'dominado');
    }
  }
}

function sincronizarTodos() {
  var marcas = document.querySelectorAll('[data-badge-tema]');
  for (var i = 0; i < marcas.length; i++) {
    var id = marcas[i].getAttribute('data-badge-tema');
    pintarEstado(id, estadoTema(id));
  }
  actualizarProgresoGlobal();
}

/* ------------------------ 3. Progreso global ------------------------- */

function actualizarProgresoGlobal() {
  var contenedor = $('progreso-global');
  if (!contenedor) return;
  var temas = document.querySelectorAll('[data-badge-tema]');
  var ids = {};
  for (var i = 0; i < temas.length; i++) ids[temas[i].getAttribute('data-badge-tema')] = true;
  var total = Object.keys(ids).length;
  var progreso = leerProgreso();
  var dominados = 0, enProgreso = 0;
  for (var id in ids) {
    var e = (progreso[id] && progreso[id].estado) || 'no-iniciado';
    if (e === 'dominado') dominados++;
    else if (e === 'enprogreso' || e === 'iniciado') enProgreso++;
  }
  var pct = total ? Math.round((dominados / total) * 100) : 0;
  var barra = contenedor.querySelector('.barra > span');
  if (barra) barra.style.width = pct + '%';
  var texto = contenedor.querySelector('.progreso-texto');
  if (texto) {
    texto.innerHTML = '<strong>' + dominados + '</strong> de ' + total +
      ' temas dominados (' + pct + ' %) &middot; ' + enProgreso + ' en progreso.';
  }
}

/* ------------------ 4. Soluciones y pistas progresivas ------------------ */

function alternar(btn, id, textoAbrir, textoCerrar) {
  var caja = $(id);
  if (!caja) return;
  var abierta = caja.classList.toggle('mostrar');
  btn.textContent = abierta ? textoCerrar : textoAbrir;
  btn.setAttribute('aria-expanded', abierta ? 'true' : 'false');
}

/* -------------------- 5. Validación de respuestas --------------------- */

function validarRespuesta(btn) {
  var id = btn.getAttribute('data-target');
  var input = $(id + '-resp');
  var sol = $(id + '-sol');
  var msg = $(id + '-msg');
  if (!input || !sol || !msg) return;

  var esperado = parseNumero(sol.getAttribute('data-valor'));
  var usuario = parseNumero(input.value);
  msg.style.display = 'block';

  if (isNaN(usuario)) {
    msg.textContent = 'Escribe un número antes de validar.';
    msg.style.color = '#8a5a00';
    return;
  }
  if (isNaN(esperado)) {
    msg.textContent = 'Este ejercicio no tiene respuesta numérica configurada.';
    msg.style.color = '#8a5a00';
    return;
  }

  var tolerancia = Math.max(Math.abs(esperado) * 0.05, 1e-12);
  if (Math.abs(usuario - esperado) <= tolerancia) {
    msg.textContent = 'Correcto.';
    msg.style.color = '#2e7d32';
  } else {
    msg.textContent = 'Todavía no. Revisa las unidades y el signo, y vuelve a intentarlo.';
    msg.style.color = '#c62828';
  }
}

/* --------------------- 6. Autoevaluaciones --------------------------- */

function validarAutoevaluacion(form) {
  var tema = form.getAttribute('data-tema');
  var total = parseInt(form.getAttribute('data-correctas'), 10) || 3;
  var aciertos = 0;

  for (var i = 1; i <= total; i++) {
    var marcada = form.querySelector('input[name="' + tema + '-p' + i + '"]:checked');
    var correcta = form.getAttribute('data-resp' + i);
    var exp = form.getAttribute('data-exp' + i);
    var feedback = $('fb-' + tema + '-p' + i);
    var acerto = !!marcada && marcada.value === correcta;
    if (acerto) aciertos++;

    if (feedback) {
      feedback.className = 'feedback ' + (acerto ? 'correcto' : 'incorrecto');
      feedback.style.display = 'block';
      if (acerto) {
        feedback.textContent = 'Correcto. ' + (exp || '');
      } else {
        feedback.textContent = 'Incorrecto. La respuesta correcta es la ' + correcta + ').' +
          (exp ? ' ' + exp : ' Vuelve al apartado correspondiente y revisa el concepto.');
      }
    }
  }

  var resultado = $('resultado-auto-' + tema);
  if (resultado) {
    var pct = Math.round((aciertos / total) * 100);
    resultado.style.display = 'block';
    resultado.innerHTML = 'Puntaje: <strong>' + aciertos + ' de ' + total + '</strong> (' + pct + ' %).';
  }

  var nuevoEstado;
  if (aciertos === total) nuevoEstado = 'dominado';
  else if (aciertos > 0) nuevoEstado = 'enprogreso';
  else nuevoEstado = estadoTema(tema) === 'dominado' ? 'dominado' : 'enprogreso';
  marcarEstado(tema, nuevoEstado);
}

/* ------------------------- 7. Test diagnóstico ----------------------- */

/* Clave y explicación de cada pregunta del diagnóstico (index.html). */
var DIAGNOSTICO = {
  d1: { correcta: 'c', bloque: 'u1',
        exp: 'Velocidad constante significa que la velocidad no cambia, por lo tanto la aceleración es cero.' },
  d2: { correcta: 'b', bloque: 'u1',
        exp: 'En caída libre la única fuerza es el peso, así que la aceleración es constante: g ≈ 9,8 m/s².' },
  d3: { correcta: 'b', bloque: 'u1',
        exp: 'P = m·g = 70 kg × 9,8 m/s² = 686 N. El newton es la unidad de fuerza; el kilogramo es de masa.' },
  d4: { correcta: 'c', bloque: 'u1',
        exp: 'Fuerza neta cero implica aceleración cero, y eso incluye tanto el reposo como el movimiento con velocidad constante.' },
  d5: { correcta: 'a', bloque: 'u2',
        exp: 'W = F·d·cos(θ). Si θ = 90°, cos(90°) = 0 y el trabajo es cero: esa fuerza no transfiere energía.' },
  d6: { correcta: 'a', bloque: 'u2',
        exp: 'Sin roce, la energía mecánica se conserva: la potencial gravitatoria se transforma íntegramente en cinética.' },
  d7: { correcta: 'b', bloque: 'u2',
        exp: 'Cargas del mismo signo se repelen; de signo opuesto se atraen (ley de Coulomb).' },
  d8: { correcta: 'b', bloque: 'u3',
        exp: 'En serie hay un solo camino para la carga: la corriente es la misma en todos los componentes.' },
  d9: { correcta: 'b', bloque: 'u3',
        exp: 'Al reducir la sección aumenta la velocidad (continuidad) y, en un fluido ideal horizontal, la presión disminuye (Bernoulli).' },
  d10: { correcta: 'c', bloque: 'u3',
        exp: 'Poiseuille: Q ∝ r⁴. Si el radio se reduce a la mitad, el caudal cae a (1/2)⁴ = 1/16.' }
};

var RECOMENDACION = {
  u1: 'Unidad 1 — Cinemática y Dinámica',
  u2: 'Unidad 2 — Energía, Trabajo y Electrostática',
  u3: 'Unidad 3 — Circuitos y Fluidos'
};

function calcularDiagnostico(form) {
  var aciertos = 0, total = 0;
  var porBloque = { u1: [0, 0], u2: [0, 0], u3: [0, 0] };

  for (var clave in DIAGNOSTICO) {
    if (!DIAGNOSTICO.hasOwnProperty(clave)) continue;
    total++;
    var marcada = form.querySelector('input[name="' + clave + '"]:checked');
    var datos = DIAGNOSTICO[clave];
    var acerto = !!marcada && marcada.value === datos.correcta;

    porBloque[datos.bloque][1]++;
    if (acerto) { aciertos++; porBloque[datos.bloque][0]++; }

    var feedback = $('fb-diag-' + clave);
    if (feedback) {
      feedback.className = 'feedback ' + (acerto ? 'correcto' : 'incorrecto');
      feedback.style.display = 'block';
      feedback.textContent = (acerto ? 'Correcto. ' : 'Incorrecto (correcta: ' + datos.correcta + '). ') + datos.exp;
    }
  }

  var res = $('resultado-diag');
  if (!res) return;
  res.className = 'resultado-diag mostrar';
  var pct = total ? Math.round((aciertos / total) * 100) : 0;
  var html = '<strong>Resultado: ' + aciertos + ' de ' + total + ' (' + pct + ' %).</strong><br>';

  if (aciertos <= 4) {
    res.classList.add('bajo');
    html += 'Conviene empezar por la Unidad 1 y construir las bases: sin cinemática y leyes de Newton, el resto se vuelve memorización.';
  } else if (aciertos <= 7) {
    res.classList.add('medio');
    html += 'Tienes bases útiles. Refuerza los bloques con más errores antes de avanzar al siguiente.';
  } else {
    res.classList.add('alto');
    html += 'Buen nivel de partida. Usa la guía para consolidar y para los temas que no dominas del todo.';
  }

  var debiles = [];
  for (var bloque in porBloque) {
    if (porBloque[bloque][1] > 0 && porBloque[bloque][0] / porBloque[bloque][1] < 0.5) {
      debiles.push(RECOMENDACION[bloque]);
    }
  }
  if (debiles.length) {
    html += '<br><br><strong>Prioriza:</strong> ' + debiles.join(' &middot; ') + '.';
  }

  res.innerHTML = html;
  res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* --------------------------- 8. Calculadoras ------------------------- */

function calcularMRUA() {
  var v0 = parseNumero($('mrua-v0').value);
  var a = parseNumero($('mrua-a').value);
  var t = parseNumero($('mrua-t').value);
  var salida = $('mrua-resultado');
  if (!salida) return;
  if (isNaN(v0) || isNaN(a) || isNaN(t)) {
    salida.textContent = 'Completa v₀, a y t con valores numéricos.';
    return;
  }
  var v = v0 + a * t;
  var x = v0 * t + 0.5 * a * t * t;
  salida.innerHTML = 'v = v₀ + a·t = <strong>' + v.toFixed(2) + ' m/s</strong><br>' +
    'Δx = v₀·t + ½·a·t² = <strong>' + x.toFixed(2) + ' m</strong>';
}

function calcularOhm() {
  var v = parseNumero($('ohm-v').value);
  var r = parseNumero($('ohm-r').value);
  var salida = $('ohm-resultado');
  if (!salida) return;
  if (isNaN(v) || isNaN(r) || r === 0) {
    salida.textContent = 'Completa V y R (R distinta de cero).';
    return;
  }
  var i = v / r;
  salida.innerHTML = 'I = V/R = <strong>' + i.toFixed(4) + ' A</strong><br>' +
    'P = V·I = <strong>' + (v * i).toFixed(3) + ' W</strong>';
}

function calcularSerie() {
  var salida = $('serie-resultado');
  if (!salida) return;
  var vals = $('serie-r').value.split(/[;,\s]+/).map(parseNumero).filter(function (x) { return !isNaN(x); });
  if (!vals.length) {
    salida.textContent = 'Escribe las resistencias separadas por coma o espacio.';
    return;
  }
  var rt = vals.reduce(function (a, b) { return a + b; }, 0);
  salida.innerHTML = 'R en serie = <strong>' + rt.toFixed(2) + ' Ω</strong> (' + vals.length + ' resistencias)';
}

function calcularParalelo() {
  var salida = $('paralelo-resultado');
  if (!salida) return;
  var vals = $('paralelo-r').value.split(/[;,\s]+/).map(parseNumero)
    .filter(function (x) { return !isNaN(x) && x > 0; });
  if (!vals.length) {
    salida.textContent = 'Escribe resistencias positivas separadas por coma o espacio.';
    return;
  }
  var inv = vals.reduce(function (a, b) { return a + 1 / b; }, 0);
  salida.innerHTML = 'R en paralelo = <strong>' + (1 / inv).toFixed(2) + ' Ω</strong> (' + vals.length + ' resistencias)';
}

function calcularRC() {
  var v0 = parseNumero($('rc-v0').value);
  var r = parseNumero($('rc-r').value);
  var c = parseNumero($('rc-c').value);   /* en microfaradios */
  var t = parseNumero($('rc-t').value);
  var salida = $('rc-resultado');
  if (!salida) return;
  if (isNaN(v0) || isNaN(r) || isNaN(c) || isNaN(t) || r <= 0 || c <= 0) {
    salida.textContent = 'Completa V₀, R, C y t (R y C mayores que cero).';
    return;
  }
  var tau = r * c * 1e-6;
  var carga = v0 * (1 - Math.exp(-t / tau));
  var descarga = v0 * Math.exp(-t / tau);
  salida.innerHTML = 'τ = R·C = <strong>' + tau.toFixed(4) + ' s</strong><br>' +
    'Carga: Vc(t) = <strong>' + carga.toFixed(3) + ' V</strong><br>' +
    'Descarga (desde V₀): Vc(t) = <strong>' + descarga.toFixed(3) + ' V</strong>';
}

function calcularPresion() {
  var rho = parseNumero($('pres-rho').value);
  var g = parseNumero($('pres-g').value);
  var h = parseNumero($('pres-h').value);
  var salida = $('pres-resultado');
  if (!salida) return;
  if (isNaN(rho) || isNaN(g) || isNaN(h) || h < 0) {
    salida.textContent = 'Completa densidad, gravedad y profundidad.';
    return;
  }
  salida.innerHTML = 'P = ρ·g·h = <strong>' + (rho * g * h).toFixed(1) + ' Pa</strong> ' +
    '(' + ((rho * g * h) / 133.322).toFixed(1) + ' mmHg)';
}

/* --------------------------- Inicialización -------------------------- */

document.addEventListener('DOMContentLoaded', function () {

  sincronizarTodos();

  /* Soluciones plegables */
  document.querySelectorAll('.btn-solucion[data-target]').forEach(function (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      alternar(this, this.getAttribute('data-target'), 'Ver solución ▼', 'Ocultar solución ▲');
    });
  });

  /* Pistas progresivas */
  document.querySelectorAll('.btn-pista[data-target]').forEach(function (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      alternar(this, this.getAttribute('data-target'), 'Ver pista ▼', 'Ocultar pista ▲');
    });
  });

  /* Validación numérica */
  document.querySelectorAll('.btn-validar[data-target]').forEach(function (btn) {
    btn.addEventListener('click', function () { validarRespuesta(this); });
  });

  /* Enter en el campo numérico dispara la validación */
  document.querySelectorAll('input[data-enter-valida]').forEach(function (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var btn = document.querySelector('.btn-validar[data-target="' + this.getAttribute('data-enter-valida') + '"]');
        if (btn) btn.click();
      }
    });
  });

  /* Autoevaluaciones (el diagnóstico no tiene data-tema y se trata aparte) */
  document.querySelectorAll('form.autoevaluacion-form[data-tema]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      validarAutoevaluacion(form);
    });
  });

  /* Checklist de dominio */
  document.querySelectorAll('input[type="checkbox"][data-set-estado]').forEach(function (check) {
    check.addEventListener('change', function () {
      var id = this.getAttribute('data-tema');
      var estado = this.checked ? this.getAttribute('data-set-estado') : 'enprogreso';
      marcarEstado(id, estado);
      var etiqueta = this.closest('label');
      if (etiqueta) etiqueta.classList.toggle('marcado', this.checked);
    });
  });

  /* Test diagnóstico */
  var formDiag = $('form-diagnostico');
  if (formDiag) {
    formDiag.addEventListener('submit', function (e) {
      e.preventDefault();
      calcularDiagnostico(formDiag);
    });
  }

  /* Calculadoras */
  var calculadoras = {
    'btn-mrua': calcularMRUA,
    'btn-ohm': calcularOhm,
    'btn-serie': calcularSerie,
    'btn-paralelo': calcularParalelo,
    'btn-rc': calcularRC,
    'btn-pres': calcularPresion
  };
  Object.keys(calculadoras).forEach(function (id) {
    var boton = $(id);
    if (boton) boton.addEventListener('click', calculadoras[id]);
  });

  /* Botón de reinicio del progreso (index) */
  var reiniciar = $('btn-reiniciar-progreso');
  if (reiniciar) {
    reiniciar.addEventListener('click', function () {
      if (!window.confirm('Se borrará el progreso guardado en este navegador. ¿Continuar?')) return;
      try { localStorage.removeItem(CLAVE_PROGRESO); } catch (e) {}
      sincronizarTodos();
    });
  }
});
