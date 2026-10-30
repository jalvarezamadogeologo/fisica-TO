/* ==========================================================================
   fisica-to — app.js
   Interactividad compartida: toggle de soluciones y calculadoras simples.
   ========================================================================== */

/* ---------- Toggle de soluciones de ejercicios ---------- */
function toggleSolucion(btn) {
  const id = btn.dataset.target;
  const sol = document.getElementById(id);
  if (!sol) return;
  const mostrar = sol.classList.toggle('mostrar');
  btn.textContent = mostrar ? 'Ocultar solución ▲' : 'Ver solución ▼';
}

/* ---------- Utilidades ---------- */
function $ (id) { return document.getElementById(id); }
function numero(val) { return parseFloat(val); }

/* ---------- Calculadora: MRUA (caída libre / movimiento rectilíneo uniformemente acelerado) ---------- */
function calcularMRUA() {
  const v0 = numero($('mrua-v0').value);
  const a = numero($('mrua-a').value);
  const t = numero($('mrua-t').value);
  if (!isFinite(v0) || !isFinite(a) || !isFinite(t)) {
    $('mrua-resultado').textContent = 'Ingresa valores numéricos válidos.';
    return;
  }
  const v = v0 + a * t;
  const x = v0 * t + 0.5 * a * t * t;
  $('mrua-resultado').innerHTML =
    'Velocidad final v = ' + v.toFixed(3) + ' m/s<br>' +
    'Posición/desplazamiento x = ' + x.toFixed(3) + ' m';
}

/* ---------- Calculadora: Ley de Ohm ---------- */
function calcularOhm() {
  const v = numero($('ohm-v').value);
  const r = numero($('ohm-r').value);
  if (!isFinite(v) || !isFinite(r) || r === 0) {
    $('ohm-resultado').textContent = 'Ingresa V y R válidos (R ≠ 0).';
    return;
  }
  const i = v / r;
  const p = v * i;
  $('ohm-resultado').innerHTML =
    'Corriente I = ' + i.toFixed(4) + ' A<br>' +
    'Potencia P = ' + p.toFixed(4) + ' W';
}

/* ---------- Calculadora: Resistencias en serie ---------- */
function calcularSerie() {
  const raw = $('serie-r').value;
  const vals = raw.split(/[,\s;]+/).map(Number).filter(x => isFinite(x));
  if (vals.length === 0) {
    $('serie-resultado').textContent = 'Ingresa resistencias separadas por coma o espacio.';
    return;
  }
  const rt = vals.reduce((a, b) => a + b, 0);
  $('serie-resultado').innerHTML =
    'Resistencia equivalente (serie) R_T = ' + rt.toFixed(3) + ' Ω  (' + vals.length + ' resistencias)';
}

/* ---------- Calculadora: Resistencias en paralelo ---------- */
function calcularParalelo() {
  const raw = $('paralelo-r').value;
  const vals = raw.split(/[,\s;]+/).map(Number).filter(x => isFinite(x) && x > 0);
  if (vals.length === 0) {
    $('paralelo-resultado').textContent = 'Ingresa resistencias positivas separadas por coma o espacio.';
    return;
  }
  const inv = vals.reduce((a, b) => a + 1 / b, 0);
  const rt = 1 / inv;
  $('paralelo-resultado').innerHTML =
    'Resistencia equivalente (paralelo) R_T = ' + rt.toFixed(4) + ' Ω  (' + vals.length + ' resistencias)';
}

/* ---------- Calculadora: Circuito RC (carga del capacitor) ---------- */
function calcularRC() {
  const v0 = numero($('rc-v0').value);
  const r = numero($('rc-r').value);
  const c = numero($('rc-c').value);
  const t = numero($('rc-t').value);
  if (!isFinite(v0) || !isFinite(r) || !isFinite(c) || !isFinite(t) || r <= 0 || c <= 0) {
    $('rc-resultado').textContent = 'Ingresa V0, R, C y t válidos (R, C > 0).';
    return;
  }
  const tau = r * c;
  const vc = v0 * (1 - Math.exp(-t / tau));
  $('rc-resultado').innerHTML =
    'Constante de tiempo τ = R·C = ' + tau.toFixed(4) + ' s<br>' +
    'Voltaje en el capacitor a t = ' + t + ' s: Vc = ' + vc.toFixed(4) + ' V';
}

/* ---------- Calculadora: Presión hidrostática ---------- */
function calcularPresion() {
  const rho = numero($('pres-rho').value);
  const g = numero($('pres-g').value);
  const h = numero($('pres-h').value);
  if (!isFinite(rho) || !isFinite(g) || !isFinite(h) || h < 0) {
    $('pres-resultado').textContent = 'Ingresa densidad, gravedad y altura válidas.';
    return;
  }
  const p = rho * g * h;
  $('pres-resultado').innerHTML =
    'Presión hidrostática P = ρ·g·h = ' + p.toFixed(2) + ' Pa';
}

/* ---------- Validación simple de ejercicios numéricos ---------- */
function validarRespuesta(btn) {
  const id = btn.dataset.target;
  const input = $(id + '-resp');
  const sol = $(id + '-sol');
  if (!input || !sol) return;
  const usuario = numero(input.value);
  const correcto = numero(sol.dataset.valor);
  const msg = $(id + '-msg');
  if (!isFinite(usuario)) {
    msg.textContent = 'Ingresa un número.';
    msg.style.color = '#7a5a00';
    return;
  }
  const dif = Math.abs(usuario - correcto);
  const tolerancia = Math.max(0.01, Math.abs(correcto) * 0.02); // 2% o 0.01
  if (dif <= tolerancia) {
    msg.textContent = '¡Correcto!';
    msg.style.color = '#2e7d32';
  } else {
    msg.textContent = 'Intenta de nuevo. Resultado esperado: ' + correcto.toFixed(3);
    msg.style.color = '#c62828';
  }
}

/* ---------- Inicialización ---------- */
document.addEventListener('DOMContentLoaded', function () {
  // Vincular botones de solución con data-target
  document.querySelectorAll('.btn-solucion[data-target]').forEach(function (btn) {
    btn.addEventListener('click', function () { toggleSolucion(this); });
  });
  // Vincular botones de validación con data-target
  document.querySelectorAll('.btn-validar[data-target]').forEach(function (btn) {
    btn.addEventListener('click', function () { validarRespuesta(this); });
  });
  // Vincular calculadoras por id de botón
  const calcMap = {
    'btn-mrua': calcularMRUA,
    'btn-ohm': calcularOhm,
    'btn-serie': calcularSerie,
    'btn-paralelo': calcularParalelo,
    'btn-rc': calcularRC,
    'btn-pres': calcularPresion
  };
  Object.entries(calcMap).forEach(function ([id, fn]) {
    const el = $(id);
    if (el) el.addEventListener('click', fn);
  });
});
