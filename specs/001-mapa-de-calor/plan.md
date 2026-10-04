# Plan 001 — Mapa de calor de días estudiados

- **Spec:** `specs/001-mapa-de-calor/spec.md` (aprobada)
- **Constitución:** `docs/constitution.md`
- **Requisito previo:** antes de empezar este plan debe estar terminada la tarea de separar la
  lógica de la interfaz. Es decir, deben existir `logica.js`, con las funciones de fechas y
  rachas actuales, y `tests/`, con pruebas que pasan con `node --test`. Si no existen, este plan
  no se ejecuta. Además, no se crea un mecanismo de carga nuevo: se usa el que defina esa tarea
  (ver la decisión D1).

## 1. Archivos

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `logica.js` | Modificar | Funciones **puras** del mapa: validar sesiones, sumar minutos por día, calcular niveles, construir las 13 semanas, etiquetas de mes y textos. No toca el DOM ni localStorage, y nunca lee el reloj: recibe «hoy» como parámetro. | RF-1, RF-2, RF-3, RF-4 (dato), RF-5 (textos), RF-7.3, RF-9, RF-10 |
| `app.js` | Modificar | Leer «hoy» del reloj, llamar a la lógica, pintar el mapa, gestionar la consulta de un día (ratón, toque, teclado) y repintar al guardar. | RF-4, RF-5, RF-6, RF-7, RF-8 |
| `index.html` | Modificar | Sección nueva del mapa entre el formulario y la lista: título, contenedor del mapa, línea de información y leyenda (estática). | RF-6, RF-7.1, RF-7.2 |
| `styles.css` | Modificar | Tonos de verde por nivel, marca de hoy, foco, rejilla adaptable, leyenda y desplazamiento interno con zoom. | RF-3, RF-4, RNF-1, RNF-2, RNF-3, RNF-8 |
| `tests/mapa.test.js` | Crear | Pruebas de todas las funciones nuevas de `logica.js` con `node --test`. | Todos los RF de lógica (sección 6) |
| `CLAUDE.md` | Modificar | Reglas del mapa en «Fechas y racha»: período, sesión válida y tramos. | — |
| `MEMORY.md` | Modificar | Estado, decisiones y aprendizajes. | — |

La spec no se toca. Si al implementar aparece una diferencia con ella, se corrigen las dos en el
mismo commit (principio 2).

## 2. Funciones puras en `logica.js`

Las fechas siempre son texto «AAAA-MM-DD». Se reutilizan `textoAFecha` y `fechaATexto`, que
llegan a `logica.js` con la tarea previa.

| Función | Entrada → salida | Qué hace | RF |
|---|---|---|---|
| `sumarDias(fecha, n)` | texto, entero → texto | Fecha desplazada `n` días usando `setDate` (nunca milisegundos). Generaliza `diaAnterior`. | RF-1, CA-2.3 |
| `esFechaReal(texto)` | texto → booleano | Formato `AAAA-MM-DD` y día existente: al convertirla y volver a texto sale lo mismo (`2026-02-30` → no). | Def. de sesión válida, RF-9.3 |
| `esSesionValida(sesion)` | objeto → booleano | `fecha` real y `minutos` de tipo número, entero, entre 1 y 1440. | Def., CA-9.3 |
| `inicioDeSemana(fecha)` | texto → texto | Lunes de la semana de esa fecha. | CA-1.2 |
| `nivelDeMinutos(minutos)` | número → 0…4 | Tramos fijos: 0 / 1–29 / 30–59 / 60–119 / 120+. | RF-3 |
| `minutosPorDia(sesiones, desde, hoy)` | lista, texto, texto → objeto `{ "AAAA-MM-DD": minutos }` | Suma los minutos de las sesiones válidas con fecha entre `desde` y `hoy`, ambos incluidos. | RF-2, CA-9.1, CA-9.2, CA-9.3 |
| `construirMapa(sesiones, hoy)` | lista, texto → `{ semanas, diasConEstudio }` | Las 13 semanas × 7 días con fecha, minutos, nivel y `esHoy`; los días futuros son `null`. Si `sesiones` no es una lista, la trata como vacía. | RF-1, RF-2, RF-3, CA-4.1 (dato), RF-10 |
| `etiquetasDeMes(semanas)` | semanas → lista de 13 textos | Mes abreviado («oct») en la columna que contiene un día 1, y `""` en el resto. Ver D11. | CA-7.3 |
| `textoDeDia(dia)` | `{ fecha, minutos }` → texto | «sábado, 3 de octubre de 2026: 45 min», o «…: sin estudio» si tiene 0 minutos. Siempre «N min». | CA-5.2, CA-5.3, CA-5.4, CA-5.8 |
| `textoResumen(diasConEstudio)` | entero → texto | «23 días con estudio en las últimas 13 semanas» («1 día…» en singular). Con 0, «Todavía no hay sesiones en las últimas 13 semanas». | CA-5.1, CA-10.1 |

Ninguna función modifica la lista de sesiones que recibe (RNF-5).

## 3. Algoritmo del mapa (pseudocódigo)

```
función construirMapa(sesiones, hoy):
    si sesiones no es una lista: sesiones ← lista vacía                    # CA-10.2

    lunesActual ← inicioDeSemana(hoy)                                      # CA-1.2
    primerDia   ← sumarDias(lunesActual, -12 × 7)                          # CA-1.1: 13 semanas
    minutos     ← minutosPorDia(sesiones, primerDia, hoy)                  # RF-2, RF-9

    semanas ← lista vacía
    diasConEstudio ← 0
    para s desde 0 hasta 12:                                               # columnas
        semana ← lista vacía
        para d desde 0 hasta 6:                                            # lunes … domingo
            fecha ← sumarDias(primerDia, s × 7 + d)     # siempre desde primerDia: sin errores acumulados
            si fecha > hoy:                             # comparación de texto «AAAA-MM-DD»
                añadir null a semana                                       # CA-1.3
            si no:
                m ← minutos[fecha] o 0                                     # CA-2.2
                si m > 0: diasConEstudio ← diasConEstudio + 1
                añadir { fecha, minutos: m, nivel: nivelDeMinutos(m),
                         esHoy: fecha = hoy } a semana                     # RF-3, CA-4.1
        añadir semana a semanas
    devolver { semanas, diasConEstudio }

función minutosPorDia(sesiones, desde, hoy):
    total ← objeto vacío
    para cada sesion en sesiones:                                          # una sola pasada: RNF-9
        si no esSesionValida(sesion): continuar                            # CA-9.3
        si sesion.fecha < desde o sesion.fecha > hoy: continuar            # CA-9.2, CA-9.1
        total[sesion.fecha] ← (total[sesion.fecha] o 0) + sesion.minutos   # CA-2.1
    devolver total
```

`inicioDeSemana(fecha)`: si `getDay()` es 0 (domingo) se retroceden 6 días; si no, se
retroceden `getDay() - 1` días. Se hace con `sumarDias`.

El cambio de semana (CA-1.4) y la aparición de las sesiones futuras cuando llega su fecha
(CA-8.3) no necesitan código propio: salen solos al calcular con un «hoy» nuevo.

## 4. Cómo se pinta en la interfaz

### 4.1 Estructura (`index.html`)
Una `<section class="hoja mapa">` entre la ficha del formulario y la hoja de sesiones (CA-7.1),
que contiene:
1. `<h2>Últimas 13 semanas</h2>` (CA-7.2).
2. Un contenedor vacío del mapa, que rellena `app.js`.
3. La línea de información: un `<p>` con id propio (RF-5).
4. La leyenda: una lista estática con 5 elementos. Cada uno lleva una muestra de color oculta a
   los lectores de pantalla y su texto visible («0», «1–29», «30–59», «60–119», «120+»)
   (RF-6).

### 4.2 Rejilla (`app.js`, función `mostrarMapa()`)
- Llama a `construirMapa(sesiones, hoyEnTexto())` y a `etiquetasDeMes(...)`. Lo único que lee el
  reloj es `hoyEnTexto()`, que vive en `app.js`.
- Vacía y reconstruye el contenedor en cada llamada, como ya hace `mostrarLista()`.
- Estructura accesible de tipo rejilla (D6):
  - Un contenedor con `role="grid"`. Su `aria-label` es el resumen (`textoResumen`) (CA-5.8).
  - Una fila de cabecera con las 13 etiquetas de mes (CA-7.3).
  - 7 filas (`role="row"`), de lunes a domingo, en ese orden en el documento (CA-1.2). Cada fila
    empieza con su inicial: «L», «X» y «V» en las filas 1, 3 y 5; vacía en las demás (CA-7.4).
- Cada día visible es una celda (`role="gridcell"`) con:
  - Clase `nivel-0` … `nivel-4` (RF-3).
  - Clase `hoy` si `esHoy` es verdadero (CA-4.1).
  - `aria-label` con `textoDeDia(dia)` (CA-5.8).
  - El atributo de datos con su fecha, para encontrar el día al consultarlo.
- Cada `null` (día futuro) es un hueco vacío con `aria-hidden="true"`: no se ve ni se anuncia
  (CA-1.3, CA-5.8).
- Foco itinerante (*roving tabindex*): solo una celda tiene `tabindex="0"` (la consultada o, si
  no hay ninguna, hoy); las demás tienen `-1` (CA-5.7).
- `mostrarMapa()` se llama desde `mostrarTodo()`. Así se pinta al abrir la página (CA-8.2) y al
  guardar una sesión (CA-8.1).

### 4.3 Consultar un día (`app.js`)
- Estado mínimo: la variable `fechaConsultada` (texto o `null`).
- Eventos en el contenedor del mapa (delegación: un solo escuchador por tipo):
  - Ratón sobre una celda, foco en una celda o clic/toque en una celda → `fechaConsultada` pasa a
    ser su fecha y la línea de información muestra `textoDeDia` (CA-5.2, CA-5.5). Vale siempre
    la última interacción.
  - Flechas ←/→/↑/↓ con el foco dentro → se mueve el foco a la celda vecina visible y se
    actualiza el `tabindex` itinerante. Los bordes y los huecos futuros no tienen salida (CA-5.7).
- Volver al resumen (CA-5.6):
  - El ratón sale del mapa.
  - El foco sale del mapa.
  - Un toque fuera del mapa (escuchador en el documento que comprueba si el destino está fuera).

  En los tres casos, `fechaConsultada` vuelve a `null` y se muestra `textoResumen`.
- Al repintar después de guardar (CA-8.1): si `fechaConsultada` sigue dentro del mapa, la línea
  muestra su texto con los minutos nuevos; si no, el resumen.

### 4.4 Estilos (`styles.css`)
- **Tonos.** Tokens nuevos en `:root`: un borde para el nivel 0 y cuatro verdes. Propuesta
  inicial, que hay que medir al implementar (CA-3.2, RNF-3):

  | Nivel | Color | Comprobación |
  |---|---|---|
  | 0 | Solo borde | El borde debe dar ≥3:1 con el blanco |
  | 1 | `#c6e9c9` | — |
  | 2 | `#8ccf95` | — |
  | 3 | `#4aa35a` | — |
  | 4 | `#1f6b2e` | ≥3:1 con el blanco |

  Además, ≥1,3:1 entre niveles consecutivos.
- **Tamaño.** Rejilla CSS con una columna estrecha para las iniciales y `repeat(13, 1fr)`. Las
  casillas son cuadradas (`aspect-ratio: 1`) y tienen un hueco de 3 px. A 375 px eso da unos
  25 px entre centros (RNF-1).
- **Zoom.** El contenedor del mapa tiene `overflow-x: auto` y un ancho mínimo por casilla. Con
  zoom al 200 % se desplaza solo el mapa, no la página (RNF-2).
- **Hoy.** Borde interior de 2 px en tinta azul marino, que no cambia el relleno (CA-4.1).
- **Foco.** `outline` de 2 px en boli azul con separación, distinto del borde de hoy (CA-4.2).
- **Animaciones.** Ninguna (RNF-4). Los textos del mapa son más pequeños que el número de la
  racha (RNF-8).

## 5. Decisiones técnicas

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| D1 | `logica.js` es un script normal (sin módulos). Al final hace `if (typeof module !== "undefined") module.exports = {…}`. En el navegador sus funciones son globales; en los tests se cargan con `require`. | Módulos ES (`import`/`export`) | Los módulos no funcionan con `file://` y el principio 1 los prohíbe. También se descarta cargar el archivo en los tests con `vm`: es más difícil de entender para un principiante. *Lo fija la tarea previa; aquí solo se reutiliza.* |
| D2 | «Hoy» entra como parámetro, en texto «AAAA-MM-DD». | Leer `new Date()` dentro de la lógica | Con el parámetro, los tests eligen el día (lunes, domingo, cambio de hora) sin falsear el reloj, y se cumple el principio 3. Se usa texto y no `Date` porque es el mismo formato que las sesiones y no arrastra horas ni zonas. |
| D3 | Cada fecha del mapa se calcula desde `primerDia` con `sumarDias` (`setDate`). | Sumar 86 400 000 ms, o ir sumando día a día sobre la fecha anterior | Con milisegundos se pierden o duplican días en el cambio de hora (skill `local-dates`). Calcular siempre desde el primer día evita acumular errores. |
| D4 | Minutos por día en un objeto normal `{ fecha: minutos }`. | `Map` | Un objeto es más familiar para un principiante y con 91 días el rendimiento es igual. |
| D5 | Validar en la lógica e ignorar las sesiones no válidas sin tocarlas. | Limpiar o corregir los datos guardados | El principio 5 prohíbe borrar o modificar sesiones (CA-9.3, RNF-5). |
| D6 | Rejilla accesible (`role="grid"`) con foco itinerante y flechas. | Un botón por día (91 paradas de Tab), o casillas sin interacción | La primera incumple CA-5.7; la segunda deja fuera a quien usa teclado (HU-5). |
| D7 | Filas = días de la semana en el orden del documento (de lunes a domingo). | Columnas en el orden del documento, con `grid-auto-flow: column` | El patrón `grid` necesita filas reales para que los lectores de pantalla se orienten. Visualmente queda igual. |
| D8 | Línea de información fija bajo el mapa. | Texto flotante (*tooltip*) o atributo `title` | El texto flotante se sale de la pantalla en las columnas de los bordes. `title` no funciona con toque ni con teclado. |
| D9 | La línea de información **sin** `aria-live`. | `aria-live="polite"` | Cada celda ya tiene su `aria-label`: con `aria-live`, el lector repetiría cada movimiento del ratón. |
| D10 | Reconstruir el mapa entero en cada repintado. | Actualizar solo las casillas que cambian | Son 91 casillas: el coste es despreciable (RNF-9) y el código es mucho más simple. Es el mismo enfoque que `mostrarLista()`. |
| D11 | Etiqueta de mes en la columna que contiene un día 1. La primera columna también lleva etiqueta si la siguiente etiqueta está a 3 columnas o más. | Etiquetar cada columna con el mes de su lunes | Repetiría «oct oct oct oct» y no cabe a 375 px. La excepción de la primera columna evita un tramo inicial sin mes y evita que dos etiquetas se monten. |
| D12 | Rejilla con columnas `1fr` y casillas cuadradas. | Tamaños fijos en píxeles | Se adapta a cualquier ancho desde 375 px manteniendo los 24 px entre centros, y deja que el zoom la haga crecer. |

## 6. Estrategia de tests (`node --test`)

- **Archivo y herramientas.** `tests/mapa.test.js` usa `node:test` y `node:assert/strict`, que
  vienen con Node, sin npm (principio 4). Carga las funciones con `require("../logica.js")`
  (D1).
- **Zona horaria.** Al principio del archivo se fija `process.env.TZ = "Europe/Madrid"`, una
  zona con cambio de hora, antes de crear ninguna fecha. Al implementar hay que comprobar que en
  Windows se respeta.
- **Reloj.** No se falsea: «hoy» es un parámetro (D2).
- **Cómo se ejecutan.** `node --test` desde la raíz. Se ha comprobado que en `.agents/` no hay
  archivos que `node --test` descubra por error.

| Grupo | Casos | RF / caso límite |
|---|---|---|
| `nivelDeMinutos` | 0, 1, 29, 30, 59, 60, 119, 120 y 900 → 0, 1, 1, 2, 2, 3, 3, 4 y 4 | RF-3, límites de tramo |
| `esSesionValida` | Válidas: 1 min, 1440 min. No válidas: 0, 29,5, «30» (texto), −5, 1441, fecha `2026-02-30`, `2026-2-3`, sin fecha, sin minutos, `null` | Def. de sesión válida, CA-9.3 |
| `minutosPorDia` | Suma de varias sesiones del mismo día (20 + 15 = 35); suma de más de 1440 en un día; excluye fechas futuras y anteriores a `desde`; ignora las no válidas | RF-2, CA-9.1–9.3 |
| `construirMapa`: forma | 13 semanas × 7; el primer día es lunes; el último día visible es `hoy` | CA-1.1–1.3 |
| `construirMapa`: última columna | Hoy lunes → 1 día visible y 6 `null`; hoy domingo → 7 visibles | CA-1.3 |
| `construirMapa`: continuidad | Cada día visible es el anterior + 1, sin huecos ni repetidos, con períodos que cruzan: el cambio de hora de octubre (hoy 2026-11-01) y el de marzo (hoy 2027-04-04), un cambio de año (hoy 2027-01-10) y un 29 de febrero (hoy 2028-03-05) | Casos límite de fechas |
| `construirMapa`: hoy y niveles | Solo hoy tiene `esHoy`; hoy sin sesiones → nivel 0; una sesión pasada dentro del período cambia solo su día | CA-4.1, CA-3.3 |
| `construirMapa`: cambio de semana | Con hoy domingo y con hoy el lunes siguiente, la primera columna avanza una semana | CA-1.4 |
| `construirMapa`: datos raros | `sesiones` no es una lista → todo en nivel 0 y `diasConEstudio` 0; una sesión futura no cuenta, pero sí cuenta al pasar como `hoy` su fecha | CA-10.1, CA-10.2, CA-8.3 |
| `construirMapa`: datos intactos | La lista de sesiones es idéntica antes y después | RNF-5 |
| `construirMapa`: rendimiento | 5 000 sesiones en menos de 100 ms (medido en el PC; orientativo para el móvil) | RNF-9 |
| `etiquetasDeMes` | Un período que empieza a mitad de mes; un mes que empieza en lunes; nunca dos etiquetas en columnas contiguas | CA-7.3 |
| `textoDeDia` | `{ 2026-10-03, 45 }` → «sábado, 3 de octubre de 2026: 45 min»; 0 → «…: sin estudio»; 125 → «125 min» | CA-5.2–5.4 |
| `textoResumen` | 0, 1 y 23 → texto vacío (CA-10.1), singular y plural | CA-5.1, CA-10.1 |

**Lo que no cubren los tests**, porque es interfaz y se verifica en el navegador con el MCP de
Chrome DevTools, como dice `CLAUDE.md`:
- La ubicación, el título y las etiquetas: RF-7.
- La consulta con ratón, toque y teclado: RF-5, CA-5.5–5.7.
- La marca de hoy frente al foco: RF-4.
- La leyenda: RF-6.
- Los 375 px (RNF-1) y el zoom al 200 % (RNF-2).
- Los contrastes, medidos: CA-3.2 y RNF-3.
- La consola sin errores.

## 7. Cobertura de requisitos

| RF | Dónde se cubre |
|---|---|
| RF-1 Período | `inicioDeSemana`, `sumarDias`, `construirMapa` (§2, §3); rejilla (§4.2); tests de forma, última columna y cambio de semana |
| RF-2 Minutos | `minutosPorDia`, `construirMapa` (§3); D3; tests de suma y continuidad |
| RF-3 Niveles | `nivelDeMinutos` (§2); clases `nivel-*` y tonos (§4.2, §4.4); tests de límites; contraste medido |
| RF-4 Hoy | `esHoy` (§3); clase `hoy` y foco distinto (§4.4); verificación en el navegador |
| RF-5 Consulta | `textoDeDia`, `textoResumen` (§2); eventos y foco itinerante (§4.3); D6, D8, D9 |
| RF-6 Leyenda | Leyenda estática con texto (§4.1); verificación con lector de pantalla |
| RF-7 Ubicación y etiquetas | Sección entre formulario y lista (§4.1); `etiquetasDeMes` (§2, D11); iniciales L/X/V (§4.2) |
| RF-8 Actualización | `mostrarMapa()` desde `mostrarTodo()`; repintado con el día consultado (§4.2, §4.3); test de sesión futura |
| RF-9 Sesiones que no se reflejan | `esSesionValida`, `minutosPorDia` (§2, §3); D5; tests de validez y de rango |
| RF-10 Sin sesiones | `construirMapa` con lista vacía o no válida; `textoResumen(0)` (§2, §3); tests de datos raros |

## 8. Orden de trabajo

1. Comprobar el requisito previo: existen `logica.js`, `tests/`, y `node --test` pasa.
2. Escribir los tests de §6 (fallan).
3. Implementar las funciones de §2 hasta que los tests pasen.
4. Estructura en `index.html`, pintado y eventos en `app.js`, estilos en `styles.css`.
5. Verificar en el navegador con el MCP de Chrome DevTools la lista de §6 que no cubren los
   tests.
6. Actualizar `CLAUDE.md` y `MEMORY.md`, y marcar los criterios de finalización de la spec.

## 9. Cambios durante la implementación

Lo que cambió respecto a este plan, con su motivo:

- **`mesAbreviado(fecha)`:** función auxiliar nueva de `etiquetasDeMes`. Se exporta y tiene
  su propio test (principio 4).
- **Tests de la tarea previa:** la spec 002 añadió `tests/logica.test.js`. Con
  `tests/mapa.test.js` suman 44 tests.
- **Volver a hoy (`volverAlResumen`):** ahora también devuelve el `tabindex="0"` al día de hoy.
  Sin esto, el siguiente Tab entraba por el último día tocado y no por hoy (lo detectó la
  prueba de T21).
- **Medidas a 375 px:** la tarjeta del mapa usa 6 px de margen lateral (no los 20 px de las
  demás tarjetas) para llegar a 24,2 px entre centros (RNF-1). La línea de información usa
  8 px de margen para que el texto más largo quepa en una línea.
- **Lista de sesiones con zoom:** con zoom al 200 %, los minutos de la lista (código anterior
  al mapa) desbordaban la página. Bajan de línea con `@media (max-width: 300px)` (RNF-2).
- **Formulario:** limitado a 1440 minutos (T28) para que coincida con «sesión válida».
- **Contrastes:** la paleta propuesta en §4.4 cumplió sin cambios (medidos en T19).
- **Verificación final (T29–T31):**
  - **Datos que no son una lista:** `cargarSesiones()` pasa a usar la nueva función pura
    `sesionesDesdeTexto`, que devuelve una lista vacía si lo guardado no es una lista
    (CA-10.2).
  - **Ratón:** se usa `mousemove` en lugar de `mouseover` (D6 y §4.3) y solo cuenta si el
    puntero se ha movido.
  - **Clic fuera del mapa:** ignora los clics simulados por el teclado (`detail === 0`), como el
    del Enter en el formulario.
  - **Tests:** suman 47.
