# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de
  sesiones.
- Datos en localStorage (clave real en `app.js`: `diario-de-estudio-sesiones`).
- Días estudiados este mes: línea bajo la racha ("2 días este mes").
- Diseño "cuaderno de cuadrícula": fondo cuadriculado, racha en grande en rojo, formulario
  como ficha con borde, lista como hoja con margen rojo.

## Aprendizajes y errores a evitar
- `CLAUDE.md` tenía mal la clave y los campos de localStorage (ya corregido). Ante la duda,
  manda `app.js`: cambiar la clave o los campos haría perder los datos guardados.
- Las skills de `.agents/skills/` no se cargan solas en Claude Code (solo `.claude/skills/`):
  hay que leerlas a mano. La cabecera de `local-dates` está mal formada.
- Para probar la lógica de fechas sin navegador: extraer las funciones de `app.js` y
  ejecutarlas en Node con un `Date` simulado (1 de enero, 29 de febrero, cambio de hora).
- En rejillas CSS con `<input type="date">` usa `minmax(0, 1fr)`: con `1fr` la fecha
  ensancha la columna en el móvil.
- `app.js` usa las clases `sesion`, `sesion-tema`, `sesion-fecha` y `sesion-minutos` y los
  ids del HTML: no renombrarlos al tocar el diseño.

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Tipografías del sistema, sin Google Fonts (sería una dependencia y necesitaría internet):
  Bahnschrift (viene con Windows) para la interfaz y los números; serifa (Palatino/Georgia)
  para los temas, como letra de diario.
- "Este mes" = mes de calendario (del día 1 a hoy): es lo que se entiende al leerlo y se
  reinicia de forma predecible. Se calcula, no se guarda: el formato de datos no cambia.
- El número del mes va en azul y pequeño: el rojo grande es solo de la racha, que sigue
  siendo lo más llamativo.
- Colores: tinta azul marino para el texto, boli azul para lo que se pulsa, boli rojo solo
  para la racha y el margen.

## Próximos pasos
- Planificados sin implementar: mejor racha, minutos de esta semana.
