# Spec 001 — Mapa de calor de días estudiados

- **Estado:** implementada y verificada (2026-10-04). Solo queda la prueba con un lector de pantalla real (NVDA). Plan: `plan.md`. Tareas: `tasks.md`.
- **Fecha:** 2026-10-04
- **Constitución:** `docs/constitution.md`
- **Requisito previo:** la tarea pendiente de separar la lógica de la interfaz y añadir pruebas
  automáticas (principios 3 y 4) debe estar terminada, con su propia spec, antes de implementar
  esta. Esta spec no se implementa sobre el código actual.

## 1. Contexto y objetivo

El Diario de Estudio ya muestra la racha actual, la mejor racha y los días estudiados este
mes. Son números: dicen *cuánto*, pero no *cuándo* ni *con qué intensidad*. No permiten ver
de un vistazo si la constancia ha sido regular, dónde están los huecos o qué días fueron
especialmente intensos.

**Objetivo:** mostrar un mapa de calor, al estilo del de GitHub, con los días de las últimas
13 semanas (unos 3 meses), donde cada día se colorea con más intensidad cuantos más minutos se
estudiaron. Así el usuario ve su historial reciente de un vistazo y se motiva a no dejar huecos.

## 2. Usuarios

- **Estudiante que usa el diario:** registra sus sesiones y quiere ver su constancia. Suele
  consultarlo en el móvil.
- **Usuario con baja visión, daltonismo o que navega con teclado o lector de pantalla:**
  necesita conocer los minutos de cada día sin depender del color.

## 3. Historias de usuario

- **HU-1.** Como estudiante, quiero ver de un vistazo qué días estudié en las últimas
  semanas, para detectar huecos y mantener la constancia.
- **HU-2.** Como estudiante, quiero distinguir los días en que estudié mucho de los que
  estudié poco, para saber si mi esfuerzo es regular.
- **HU-3.** Como estudiante, quiero consultar cuántos minutos estudié un día concreto del
  mapa, para recordar exactamente lo que hice.
- **HU-4.** Como estudiante, quiero entender qué significa cada color, para interpretar el
  mapa sin adivinar.
- **HU-5.** Como usuario de teclado o lector de pantalla, quiero acceder a la misma
  información que se ve en el mapa, para no quedarme fuera de la funcionalidad.

## 4. Requisitos funcionales

Notación EARS: *El sistema deberá…* (siempre) · *Cuando…* (evento) · *Mientras…* (estado) ·
*Si…, entonces…* (situación no deseada).

**Definiciones usadas en los requisitos:**
- **Hoy:** la fecha del dispositivo del usuario en el momento de abrir la página o de guardar
  una sesión (lo que ocurra más tarde).
- **Sesión válida:** sesión cuya fecha es un día real del calendario escrito como
  «AAAA-MM-DD» y cuyos minutos son un número entero entre 1 y 1440. Cualquier otra es
  **sesión no válida**.
- **Minutos de un día:** suma de los minutos de las sesiones válidas con esa fecha.

### RF-1. Período mostrado (HU-1)
- **CA-1.1.** El sistema deberá mostrar 13 columnas, una por semana: la semana de hoy y las
  12 anteriores, de la más antigua (izquierda) a la actual (derecha).
- **CA-1.2.** El sistema deberá mostrar 7 filas, una por día de la semana, de **lunes**
  (arriba) a **domingo** (abajo).
- **CA-1.3.** El sistema no deberá mostrar los días de la semana actual posteriores a hoy: la
  última columna queda incompleta.
- **CA-1.4.** Cuando cambie la semana (al llegar el lunes), el sistema deberá mostrar una
  columna nueva a la derecha y dejar de mostrar la más antigua.

### RF-2. Minutos de cada día (HU-1, HU-2)
- **CA-2.1.** El sistema deberá mostrar para cada día del período los minutos de ese día.
- **CA-2.2.** Cuando un día no tenga sesiones válidas, el sistema deberá tratarlo como un día
  con 0 minutos.
- **CA-2.3.** El sistema deberá asignar cada sesión exactamente al día que el usuario eligió al
  registrarla, sin desplazarla a otro día por la zona horaria ni por la hora del registro.

### RF-3. Intensidad del color (HU-2)
Cada día se muestra en uno de cinco niveles fijos según sus minutos, en tonos de **verde**
(color propio del mapa, distinto del rojo y de los colores de nivel de la racha y del azul de
los botones):

| Nivel | Minutos del día | Aspecto |
|---|---|---|
| 0 | 0 | Casilla vacía, solo con borde |
| 1 | 1–29 | Verde más claro |
| 2 | 30–59 | Verde medio |
| 3 | 60–119 | Verde fuerte |
| 4 | 120 o más | Verde más oscuro |

- **CA-3.1.** El sistema deberá asignar a cada día el nivel que corresponda a sus minutos
  según la tabla.
- **CA-3.2.** El sistema deberá usar en los niveles 1 a 4 tonos cuya luminosidad disminuya
  estrictamente del nivel 1 al 4, con un contraste de al menos 1,3:1 entre niveles consecutivos.
- **CA-3.3.** El nivel de un día solo deberá cambiar si cambian las sesiones de ese día: no
  depende de los demás días.

### RF-4. Día de hoy (HU-1)
- **CA-4.1.** El sistema deberá marcar el día de hoy con una marca que no cambie el relleno de
  la casilla, de modo que su nivel siga reconociéndose.
- **CA-4.2.** El sistema deberá mostrar el indicador de foco del teclado de forma distinta a la
  marca de hoy y visible sobre cualquier nivel.

### RF-5. Consultar un día (HU-3, HU-5)
Debajo del mapa hay una **línea de información** fija, de una sola línea de texto.

- **CA-5.1.** Mientras no se esté consultando ningún día, el sistema deberá mostrar en la línea
  de información un resumen del período, por ejemplo «23 días con estudio en las últimas 13
  semanas».
- **CA-5.2.** Cuando el usuario toque un día, pase el ratón por encima o lo enfoque con el
  teclado, el sistema deberá mostrar en la línea de información la fecha completa y los
  minutos de ese día, por ejemplo «sábado, 3 de octubre de 2026: 45 min».
- **CA-5.3.** El sistema deberá mostrar los minutos siempre como «N min», también por encima
  de 60 (por ejemplo, «125 min»), igual que en la lista de sesiones.
- **CA-5.4.** Cuando el día tenga 0 minutos, el sistema deberá mostrar «sin estudio» en lugar
  de «0 min».
- **CA-5.5.** Cuando el usuario consulte otro día, el sistema deberá sustituir el texto por el
  del nuevo día: vale siempre la última interacción.
- **CA-5.6.** Cuando el ratón salga del mapa, o el foco o un toque vayan fuera del mapa, el
  sistema deberá volver a mostrar el resumen del período.
- **CA-5.7.** El sistema deberá permitir entrar al mapa con una sola pulsación de Tab, moverse
  entre los días con las flechas del teclado y salir del mapa con la siguiente pulsación de Tab.
- **CA-5.8.** El sistema deberá ofrecer a los lectores de pantalla, al entrar en el mapa, el
  resumen del período, y para cada día la misma información que muestra la línea de
  información. Los días no mostrados (CA-1.3) no deberán anunciarse.

### RF-6. Leyenda (HU-4)
- **CA-6.1.** El sistema deberá mostrar debajo del mapa una leyenda con los cinco niveles y,
  junto a cada uno, su texto de minutos («0», «1–29», «30–59», «60–119», «120+»).
- **CA-6.2.** El sistema deberá hacer la leyenda legible para los lectores de pantalla como
  texto, no solo como color.

### RF-7. Ubicación, título y etiquetas (HU-1, HU-4)
- **CA-7.1.** El sistema deberá mostrar el mapa entre el formulario de nueva sesión y la lista
  de sesiones, para no alejar el formulario de la parte superior en el móvil.
- **CA-7.2.** El sistema deberá mostrar sobre el mapa el título «Últimas 13 semanas», con el
  mismo estilo que los títulos de las demás secciones.
- **CA-7.3.** El sistema deberá mostrar encima de las columnas el nombre abreviado del mes
  («oct», «nov»…) en la columna donde empieza cada mes.
- **CA-7.4.** El sistema deberá mostrar a la izquierda de las filas las iniciales «L», «X» y
  «V» (lunes, miércoles y viernes).

### RF-8. Actualización (HU-1)
- **CA-8.1.** Cuando el usuario guarde una sesión, el sistema deberá actualizar el mapa, el
  resumen y, si hay un día consultado, su texto, al instante y sin recargar la página.
- **CA-8.2.** Cuando se abra la página, el sistema deberá mostrar el mapa con las sesiones ya
  guardadas.
- **CA-8.3.** Cuando llegue la fecha de una sesión registrada con fecha futura, el sistema
  deberá reflejarla en el mapa la próxima vez que se abra la página o se guarde una sesión.

### RF-9. Sesiones que no se reflejan en el mapa
- **CA-9.1.** Si una sesión tiene fecha posterior a hoy, entonces el sistema no deberá
  reflejarla en el mapa.
- **CA-9.2.** Si una sesión es anterior al primer día del mapa, entonces el sistema no deberá
  reflejarla en el mapa.
- **CA-9.3.** Si una sesión no es válida, entonces el sistema deberá ignorarla en el mapa sin
  borrarla ni modificarla, y deberá seguir mostrándola en la lista de sesiones como hasta ahora.

### RF-10. Sin sesiones
- **CA-10.1.** Mientras no haya ninguna sesión válida en el período, el sistema deberá mostrar
  el mapa completo en nivel 0, la leyenda y, en la línea de información, «Todavía no hay
  sesiones en las últimas 13 semanas».
- **CA-10.2.** Si las sesiones guardadas no se pueden leer, entonces el mapa deberá mostrarse
  como en CA-10.1.

## 5. Requisitos no funcionales

- **RNF-1. Móvil primero.** A 375 px de ancho, el mapa completo deberá verse sin desplazamiento
  horizontal de la página, y la distancia entre los centros de dos casillas vecinas deberá ser
  de al menos 24 px (WCAG 2.5.8).
- **RNF-2. Zoom.** Con el navegador al 200 % o con texto grande, la página no deberá tener
  desplazamiento horizontal. Solo el mapa podrá desplazarse en horizontal dentro de su propia
  zona (excepción de WCAG 1.4.10 para contenido que necesita dos dimensiones).
- **RNF-3. No solo color.** Toda la información del mapa deberá estar disponible como texto
  (RF-5 y RF-6). El borde de las casillas de nivel 0 y el relleno del nivel 4 deberán tener un
  contraste de al menos 3:1 con el fondo (WCAG 1.4.11).
- **RNF-4. Sin animaciones.** El mapa no tendrá animaciones en esta versión.
- **RNF-5. Datos intactos.** La funcionalidad no deberá cambiar el formato ni la clave de los
  datos guardados, ni borrar o modificar ninguna sesión: el mapa se calcula y no se guarda.
- **RNF-6. Privacidad.** Ningún dato deberá salir del navegador.
- **RNF-7. Idioma.** Todos los textos (título, meses, días, leyenda, línea de información)
  deberán estar en español.
- **RNF-8. Jerarquía visual.** El mapa deberá usar solo tonos de verde y textos más pequeños
  que el número de la racha, para no competir con ella.
- **RNF-9. Rendimiento.** Con 5 000 sesiones guardadas, el mapa deberá mostrarse y
  actualizarse sin retraso apreciable (menos de 100 ms en un móvil de gama media).

## 6. Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Sin ninguna sesión | Mapa completo en nivel 0, leyenda y texto de CA-10.1. |
| Varias sesiones el mismo día | Se suman sus minutos: 20 + 15 = 35 → nivel 2. |
| Exactamente 29, 30, 59, 60, 119 y 120 minutos | Niveles 1, 2, 2, 3, 3 y 4. |
| Varias sesiones que suman más de 1440 minutos en un día | Nivel 4; no altera el resto de días. |
| Sesión con 0 minutos, decimales (29,5), texto («30»), negativos o más de 1440 | No válida: se ignora en el mapa y sigue en la lista (CA-9.3). |
| Fecha inexistente (2026-02-30) o con otro formato | No válida: se ignora en el mapa y sigue en la lista. |
| Hoy es lunes | La última columna tiene un solo día. |
| Hoy es domingo | La última columna está completa. |
| Llega un lunes | Aparece una columna nueva y desaparece la más antigua (CA-1.4). |
| Hoy sin sesiones | Nivel 0 con la marca de hoy (CA-4.1). |
| Sesión con fecha futura | No colorea ningún día; aparece cuando llega su fecha (CA-8.3). |
| Sesión de hace más de 13 semanas | No aparece en el mapa; sigue contando en la mejor racha. |
| El período cruza un cambio de mes o de año, o un 29 de febrero | Días consecutivos, sin huecos ni repetidos. |
| El período incluye un cambio de hora (último domingo de marzo u octubre) | Ningún día se pierde ni se duplica. |
| Registrar una sesión de un día pasado dentro del período | Ese día cambia de nivel al instante (CA-8.1). |
| Guardar una sesión mientras se consulta un día | El texto del día consultado se actualiza con los datos nuevos (CA-8.1). |
| Consultar un día de la primera o la última columna en el móvil | El texto aparece en la línea de información fija, sin salirse de la pantalla. |
| Las sesiones guardadas no se pueden leer | El mapa se muestra como sin sesiones (CA-10.2). |
| El dispositivo tiene la fecha o la zona horaria mal puestas, o el usuario viaja | El mapa usa la fecha del dispositivo; las sesiones conservan el día elegido (CA-2.3). |

## 7. Fuera de alcance (esta versión)

- Filtrar la lista de sesiones al tocar un día.
- Navegar a semanas anteriores o cambiar el número de semanas.
- Tramos de minutos configurables por el usuario.
- Colorear por número de sesiones o por tema.
- Crear, editar o borrar sesiones desde el mapa.
- Totales por semana o por mes dentro del mapa.
- Exportar o compartir el mapa.
- Animaciones del mapa.
- **Actualizar «hoy» si la página sigue abierta al pasar la medianoche.** Afecta a toda la
  página (también a la racha), así que irá en una spec aparte.
- **Tratar las sesiones no válidas de forma coherente en toda la página.** Hoy la racha, «días
  este mes» y la mejor racha cuentan los días de las sesiones no válidas, y el mapa no. Esta
  diferencia se acepta en esta versión; unificarla irá en una spec aparte.
- **Que la página entera funcione con datos guardados ilegibles.** Esta spec solo fija el
  comportamiento del mapa (CA-10.2); el resto de la página irá en una spec aparte.
- Corregir la fecha del dispositivo si es incorrecta.

## 8. Criterios de finalización

- [x] El requisito previo (lógica separada y pruebas automáticas) está terminado.
- [x] Se cumplen todos los criterios de aceptación de RF-1 a RF-10. *(CA-10.2 corregido para JSON que no
      es una lista; RF-5 corregido para que un ratón quieto o el Enter del formulario no cambien el día
      consultado. Ver `plan.md` §9 y `tasks.md` T29–T31.)*
- [x] La lógica del mapa (período, validez de sesiones, suma de minutos, niveles, resumen)
      tiene pruebas automáticas que pasan, incluidos todos los casos límite de la sección 6.
- [x] Verificado en un navegador real: funcionalidad, consola sin errores, vista móvil a
      375 px (RNF-1) y zoom al 200 % (RNF-2).
- [ ] Verificado solo con teclado (CA-5.7) y con un lector de pantalla (CA-5.8 y CA-6.2). *(Teclado
      verificado; lector de pantalla verificado con el árbol de accesibilidad de Chrome. **Pendiente: probarlo
      con NVDA**, no se puede automatizar.)*
- [x] Contrastes medidos: CA-3.2 y RNF-3.
- [x] Las sesiones guardadas antes de la funcionalidad se siguen leyendo y mostrando igual.
- [x] Cumple la constitución y las reglas de fechas de `CLAUDE.md`.
- [x] `MEMORY.md` y, si aplica, `CLAUDE.md` actualizados.

## 9. Dudas abiertas

Ninguna. Decisiones tomadas en la revisión de QA:

| Tema | Decisión | Por qué |
|---|---|---|
| Período | 13 semanas (antes 16) | Con 16, las casillas miden ~20 px a 375 px y no llegan al mínimo táctil de 24 px; con 13 miden ~25 px. |
| Ubicación | Entre el formulario y la lista | Encima del formulario lo alejaría de la parte superior en el móvil. |
| Color | Tonos de verde | No se confunde con el rojo ni con los colores de nivel de la racha, ni con el azul de los botones. |
| Etiquetas | Meses abreviados arriba; «L», «X», «V» a la izquierda | Orientan sin saturar el ancho del móvil. |
| Título | «Últimas 13 semanas» | Dice exactamente qué se ve. |
| Consulta de un día | Línea de información fija bajo el mapa | Evita textos flotantes que se salen de la pantalla y da un sitio para el resumen. |
| Teclado | Una parada de Tab y flechas dentro del mapa | Evita 91 paradas de Tab antes de llegar a la lista. |
| Sin sesiones | Se muestra el mapa vacío | Es un calendario: vacío invita a rellenarlo. La mejor racha se oculta porque es solo un número. |
| Sesión válida | Minutos enteros de 1 a 1440 y fecha real | Es lo que el formulario permite guardar; lo demás son datos dañados. |
| Medianoche y datos no válidos en toda la página | Specs aparte | Afectan a más que al mapa. |
