# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Web estática para registrar sesiones de estudio y motivarse viendo la racha de días 
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a 
programar. 

**Reglas superiores: `docs/constitution.md`.** Léela antes de cualquier cambio; si algo de este archivo choca con ella, manda la constitución.
## Stack y estructura 
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build. 
- `index.html` (estructura), `styles.css` (estilos), `logica.js` (cálculos puros: reciben las sesiones y "hoy", no tocan el DOM ni localStorage), `app.js` (lee el reloj y localStorage, pinta y gestiona eventos), `tests/` (pruebas de `logica.js`). 
- `index.html` carga `logica.js` antes que `app.js` como scripts normales; `logica.js` solo exporta con `module.exports` si existe `module` (Node). 
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES 
(`type="module"`), `fetch` a archivos locales ni nada que requiera servidor. 
## Convenciones 
- Textos de la interfaz en español. 
- Código simple, nombres descriptivos y comentarios solo donde aporten. 
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil. 
- Animaciones solo con CSS (`transform`/`opacity`) y respetando `prefers-reduced-motion`. 
## Datos 
- localStorage, clave `diario-de-estudio-sesiones`: array de `{ id, fecha: "AAAA-MM-DD", tema, minutos }` (`id` = `Date.now()` al guardar). 
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario 
perderá sus sesiones. 
## Comandos 
- Tests: `node --test` 
## Reglas 
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.
## Fechas y racha (fácil equivocarse) 
- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new 
Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día. 
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión 
pero ayer sí, la racha sigue viva y se cuenta desde ayer. 
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman. 
- Días de este mes = días distintos con sesión entre el día 1 del mes local y hoy (mes de calendario, no "últimos 30 días"). Se calcula, no se guarda. 
- Color de la racha por nivel: 0 gris (llama apagada), 1–99 rojo, 100–299 azul, 300–499 morado, 500+ dorado (`nivelDeRacha()` en `logica.js`). Se calcula, no se guarda. 
- Mejor racha = serie más larga de días consecutivos con sesión en todo el historial, sin fechas futuras (`calcularMejorRacha()`). Se calcula, no se guarda; oculta si no hay sesiones. 
- Mapa de calor (`specs/001-mapa-de-calor/`): 13 semanas, de lunes a domingo, terminando hoy; sin días futuros. Solo cuentan las sesiones válidas (fecha real y minutos enteros de 1 a 1440; las demás se ignoran en el mapa pero no se borran). Nivel por minutos del día: 0 / 1–29 / 30–59 / 60–119 / 120+. Se calcula, no se guarda. 
- El formulario solo acepta minutos enteros de 1 a 1440 (lo mismo que una sesión válida). 
- Para cualquier código con fechas, sigue la skill `.agents/skills/local-dates/SKILL.md` (no se carga sola: léela). 
## Forma de trabajar 
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta. 
- Cambios pequeños y enfocados; no reescribas lo que ya funciona. 
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar. 
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español. 
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados. 
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build. 
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea. 
## Verificación 
- No hay lint. Tests: `node --test` (archivos en `tests/`, fijan `TZ=Europe/Madrid` para probar el cambio de hora). Todo cambio en `logica.js` añade o actualiza su prueba, y todas pasan antes del commit.
- Después de cada cambio, verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave `diario-de-estudio-sesiones`.
## Memoria 
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas. 
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su 
porqué) y errores a evitar. 
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte. 
- Si algo se convierte en una regla permanente, propón moverlo a `CLAUDE.md` en lugar de 
dejarlo en la memoria. 
- No guardes nunca datos sensibles (claves, tokens, datos personales).
