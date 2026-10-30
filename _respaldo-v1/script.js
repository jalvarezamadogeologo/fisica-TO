/* ==========================================================================
   fisica-to — script.js
   Lógica pedagógica: progreso por tema (localStorage), autoevaluaciones con
   feedback inmediato, pistas progresivas y test diagnóstico.
   ========================================================================== */

const STORAGE_KEY = 'fisica-to-progreso';

/* ---------- Progreso persistente ---------- */
function leerProgreso() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function guardarProgreso(progreso) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progreso));
  } catch (e) {
    // localStorage no disponible (modo privado/sin soporte): se ignora silenciosamente.
  }
}

function estadoTema(id) {
  const p = leerProgreso();
  return (p[id] && p[id].estado) || 'no-iniciado';
}

function marcarEstado(id, estado) {
  const p = leerProgreso();
  p[id] = p[id] || {};
  p[id].estado = estado;
  p[id].ultimaActualizacion = new Date().toISOString();
  guardarProgreso(p);
  actualizarBadge(id, estado);
}

function actualizarBadge(id, estado) {
  const badge = document.getElementById('badge-' + id);
  if (!badge) return;
  badge.className = 'badge';
  const textos = {
    'no-iniciado': 'No iniciado',
    'iniciado': 'En progreso',
    'enprogreso': 'En progreso',
    'dominado': 'Dominado ✓'
  };
  badge.textContent = textos[estado] || estado;
  badge.classList.add(estado);
}

/* ---------- Inicialización de página ---------- */
document.addEventListener('DOMContentLoaded', function () {
  // Actualizar badges de todos los temas presentes en esta página
  document.querySelectorAll('.estado-tema .badge').forEach(function (b) {
    const id = b.dataset.tema;
    if (id) actualizarBadge(id, estadoTema(id));
  });

  // Botones de cambio de estado (marcar como iniciado / dominado)
  document.querySelectorAll('[data-set-estado]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = this.dataset.tema;
      const estado = this.dataset.setEstado;
      marcarEstado(id, estado);
    });
  });

  // Pistas progresivas
  document.querySelectorAll('.btn-pista').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = this.dataset.target;
      const pista = document.getElementById(target);
      if (!pista) return;
      const mostrar = pista.classList.toggle('mostrar');
      this.textContent = mostrar ? 'Ocultar pista ▲' : 'Ver pista ▼';
    });
  });

  // Validación de autoevaluaciones
  document.querySelectorAll('form.autoevaluacion-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const id = form.dataset.tema;
      const correctas = parseInt(form.dataset.correctas, 10) || 3;
      validarAutoevaluacion(form, id, correctas);
    });
  });

  // Validación de ejercicios numéricos (data-valor)
  document.querySelectorAll('.btn-validar-num').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.dataset.target;
      const input = document.getElementById(id + '-resp');
      const sol = document.getElementById(id + '-sol');
      const msg = document.getElementById(id + '-msg');
      if (!input || !sol || !msg) return;
      const usuario = parseFloat(input.value);
      const esperado = parseFloat(sol.dataset.valor);
      if (isNaN(usuario)) {
        msg.textContent = 'Ingresa un número.';
        msg.style.color = '#7a5a00';
        msg.style.display = 'block';
        return;
      }
      const dif = Math.abs(usuario - esperado);
      const tol = Math.max(0.01, Math.abs(esperado) * 0.02);
      if (dif <= tol) {
        msg.textContent = '¡Correcto!';
        msg.style.color = '#2e7d32';
      } else {
        msg.textContent = 'Intenta de nuevo. Resultado esperado: ' + esperado.toFixed(3);
        msg.style.color = '#c62828';
      }
      msg.style.display = 'block';
    });
  });

  // Test diagnóstico (solo en index.html)
  const formDiag = document.getElementById('form-diagnostico');
  if (formDiag) {
    formDiag.addEventListener('submit', function (e) {
      e.preventDefault();
      calcularDiagnostico(formDiag);
    });
  }
});

/* ---------- Autoevaluación (3 preguntas) ---------- */
function validarAutoevaluacion(form, temaId, totalPreguntas) {
  const formData = new FormData(form);
  let aciertos = 0;
  const total = totalPreguntas;

  for (let i = 1; i <= total; i++) {
    const seleccion = formData.get('p' + i);
    const correcta = form.dataset['resp' + i];
    const feedback = document.getElementById('fb-' + temaId + '-p' + i);
    if (seleccion === correcta) {
      aciertos++;
      if (feedback) {
        feedback.textContent = 'Correcto.';
        feedback.className = 'feedback correcto';
        feedback.style.display = 'block';
      }
    } else {
      if (feedback) {
        feedback.textContent = 'Incorrecto. Revisa el concepto y vuelve a intentarlo.';
        feedback.className = 'feedback incorrecto';
        feedback.style.display = 'block';
      }
    }
  }

  const resultado = document.getElementById('resultado-auto-' + temaId);
  const pct = Math.round((aciertos / total) * 100);
  if (resultado) {
    resultado.innerHTML = 'Tu puntuación: <strong>' + aciertos + '/' + total + '</strong> (' + pct + '%)';
    resultado.style.display = 'block';
  }

  // Guardar progreso según desempeño
  let nuevoEstado = 'iniciado';
  if (aciertos === total) nuevoEstado = 'dominado';
  else if (aciertos > 0) nuevoEstado = 'enprogreso';
  marcarEstado(temaId, nuevoEstado);

  // Mensaje final
  const msgFinal = document.getElementById('msg-final-' + temaId);
  if (msgFinal) {
    if (aciertos === total) {
      msgFinal.textContent = '¡Excelente! Dominaste este tema. Marcalo como dominado en la lista de verificación.';
      msgFinal.style.color = '#2e7d32';
    } else if (aciertos >= Math.ceil(total / 2)) {
      msgFinal.textContent = 'Vas bien. Repasa las preguntas falladas y vuelve a intentarlo.';
      msgFinal.style.color = '#7a5a00';
    } else {
      msgFinal.textContent = 'Te recomendamos revisar el concepto y el ejemplo resuelto antes de continuar.';
      msgFinal.style.color = '#c62828';
    }
    msgFinal.style.display = 'block';
    msgFinal.style.marginTop = '0.8rem';
    msgFinal.style.fontWeight = '600';
  }
}

/* ---------- Test diagnóstico (index.html) ---------- */
function calcularDiagnostico(form) {
  const data = new FormData(form);
  let aciertos = 0;
  const total = 10;
  const claves = {
    d1: 'a', d2: 'b', d3: 'c', d4: 'a', d5: 'b',
    d6: 'c', d7: 'a', d8: 'b', d9: 'c', d10: 'a'
  };
  for (let i = 1; i <= total; i++) {
    const sel = data.get('d' + i);
    if (sel === claves['d' + i]) aciertos++;
  }
  const res = document.getElementById('resultado-diag');
  if (!res) return;
  res.className = 'resultado-diag mostrar';
  res.innerHTML = '<strong>Resultado: ' + aciertos + '/' + total + '</strong><br>';
  if (aciertos <= 3) {
    res.innerHTML += 'Te conviene empezar por la Unidad 1 y repasar los conceptos básicos.';
    res.classList.add('bajo');
  } else if (aciertos <= 7) {
    res.innerHTML += 'Tienes bases. Refuerza los temas donde fallaste antes de avanzar.';
    res.classList.add('medio');
  } else {
    res.innerHTML += 'Buen nivel. Puedes usar esta guía para repasar y consolidar lo que ya sabes.';
    res.classList.add('alto');
  }
  res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------- Calculadoras simples (compatibilidad) ---------- */
function calcularMRUA() {
  const v0 = parseFloat(document.getElementById('mrua-v0').value) || 0;
  const a = parseFloat(document.getElementById('mrua-a').value) || 0;
  const t = parseFloat(document.getElementById('mrua-t').value) || 0;
  const v = v0 + a * t;
  const x = v0 * t + 0.5 * a * t * t;
  const el = document.getElementById('mrua-resultado');
  if (el) el.innerHTML = 'v = ' + v.toFixed(3) + ' m/s<br>x = ' + x.toFixed(3) + ' m';
}
function calcularOhm() {
  const v = parseFloat(document.getElementById('ohm-v').value) || 0;
  const r = parseFloat(document.getElementById('ohm-r').value) || 0;
  const el = document.getElementById('ohm-resultado');
  if (el && r !== 0) el.innerHTML = 'I = ' + (v / r).toFixed(4) + ' A<br>P = ' + (v * v / r).toFixed(4) + ' W';
}
function calcularSerie() {
  const vals = (document.getElementById('serie-r').value || '').split(/[,\s;]+/).map(Number).filter(Boolean);
  const el = document.getElementById('serie-resultado');
  if (el && vals.length) el.innerHTML = 'R_T = ' + vals.reduce((a, b) => a + b, 0).toFixed(3) + ' Ω';
}
function calcularParalelo() {
  const vals = (document.getElementById('paralelo-r').value || '').split(/[,\s;]+/).map(Number).filter(Boolean);
  const el = document.getElementById('paralelo-resultado');
  if (el && vals.length) {
    const inv = vals.reduce((a, b) => a + 1 / b, 0);
    el.innerHTML = 'R_T = ' + (1 / inv).toFixed(4) + ' Ω';
  }
}
function calcularRC() {
  const v0 = parseFloat(document.getElementById('rc-v0').value) || 0;
  const r = parseFloat(document.getElementById('rc-r').value) || 0;
  const c = parseFloat(document.getElementById('rc-c').value) || 0;
  const t = parseFloat(document.getElementById('rc-t').value) || 0;
  const el = document.getElementById('rc-resultado');
  if (el && r > 0 && c > 0) {
    const tau = r * c * 1e-6;
    const vc = v0 * (1 - Math.exp(-t / tau));
    el.innerHTML = 'τ = ' + tau.toFixed(4) + ' s<br>Vc(t) = ' + vc.toFixed(4) + ' V';
  }
}
function calcularPresion() {
  const rho = parseFloat(document.getElementById('pres-rho').value) || 0;
  const g = parseFloat(document.getElementById('pres-g').value) || 0;
  const h = parseFloat(document.getElementById('pres-h').value) || 0;
  const el = document.getElementById('pres-resultado');
  if (el) el.innerHTML = 'P = ' + (rho * g * h).toFixed(2) + ' Pa';
}
