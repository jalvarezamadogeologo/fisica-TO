# fisica-to — Guía de Estudio de Física CBA0210

Guía de estudio autocontenida (HTML + CSS + JS, sin dependencias ni servidor) para el curso
Física CBA0210 del Instituto de Ciencias Biomédicas, Facultad de Medicina, Universidad de Chile
(carreras de Enfermería, Fonoaudiología, Kinesiología, Nutrición y Dietética, Obstetricia y
Terapia Ocupacional).

Contenidos y Resultados de Aprendizaje siguen el programa oficial del curso (PDF en esta carpeta).
Bibliografía base: Serway y Vuille, *Fundamentos de Física*, 10ª edición.

## Estructura

| Archivo | Rol |
| --- | --- |
| `index.html` | Portada, método de estudio, herramientas transversales, test diagnóstico, mapa de los 20 temas y evaluación del curso |
| `unidad1.html` | 7 temas: cinemática y dinámica |
| `unidad2.html` | 6 temas: energía, trabajo y electrostática |
| `unidad3.html` | 7 temas: circuitos y fluidos |
| `styles.css` | Hoja de estilos única (incluye estilos de impresión) |
| `app.js` | Todo el comportamiento: progreso, badges, pistas, validación, autoevaluaciones, diagnóstico, calculadoras |
| `_respaldo-v1/` | Versión anterior completa, conservada como respaldo |
| `_tools/` | Scripts de verificación y mantenimiento (no se usan en producción) |

## Bloques de cada tema

Cada `<section class="tema" id="uN-tM">` repite el mismo orden:

objetivo · activación · idea central · de la idea a la fórmula · método · ejemplo resuelto ·
errores frecuentes · práctica guiada (con pista) · práctica autónoma (validación numérica) ·
autoevaluación de 3 preguntas · conexión con la salud · checklist de dominio.

## Convenciones de identificadores

Con ellas funcionan el progreso y la validación; respetarlas al agregar o editar temas.

| Elemento | Convención | Ejemplo |
| --- | --- | --- |
| Sección del tema | `id="uN-tM"` | `u1-t3` |
| Badge de estado | `data-badge-tema="uN-tM"` | `data-badge-tema="u1-t3"` |
| Checklist | `input type="checkbox" data-tema="uN-tM" data-set-estado="dominado"` | `chk-u1-t3` |
| Ejercicio autónomo | input `id="p-uN-tM-resp"` con `data-enter-valida="p-uN-tM"` | `p-u1-t3-resp` |
| Solución numérica | `div.solucion id="p-uN-tM-sol" data-valor="..."` | `data-valor="90"` |
| Botón de validación | `button.btn-validar data-target="p-uN-tM"` | — |
| Mensaje | `span id="p-uN-tM-msg"` | — |
| Pista | botón `data-target="pista-uN-tM"` + `div.pista id="pista-uN-tM"` | — |
| Autoevaluación | `form.autoevaluacion-form` con `data-tema`, `data-correctas="3"`, `data-resp1..3` y `data-exp1..3` | — |
| Radios | `name="uN-tM-p1"`, `p2`, `p3` (nombre único por tema) | `u1-t3-p1` |
| Feedback | `div.feedback id="fb-uN-tM-p1"` | — |
| Resultado | `div.resultado-auto id="resultado-auto-uN-tM"` | — |
| Solución guiada | `div.solucion id="eN-M-sol"` + botón `data-target` igual al id | `e1-3-sol` |

La validación numérica acepta coma o punto decimal y una tolerancia del 5 % del valor esperado.
Por eso los valores deben escribirse en la unidad que pide el enunciado.

## Progreso

Se guarda en `localStorage` bajo la clave `fisica-to-progreso`. Estados: `no-iniciado`,
`enprogreso`, `dominado`. Una autoevaluación con 3/3 marca el tema como dominado; el checklist
permite hacerlo manualmente. El botón "Borrar progreso" del índice limpia la clave.

## Verificación

Desde esta carpeta:

```powershell
python _tools/verificar.py index.html unidad1.html unidad2.html unidad3.html
python _tools/cruce.py
node --check app.js
```

- `verificar.py`: ids duplicados, `data-target` sin destino, anclas y enlaces rotos, ejercicios
  sin `data-valor`, autoevaluaciones incompletas y desajuste entre temas y badges.
- `cruce.py`: valida las 20 anclas del índice contra las páginas de unidad y lista las respuestas
  numéricas configuradas (útil para revisar los cálculos).
- `reordenar-soluciones.py`: utilidad de mantenimiento que deja cada bloque de solución
  inmediatamente después de su botón.
- `test-diagnostico.py`: genera `_test2.html` (copia del índice con un envío automático del
  diagnóstico) para probar en navegador headless. Con `--todas-a` simula respuestas incorrectas
  y comprueba la recomendación por bloque. Borrar `_test2.html` después de usar.

Ejemplo de prueba headless del motor:

```powershell
python _tools/test-diagnostico.py
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --dump-dom `
  "file:///D:/IA/opencode/proyectos/personales/fisica-to/_test2.html" | Select-String "PRUEBA \|\|"
```

Resultado esperado: sin problemas en los tres chequeos.

## Publicación

- Repositorio: https://github.com/jalvarezamadogeologo/fisica-TO (público)
- Sitio: https://jalvarezamadogeologo.github.io/fisica-TO/ (GitHub Pages, rama `master`, raíz)
- Pages publica solo las páginas y sus recursos. Las carpetas que empiezan con guion bajo
  (`_tools/`, `_respaldo-v1/`) no se sirven, aunque sí están en el repositorio.
- El programa oficial del curso (PDF) no se publica: está en `.gitignore`.

## Estado

Re-enfoque completo el 2026-10-30: contenido reescrito con pedagogía por bloques, 20 temas
anclados al programa oficial, motor interactivo unificado y verificado. La versión anterior está
en `_respaldo-v1/`.
