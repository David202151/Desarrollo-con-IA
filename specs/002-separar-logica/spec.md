# Spec 002 — Separar la lógica de la interfaz y añadir tests

- **Estado:** implementada y verificada. Aprobada por el usuario (2026-10-04, «implementa todo para que se cumplan las
  tasks»). Es el requisito previo de la spec 001.
- **Constitución:** `docs/constitution.md` (principios 3 y 4)

## 1. Contexto y objetivo

Hoy todos los cálculos (fechas, racha, mejor racha, días del mes, nivel de la racha) viven en
`app.js`, mezclados con el código que lee el formulario y pinta la pantalla. Además, leen el reloj
y la lista global de sesiones por su cuenta. Así no se pueden probar de forma automática, y el
proyecto incumple los principios 3 y 4 de la constitución.

**Objetivo:** separar los cálculos en funciones puras que se puedan probar con `node --test`, sin
cambiar nada de lo que ve o guarda el usuario.

Esta spec es de refactorización: el «qué» es precisamente una estructura de código, así que aquí
sí se nombran archivos.

## 2. Requisitos funcionales

- **RF-1. Comportamiento idéntico.** El sistema deberá mostrar exactamente lo mismo que antes:
  - Racha, color de nivel, pulso, días de este mes, mejor racha, lista y fosforito.
  - Los mismos datos guardados.
  - **CA-1.1.** Cuando se abra la página con las mismas sesiones, el sistema deberá mostrar los
    mismos números y textos que antes del cambio.
- **RF-2. Lógica pura.** Los cálculos deberán estar en `logica.js`. Ninguna función de ese archivo
  deberá usar `document`, `localStorage` ni `new Date()` sin argumentos.
  - **CA-2.1.** Cada cálculo deberá recibir lo que necesita como parámetro: la lista de sesiones
    y «hoy» como texto «AAAA-MM-DD».
  - **CA-2.2.** `app.js` deberá ser el único que lee el reloj (`hoyEnTexto`) y localStorage.
- **RF-3. Funciona con doble clic.** El sistema deberá seguir funcionando abriendo `index.html`
  con doble clic (`file://`), sin módulos ES.
  - **CA-3.1.** `index.html` deberá cargar `logica.js` antes que `app.js`, como scripts normales.
- **RF-4. Tests.** Cada función de `logica.js` deberá tener pruebas en `tests/` que se ejecuten
  con `node --test`, sin npm ni paquetes.
  - **CA-4.1.** Las pruebas deberán fijar una zona horaria con cambio de hora (Europe/Madrid) y
    cubrir:
    - Cambio de mes y de año, y el 29 de febrero.
    - Cambio de hora.
    - Racha viva desde ayer y varias sesiones el mismo día.
    - Fechas futuras.
    - Límites de nivel: 0, 99, 100, 299, 300, 499 y 500.

## 3. Decisión técnica (la usa también el plan 001, D1)

`logica.js` es un script normal. Al final, si existe `module` (es decir, en Node), exporta sus
funciones con `module.exports`.
- En el navegador sus funciones quedan globales y `app.js` las usa directamente.
- En los tests se cargan con `require`.
- **Alternativa descartada:** módulos ES. No funcionan con `file://` y el principio 1 los prohíbe.

## 4. Fuera de alcance

- Cambiar cualquier comportamiento visible, salvo lo que pida otra spec.
- Arreglar los fallos conocidos: la página abierta al pasar la medianoche y los datos guardados
  que no son una lista.

## 5. Criterios de finalización

- [x] `logica.js` contiene todos los cálculos y cumple RF-2.
- [x] `node --test` pasa con las pruebas de RF-4.
- [x] Verificado en el navegador: mismos resultados que antes y consola sin errores.
- [x] `CLAUDE.md` y `MEMORY.md` actualizados.
