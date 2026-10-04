# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual
- Funciona: sesiones (fecha, tema, minutos 1–1440), racha con color por nivel, días de este
  mes, mejor racha, mapa de calor de 13 semanas y lista. Datos en localStorage
  (`diario-de-estudio-sesiones`).
- Cálculos en `logica.js` (puros, «hoy» como parámetro); `app.js` pinta. 47 tests con
  `node --test` (`tests/logica.test.js`, `tests/mapa.test.js`).
- Specs terminadas: `specs/002-separar-logica/` (previa) y `specs/001-mapa-de-calor/`
  (spec, plan y tasks marcadas).
- Diseño "cuaderno de cuadrícula": racha grande, formulario como ficha, mapa en tarjeta
  blanca entre formulario y lista, lista como hoja con margen rojo.

## Aprendizajes y errores a evitar
- Ante la duda sobre la clave o los campos de localStorage, manda `app.js`.
- Las skills de `.agents/skills/` no se cargan solas en Claude Code: hay que leerlas a mano.
- Tests: `process.env.TZ = "Europe/Madrid"` al principio del archivo funciona en Windows.
- `logica.js` y `app.js` comparten espacio global en el navegador: nunca repetir nombres.
- Chrome DevTools MCP: usar `isolatedContext`. El error "Unsafe attempt to load URL
  file://" sale al abrir la pestaña, no es de la app. El puntero virtual se queda donde fue
  el último clic: al desplazar la página puede lanzar "ratón encima" sobre el mapa.
- Medir el mapa a 375 px: el margen lateral cuenta. Tarjeta con 6 px de margen → 24,2 px
  entre centros; la línea de información necesita 8 px de margen para caber en una línea.
- Zoom 200 % = ventana de 188 px: los minutos de la lista desbordaban; bajan de línea con
  `@media (max-width: 300px)`.
- Ratón en el mapa: `mouseover` también salta al desplazar la página con el ratón quieto;
  usar `mousemove` y comprobar que cambió la posición. El Enter de un formulario simula un
  clic en su botón (`detail === 0`): no tratarlo como un toque.
- En rejillas CSS con `<input type="date">` usa `minmax(0, 1fr)`.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados.
- Tipografías del sistema: Bahnschrift (interfaz y números) y serifa (temas).
- "Este mes" = mes de calendario. Todo lo derivado se calcula, no se guarda.
- Colores: tinta azul marino (texto), boli azul (lo que se pulsa y el foco), rojo/nivel
  (racha), verdes (mapa). Llama en SVG, apagada con racha 0.
- Mapa: 13 semanas (con 16 las casillas no llegan a 24 px táctiles); rejilla ARIA con un
  solo Tab y flechas; línea de información fija en vez de tooltip; sin aria-live.
- Contrastes medidos del mapa: borde nivel 0 3,49:1, nivel 4 6,56:1, consecutivos
  1,39 / 1,72 / 2,09. Hoy = anillo tinta + hilo blanco (se ve sobre el verde oscuro).
- Formulario limitado a 1440 min para que coincida con «sesión válida» del mapa.

## Próximos pasos
- Planificado sin implementar: minutos de esta semana.
- Specs aparte pendientes: página abierta al pasar la medianoche; tratar igual las sesiones
  no válidas en racha, mes y mejor racha.
- Spec 001: falta solo probar el mapa con NVDA (lector de pantalla real).
