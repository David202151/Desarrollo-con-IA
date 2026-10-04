# Tareas 001 — Mapa de calor de días estudiados

- **Spec:** `spec.md` · **Plan:** `plan.md` · **Constitución:** `docs/constitution.md`
- **Reglas:**
  - Cada tarea dura como máximo 20-30 min y se hace en este orden: cada una depende de las
    anteriores salvo que se indique otra cosa.
  - En las tareas de lógica, primero se escribe el test (falla) y después la función (pasa).
  - Una tarea solo se marca cuando su «Hecho cuando» se ha comprobado de verdad.
- **Verificación en el navegador:** con el MCP de Chrome DevTools en un contexto aislado
  (`isolatedContext`), para no tocar los datos reales.

## Fase 0 — Preparación

- [x] **T01. Comprobar el requisito previo.**
  RF: — (requisito previo de la spec).
  Comprobar que:
  - Existen `logica.js` y `tests/`.
  - `index.html` carga `logica.js` antes que `app.js`.
  - `logica.js` exporta sus funciones con el mecanismo D1 del plan.
  **Hecho cuando:** `node --test` pasa sin fallos y `index.html` se abre con doble clic sin
  errores en la consola. Si algo falta, se detiene todo y se hace antes la tarea previa.

- [x] **T02. Crear `tests/mapa.test.js` con la zona horaria fijada.**
  RF: casos límite de cambio de hora.
  - Crear el archivo con `node:test` y `node:assert/strict`.
  - Fijar `process.env.TZ = "Europe/Madrid"` y hacer `require("../logica.js")`.
  - Añadir un test de control: el 24 y el 26 de octubre de 2026 tienen distinto
    `getTimezoneOffset()`.

  **Hecho cuando:** `node --test` ejecuta el archivo y el test de control pasa en Windows. Si
  no pasa, se anota en `MEMORY.md` y se acuerda otra forma de fijar la zona antes de seguir.

## Fase 1 — Lógica (`logica.js` + `tests/mapa.test.js`)

- [x] **T03. `sumarDias(fecha, n)`.**
  RF: RF-1, CA-2.3.
  Tests con estos desplazamientos:
  - +1 y −1.
  - Cruzar un mes y un año.
  - El 29 de febrero de 2028.
  - Cruzar el 25 de octubre de 2026 y el 28 de marzo de 2027.

  **Hecho cuando:** todos los tests de `sumarDias` pasan, y `logica.js` no contiene
  `86400000` ni operaciones con milisegundos.

- [x] **T04. `esFechaReal(texto)`.**
  RF: definición de sesión válida, CA-9.3.
  Tests: `2026-10-04` es real; `2026-02-30`, `2026-13-01`, `2026-2-3`, `""` y `null` no lo son.
  **Hecho cuando:** todos los tests de `esFechaReal` pasan.

- [x] **T05. `esSesionValida(sesion)`.**
  RF: CA-9.3.
  Tests:
  - Válidas: 1 min y 1440 min.
  - No válidas: 0, 29,5, «30» (texto), −5, 1441, fecha inexistente, sin fecha, sin minutos
    y `null`.

  **Hecho cuando:** todos los tests de `esSesionValida` pasan.

- [x] **T06. `inicioDeSemana(fecha)`.**
  RF: CA-1.2.
  Tests:
  - Un lunes devuelve el mismo día.
  - Un domingo devuelve el lunes 6 días antes.
  - Una semana que cruza el cambio de mes y otra que cruza el de año.

  **Hecho cuando:** todos los tests de `inicioDeSemana` pasan.

- [x] **T07. `nivelDeMinutos(minutos)`.**
  RF: RF-3, CA-3.1.
  Tests: 0, 1, 29, 30, 59, 60, 119, 120 y 900 → 0, 1, 1, 2, 2, 3, 3, 4 y 4.
  **Hecho cuando:** todos los tests de `nivelDeMinutos` pasan.

- [x] **T08. `minutosPorDia(sesiones, desde, hoy)`.**
  RF: RF-2, CA-9.1, CA-9.2, CA-9.3.
  Tests:
  - Suma 20 + 15 = 35 el mismo día.
  - Suma de más de 1440 en un día.
  - Excluye las fechas futuras y las anteriores a `desde`.
  - Ignora las sesiones no válidas.

  **Hecho cuando:** todos los tests de `minutosPorDia` pasan.

- [x] **T09. `construirMapa`: forma, última columna y hoy.**
  RF: CA-1.1, CA-1.2, CA-1.3, CA-2.2, CA-4.1 (dato), CA-3.3.
  Tests:
  - Hay 13 semanas de 7 posiciones y el primer día es lunes.
  - Con hoy lunes, la última columna tiene 1 día visible y 6 `null`; con hoy domingo, 7
    visibles.
  - Solo hoy tiene `esHoy`, y hoy sin sesiones tiene nivel 0.
  - Una sesión pasada cambia solo su día.

  **Hecho cuando:** estos tests pasan.

- [x] **T10. `construirMapa`: continuidad, cambio de semana y sesiones futuras.**
  RF: RF-1, CA-1.4, CA-8.3.
  Tests:
  - Cada día visible es el anterior + 1, con hoy en cuatro fechas: 2026-11-01 y 2027-04-04
    (cambio de hora), 2027-01-10 (cambio de año) y 2028-03-05 (29 de febrero).
  - La primera columna avanza una semana entre hoy domingo y el lunes siguiente.
  - Una sesión futura solo cuenta cuando su fecha es hoy.

  **Hecho cuando:** estos tests pasan.

- [x] **T11. `construirMapa`: datos raros, datos intactos y rendimiento.**
  RF: RF-10 (dato), CA-10.2, RNF-5, RNF-9.
  Tests:
  - Si `sesiones` no es una lista, todo queda en nivel 0 y `diasConEstudio` vale 0.
  - La lista de sesiones queda idéntica antes y después (`deepStrictEqual` sobre una copia).
  - 5 000 sesiones se procesan en menos de 100 ms.

  **Hecho cuando:** estos tests pasan.

- [x] **T12. `etiquetasDeMes(semanas)`.**
  RF: CA-7.3.
  Tests:
  - Un período que empieza a mitad de mes y un mes que empieza en lunes.
  - Nunca hay dos etiquetas en columnas contiguas.
  - La primera columna lleva etiqueta solo si la siguiente está a 3 columnas o más (D11).

  **Hecho cuando:** todos los tests de `etiquetasDeMes` pasan.

- [x] **T13. `textoDeDia(dia)` y `textoResumen(n)`.**
  RF: CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-10.1.
  Tests:
  - 3 de octubre de 2026 con 45 min → «sábado, 3 de octubre de 2026: 45 min».
  - 0 min → «…: sin estudio»; 125 → «125 min».
  - Resumen con 0, 1 y 23 días: el texto de CA-10.1, singular y plural.

  **Hecho cuando:** estos tests pasan.

- [x] **T14. Repaso de la lógica.**
  RF: principio 3 de la constitución.
  - Exportar todas las funciones nuevas con el mecanismo D1.
  - Comprobar que sus nombres no chocan con los de `app.js`.

  **Hecho cuando:**
  - `node --test` pasa completo.
  - Buscando en las funciones nuevas no aparece `document`, `localStorage` ni
    `new Date()` sin argumentos.
  - `index.html` sigue abriéndose sin errores en la consola.

## Fase 2 — Interfaz

- [x] **T15. Estructura en `index.html`.**
  RF: CA-6.1, CA-6.2, CA-7.1, CA-7.2.
  Crear la sección entre el formulario y la lista con:
  - El título «Últimas 13 semanas».
  - El contenedor vacío del mapa.
  - La línea de información.
  - La leyenda estática de 5 niveles con su texto, con las muestras de color ocultas a los
    lectores de pantalla.

  **Hecho cuando:** en el navegador, el título y la leyenda («0», «1–29», «30–59», «60–119»,
  «120+») se ven entre el formulario y la lista, y la consola no tiene errores.

- [x] **T16. Pintar la rejilla: `mostrarMapa()` en `app.js`.**
  RF: RF-1, RF-2, RF-3 (clases), CA-1.3, CA-7.3, CA-7.4, CA-8.1, CA-8.2.
  - **Rejilla:** `role="grid"`, una fila de meses y 7 filas con las iniciales L/X/V.
  - **Celdas:** cada una con la clase `nivel-N`, la clase `hoy`, su `aria-label` y la fecha
    en un atributo de datos.
  - **Días futuros:** huecos con `aria-hidden`.
  - Llamada a `mostrarMapa()` desde `mostrarTodo()`.

  **Hecho cuando:** en el navegador se cumple todo esto:
  - Hay 7 filas, 13 columnas y tantas celdas como días visibles.
  - El `aria-label` de una celda coincide con `textoDeDia`.
  - Al guardar una sesión de hoy con 45 min, la celda de hoy pasa a `nivel-2` sin recargar.

- [x] **T17. Estilos de la rejilla, los niveles y la leyenda.**
  RF: RF-3, RNF-1, RNF-4, RNF-8.
  - Tokens de verde en `:root`.
  - Columnas `repeat(13, 1fr)`, casillas con `aspect-ratio: 1` y hueco de 3 px.
  - Muestras de la leyenda y ninguna animación.

  **Hecho cuando:** a 375 px de ancho la página no tiene desplazamiento horizontal y la
  distancia medida entre los centros de dos casillas vecinas es de al menos 24 px.

- [x] **T18. Marca de hoy y foco del teclado.**
  RF: CA-4.1, CA-4.2.
  - La marca de hoy es un borde interior en tinta, sin cambiar el relleno.
  - El foco es un `outline` en boli azul con separación.

  **Hecho cuando:** en una captura, la casilla de hoy conserva el color de su nivel con el
  borde visible, y el foco se distingue de la marca de hoy sobre los niveles 0 y 4.

- [x] **T19. Medir y ajustar los contrastes.**
  RF: CA-3.2, RNF-3.
  - Calcular los contrastes con un script de un solo uso, que no se guarda en el proyecto.
  - Ajustar los tokens si algún contraste no llega.

  **Hecho cuando:** los valores medidos cumplen y se han anotado en `MEMORY.md`:
  - Borde del nivel 0 con el fondo: ≥3:1.
  - Nivel 4 con el fondo: ≥3:1.
  - Niveles consecutivos: ≥1,3:1.

- [x] **T20. Línea de información: resumen y consulta con ratón o toque.**
  RF: CA-5.1, CA-5.2, CA-5.4, CA-5.5, CA-5.6.
  - Variable `fechaConsultada`.
  - Delegación de eventos: ratón encima, foco y clic.
  - Volver al resumen cuando el ratón sale del mapa, el foco sale o hay un toque fuera.

  **Hecho cuando:** en el navegador, con emulación táctil:
  - Sin interacción se ve el resumen.
  - Al tocar un día se ve su texto, y al tocar otro se sustituye.
  - Un día sin sesiones muestra «sin estudio».
  - Al tocar fuera del mapa vuelve el resumen.

- [x] **T21. Navegación con el teclado.**
  RF: CA-5.7.
  - Foco itinerante: solo una celda tiene `tabindex="0"`, por defecto hoy.
  - Flechas ←/→/↑/↓ entre días visibles, sin salir por los bordes ni entrar en los huecos.

  **Hecho cuando:** solo con el teclado, desde «Guardar sesión»:
  - Un Tab entra en hoy.
  - Las flechas recorren los días y la línea de información los va mostrando.
  - El siguiente Tab sale del mapa.

- [x] **T22. Conservar el día consultado al guardar.**
  RF: CA-8.1.
  Al repintar, si `fechaConsultada` sigue en el mapa, la línea muestra su texto con los datos
  nuevos.
  **Hecho cuando:** después de consultar un día pasado y guardar una sesión de 30 min con esa
  fecha, la línea de información muestra los minutos nuevos sin volver a tocar el día.

- [x] **T23. Accesibilidad para lectores de pantalla.**
  RF: CA-5.8, CA-6.2, HU-5.
  **Hecho cuando:** el árbol de accesibilidad del MCP (`take_snapshot`) muestra:
  - Una rejilla cuyo nombre es el resumen.
  - Una celda por día visible con su texto, y ningún hueco futuro.
  - La leyenda como texto.

  Si hay un lector de pantalla a mano (NVDA), se comprueba también con él.

- [x] **T24. Zoom al 200 % y texto grande.**
  RF: RNF-2.
  `overflow-x: auto` solo en el contenedor del mapa, con un ancho mínimo por casilla.
  **Hecho cuando:** con una ventana de 188 px de ancho (equivale a 375 px al 200 %), el ancho
  de la página no supera el de la ventana y solo el mapa se puede desplazar en horizontal.

- [x] **T25. Sesiones no válidas y datos ilegibles en el navegador.**
  RF: CA-9.3, CA-10.1, CA-10.2.
  **Hecho cuando**, en un contexto aislado:
  - Con una sesión de 0 min y otra con fecha `2026-02-30` guardadas a mano, las dos siguen
    en la lista y no colorean ningún día.
  - Con JSON roto en la clave, el mapa se ve vacío con «Todavía no hay sesiones en las
    últimas 13 semanas».

- [x] **T28. Limitar los minutos del formulario a 1440.** *(Añadida al implementar.)*
  RF: CA-9.3 y la decisión «sesión válida» de la spec.
  Antes, el formulario aceptaba cualquier entero, y una sesión de más de 1440 min se habría
  guardado sin verse en el mapa.
  **Hecho cuando:** el campo tiene `max="1440"`, la validación de `app.js` muestra «entre 1 y
  1440» y en el navegador una sesión de 2000 min no se guarda.

- [x] **T29. Datos guardados que no son una lista.** *(Añadida en la verificación.)*
  RF: CA-10.2.
  Con `{}` guardado, la página se rompía antes de pintar el mapa. Nueva función pura
  `sesionesDesdeTexto` en `logica.js`, con su test, que usa `cargarSesiones()`.
  **Hecho cuando:** el test pasa y en el navegador, con `{}` guardado, el mapa sale vacío con
  su texto, sin errores en la consola y sin tocar lo guardado.

- [x] **T30. El ratón quieto y el Enter no cambian el día consultado.** *(Añadida en la verificación.)*
  RF: CA-5.2, CA-5.5, CA-5.6, CA-8.1.
  - Al entrar con Tab, la página se desplazaba y el ratón quieto «consultaba» otro día. Ahora
    se usa `mousemove` y solo cuenta si el puntero se ha movido.
  - El Enter del formulario simula un clic en «Guardar sesión» que se tomaba como un toque
    fuera del mapa. Ahora se ignoran los clics con `detail === 0`.

  **Hecho cuando:** en el navegador se cumple todo esto:
  - Tab con el ratón quieto sobre el mapa muestra el día enfocado.
  - Pasar el ratón y tocar siguen funcionando.
  - Un clic real fuera vuelve al resumen.
  - Guardar con Enter actualiza el día consultado.

- [x] **T31. Tests de los casos límite que faltaban.** *(Añadida en la verificación.)*
  RF: sección 6 de la spec y CA-2.3.
  **Hecho cuando:** pasan los tests de:
  - Una sesión de hace más de 13 semanas: no sale en el mapa, pero cuenta en la mejor racha.
  - La fecha del dispositivo mal puesta.
  - El mismo mapa en tres zonas horarias.

## Fase 3 — Cierre

- [x] **T26. Verificación final en el navegador.**
  RF: RF-1 a RF-10, RNF-1, RNF-4.
  Recorrido completo:
  1. Sin sesiones.
  2. Registrar hoy, ayer y un día de hace 5 semanas.
  3. Consultar días con el ratón, con un toque y con el teclado.
  4. Recargar.

  **Hecho cuando:**
  - Todo se comporta como dice la spec.
  - La consola no tiene errores.
  - Hay una captura a 375 px guardada en el scratchpad.
  - La lista de peticiones de red del MCP no muestra ninguna petición fuera de los archivos
    locales (RNF-6).
  - No se ve ninguna animación en el mapa.

- [x] **T27. Documentación y criterios de finalización.**
  RF: — (criterios de finalización de la spec).
  - Añadir a `CLAUDE.md`, en «Fechas y racha», las reglas del mapa: período de 13 semanas
    desde el lunes, definición de sesión válida y tramos.
  - Actualizar `MEMORY.md` y mantenerlo en ~50 líneas.
  - Marcar los criterios de la sección 8 de la spec.

  **Hecho cuando:** `node --test` pasa, todos los criterios de finalización de la spec están
  marcados y `MEMORY.md` no supera ~50 líneas.

## Resumen de cobertura

| RF | Tareas |
|---|---|
| RF-1 Período | T03, T06, T09, T10, T16 |
| RF-2 Minutos | T08, T09, T16 |
| RF-3 Niveles | T07, T09, T16, T17, T19 |
| RF-4 Hoy | T09, T18 |
| RF-5 Consulta | T13, T20, T21, T23, T30 |
| RF-6 Leyenda | T15, T23 |
| RF-7 Ubicación y etiquetas | T12, T15, T16 |
| RF-8 Actualización | T10, T16, T22, T30 |
| RF-9 Sesiones que no se reflejan | T04, T05, T08, T25, T28 |
| RF-10 Sin sesiones | T11, T13, T25, T29 |
| RNF | T11 (5, 9), T17 (1, 4, 8), T19 (3), T24 (2), T13 y T15 (7: textos en español), T26 (6: sin peticiones de red en el MCP) |
