# Constitución del Diario de Estudio
Principios innegociables. Si algo choca con ellos, primero se cambia esta constitución (con aprobación); nunca se ignora.

1. **Stack mínimo.** Solo HTML, CSS y JavaScript sin dependencias, npm, build ni módulos ES: `index.html` funciona con doble clic (`file://`).
2. **La spec manda.** Ninguna funcionalidad se programa sin una spec aprobada en `specs/NNN-nombre/spec.md`; si código y spec no coinciden, ambos se corrigen en el mismo commit.
3. **Lógica separada de la interfaz.** Los cálculos (fechas, rachas, totales) son funciones puras en `logica.js` que no tocan el DOM ni localStorage; `app.js` solo lee el formulario, guarda y pinta.
4. **Tests sin dependencias.** Cada función de `logica.js` tiene pruebas que se ejecutan con `node --test` (el runner que trae Node, sin npm ni paquetes); todo cambio de lógica añade o actualiza su prueba, y todas pasan antes del commit.
5. **Los datos del usuario son sagrados.** La clave `diario-de-estudio-sesiones` y la forma `{ id, fecha, tema, minutos }` no se rompen: todo cambio sigue leyendo lo ya guardado, nada borra sesiones sin que el usuario lo pida y los datos nunca salen del navegador.
6. **Español en todo.** Textos de la interfaz, nombres de variables y funciones, comentarios y documentación en español.
