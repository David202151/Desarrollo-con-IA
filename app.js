// Nombre con el que guardamos las sesiones en localStorage
const CLAVE_GUARDADO = "diario-de-estudio-sesiones";

// Elementos de la página que vamos a usar
const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const textoError = document.getElementById("error");
const lista = document.getElementById("lista");
const seccionRacha = document.getElementById("racha");
const textoVacio = document.getElementById("vacio");
const rachaNumero = document.getElementById("racha-numero");
const rachaTexto = document.getElementById("racha-texto");
const diasMes = document.getElementById("dias-mes");
const diasMesTexto = document.getElementById("dias-mes-texto");
const mejorRachaLinea = document.getElementById("mejor-racha-linea");
const mejorRachaNumero = document.getElementById("mejor-racha");
const mejorRachaTexto = document.getElementById("mejor-racha-texto");
const mapaRejilla = document.getElementById("mapa");
const mapaInfo = document.getElementById("mapa-info");

// Iniciales de los días en el mapa: solo lunes, miércoles y viernes, para no saturar
const INICIALES_DEL_MAPA = ["L", "", "X", "", "V", "", ""];

// Lista de sesiones. Cada sesión es: { id, fecha: "AAAA-MM-DD", tema, minutos }
let sesiones = cargarSesiones();

// Mapa de calor: el último mapa pintado y el día que se está consultando (o null)
let mapaActual = null;
let fechaConsultada = null;

// ---------- Fechas ----------
// Las funciones de fechas y los cálculos están en logica.js (se carga antes que este archivo).

// Devuelve la fecha de hoy como "AAAA-MM-DD". Es lo único que lee el reloj.
function hoyEnTexto() {
  return fechaATexto(new Date());
}

// ---------- Guardar y cargar ----------

function cargarSesiones() {
  // Si lo guardado no se puede usar, empezamos con una lista vacía (ver logica.js)
  return sesionesDesdeTexto(localStorage.getItem(CLAVE_GUARDADO));
}

function guardarSesiones() {
  localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(sesiones));
}

// ---------- Mostrar en pantalla ----------

function mostrarRacha() {
  const racha = calcularRacha(sesiones, hoyEnTexto());
  rachaNumero.textContent = racha;
  rachaTexto.textContent = racha === 1 ? "día seguido" : "días seguidos";
  // Sustituimos todas las clases: así también se quita el pulso de la vez anterior
  seccionRacha.className = "racha racha-" + nivelDeRacha(racha);
}

// idNueva (opcional): id de la sesión recién guardada, para resaltarla
function mostrarLista(idNueva) {
  // Ordenamos de la más reciente a la más antigua.
  // Si dos sesiones son del mismo día, primero la que se guardó más tarde.
  const ordenadas = sesiones.slice().sort(function (a, b) {
    if (a.fecha !== b.fecha) {
      return a.fecha < b.fecha ? 1 : -1;
    }
    return b.id - a.id;
  });

  lista.innerHTML = "";
  textoVacio.hidden = ordenadas.length > 0;

  ordenadas.forEach(function (sesion) {
    const elemento = document.createElement("li");
    elemento.className = "sesion";
    if (sesion.id === idNueva) {
      elemento.classList.add("sesion-nueva");
    }

    const info = document.createElement("div");

    const tema = document.createElement("p");
    tema.className = "sesion-tema";
    tema.textContent = sesion.tema;

    const fecha = document.createElement("p");
    fecha.className = "sesion-fecha";
    fecha.textContent = fechaBonita(sesion.fecha);

    const minutos = document.createElement("span");
    minutos.className = "sesion-minutos";
    minutos.textContent = sesion.minutos + " min";

    info.appendChild(tema);
    info.appendChild(fecha);
    elemento.appendChild(info);
    elemento.appendChild(minutos);
    lista.appendChild(elemento);
  });
}

function mostrarDiasMes() {
  const dias = diasEstudiadosEsteMes(sesiones, hoyEnTexto());
  diasMes.textContent = dias;
  diasMesTexto.textContent = dias === 1 ? "día" : "días";
}

function mostrarMejorRacha() {
  const mejor = calcularMejorRacha(sesiones, hoyEnTexto());
  // Sin sesiones no mostramos la línea: sería otro 0 más en pantalla
  mejorRachaLinea.hidden = mejor === 0;
  mejorRachaNumero.textContent = mejor;
  mejorRachaTexto.textContent = mejor === 1 ? "día" : "días";
}

// ---------- Mapa de calor (specs/001-mapa-de-calor) ----------

// Busca un día del mapa pintado por su fecha (null si no está)
function buscarDiaDelMapa(fecha) {
  for (const semana of mapaActual.semanas) {
    for (const dia of semana) {
      if (dia !== null && dia.fecha === fecha) {
        return dia;
      }
    }
  }
  return null;
}

// Línea bajo el mapa: el día consultado o, si no hay ninguno, el resumen
function mostrarInfoDelMapa() {
  if (fechaConsultada === null) {
    mapaInfo.textContent = textoResumen(mapaActual.diasConEstudio);
  } else {
    mapaInfo.textContent = textoDeDia(buscarDiaDelMapa(fechaConsultada));
  }
}

// Solo un día recibe el Tab (tabindex 0); al resto se llega con las flechas
function hacerEnfocable(fecha) {
  mapaRejilla.querySelectorAll(".mapa-dia").forEach(function (celda) {
    celda.tabIndex = celda.dataset.fecha === fecha ? 0 : -1;
  });
}

function mostrarMapa() {
  const hoy = hoyEnTexto();
  mapaActual = construirMapa(sesiones, hoy);
  const etiquetas = etiquetasDeMes(mapaActual.semanas);

  mapaRejilla.innerHTML = "";
  // Lo primero que oye un lector de pantalla al entrar en el mapa
  mapaRejilla.setAttribute("aria-label", "Mapa de estudio. " + textoResumen(mapaActual.diasConEstudio));

  // Fila de meses: solo visual (cada día ya lleva su fecha completa)
  const filaMeses = document.createElement("div");
  filaMeses.className = "mapa-fila";
  filaMeses.setAttribute("aria-hidden", "true");
  filaMeses.appendChild(document.createElement("span")); // hueco sobre las iniciales
  etiquetas.forEach(function (etiqueta) {
    const mes = document.createElement("span");
    mes.className = "mapa-mes";
    mes.textContent = etiqueta;
    filaMeses.appendChild(mes);
  });
  mapaRejilla.appendChild(filaMeses);

  // Una fila por día de la semana (lunes arriba) con una celda por semana
  for (let d = 0; d < 7; d++) {
    const fila = document.createElement("div");
    fila.className = "mapa-fila";
    fila.setAttribute("role", "row");

    const inicial = document.createElement("span");
    inicial.className = "mapa-inicial";
    inicial.setAttribute("aria-hidden", "true");
    inicial.textContent = INICIALES_DEL_MAPA[d];
    fila.appendChild(inicial);

    mapaActual.semanas.forEach(function (semana, s) {
      const dia = semana[d];
      const celda = document.createElement("span");
      if (dia === null) {
        // Día que aún no ha llegado: hueco que ni se ve ni se anuncia
        celda.className = "mapa-hueco";
        celda.setAttribute("aria-hidden", "true");
      } else {
        celda.className = "mapa-dia nivel-" + dia.nivel + (dia.esHoy ? " hoy" : "");
        celda.setAttribute("role", "gridcell");
        celda.setAttribute("aria-label", textoDeDia(dia));
        celda.dataset.fecha = dia.fecha;
        celda.dataset.fila = d;
        celda.dataset.columna = s;
      }
      fila.appendChild(celda);
    });
    mapaRejilla.appendChild(fila);
  }

  // Si el día consultado ya no está en el mapa (cambió la semana), se olvida
  if (fechaConsultada !== null && buscarDiaDelMapa(fechaConsultada) === null) {
    fechaConsultada = null;
  }
  hacerEnfocable(fechaConsultada === null ? hoy : fechaConsultada);
  mostrarInfoDelMapa();
}

// Consultar un día: vale siempre la última interacción (ratón, toque o teclado)
function consultarDia(celda) {
  fechaConsultada = celda.dataset.fecha;
  hacerEnfocable(fechaConsultada);
  mostrarInfoDelMapa();
}

function volverAlResumen() {
  if (fechaConsultada !== null) {
    fechaConsultada = null;
    // El próximo Tab vuelve a entrar por hoy
    hacerEnfocable(hoyEnTexto());
    mostrarInfoDelMapa();
  }
}

// Los eventos se escuchan en la rejilla entera y se mira qué día los recibió
function celdaDelEvento(evento) {
  return evento.target.closest(".mapa-dia");
}

// Ratón: solo cuenta si el puntero se ha movido de verdad. Al desplazar la página
// (por ejemplo, al entrar con Tab) el mapa puede pasar por debajo de un ratón quieto, y
// eso no debe cambiar el día que se está consultando con el teclado.
let ultimaPosicionDelRaton = "";

mapaRejilla.addEventListener("mousemove", function (evento) {
  // Misma posición que el último movimiento: el ratón no se ha movido, ha sido el desplazamiento
  if (evento.clientX + "," + evento.clientY === ultimaPosicionDelRaton) {
    return;
  }
  const celda = celdaDelEvento(evento);
  if (celda && celda.dataset.fecha !== fechaConsultada) {
    consultarDia(celda);
  }
});

// Se guarda la posición del ratón en toda la página (este escuchador va después del del mapa)
document.addEventListener("mousemove", function (evento) {
  ultimaPosicionDelRaton = evento.clientX + "," + evento.clientY;
});

mapaRejilla.addEventListener("focusin", function (evento) {
  const celda = celdaDelEvento(evento);
  if (celda) {
    consultarDia(celda);
  }
});

mapaRejilla.addEventListener("click", function (evento) {
  const celda = celdaDelEvento(evento);
  if (celda) {
    consultarDia(celda);
  }
});

mapaRejilla.addEventListener("mouseleave", volverAlResumen);

mapaRejilla.addEventListener("focusout", function (evento) {
  // Solo si el foco se va fuera del mapa (no al pasar de un día a otro)
  if (!mapaRejilla.contains(evento.relatedTarget)) {
    volverAlResumen();
  }
});

// Un toque o clic fuera del mapa vuelve al resumen.
// Solo los de verdad: al pulsar Enter en el formulario el navegador simula un clic en
// "Guardar sesión" (con detail = 0), y eso no debe olvidar el día consultado (CA-8.1).
document.addEventListener("click", function (evento) {
  if (evento.detail === 0) {
    return;
  }
  if (!mapaRejilla.contains(evento.target)) {
    volverAlResumen();
  }
});

// Flechas: moverse entre los días que se ven. En los bordes y huecos no se mueve.
const MOVIMIENTOS = {
  ArrowRight: [0, 1],
  ArrowLeft: [0, -1],
  ArrowDown: [1, 0],
  ArrowUp: [-1, 0],
};

mapaRejilla.addEventListener("keydown", function (evento) {
  const movimiento = MOVIMIENTOS[evento.key];
  const celda = celdaDelEvento(evento);
  if (!movimiento || !celda) {
    return;
  }
  evento.preventDefault(); // que las flechas no desplacen la página
  const fila = Number(celda.dataset.fila) + movimiento[0];
  const columna = Number(celda.dataset.columna) + movimiento[1];
  const destino = mapaRejilla.querySelector(
    '.mapa-dia[data-fila="' + fila + '"][data-columna="' + columna + '"]'
  );
  if (destino) {
    destino.tabIndex = 0;
    destino.focus(); // dispara focusin, que lo consulta
  }
});

function mostrarTodo(idNueva) {
  mostrarRacha();
  mostrarDiasMes();
  mostrarMejorRacha();
  mostrarMapa();
  mostrarLista(idNueva);
}

// ---------- Formulario ----------

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  // Comprobamos los datos
  if (!fecha) {
    textoError.textContent = "Elige una fecha.";
    return;
  }
  if (tema === "") {
    textoError.textContent = "Escribe el tema que has estudiado.";
    return;
  }
  // Un día tiene 1440 minutos: es el máximo de una sesión (ver specs/001-mapa-de-calor)
  if (!Number.isInteger(minutos) || minutos < 1 || minutos > 1440) {
    textoError.textContent = "Los minutos deben ser un número entero entre 1 y 1440.";
    return;
  }
  textoError.textContent = "";

  // Añadimos la sesión, guardamos y actualizamos la pantalla
  const rachaAntes = calcularRacha(sesiones, hoyEnTexto());
  const idNueva = Date.now();
  sesiones.push({
    id: idNueva,
    fecha: fecha,
    tema: tema,
    minutos: minutos,
  });
  guardarSesiones();
  mostrarTodo(idNueva);

  // Si la racha ha subido, el número y la llama dan un pulso
  if (calcularRacha(sesiones, hoyEnTexto()) > rachaAntes) {
    // Leer offsetWidth obliga al navegador a aplicar el cambio de clases anterior;
    // sin esto, dos pulsos seguidos no reiniciarían la animación.
    void seccionRacha.offsetWidth;
    seccionRacha.classList.add("racha-pulso");
  }

  // Limpiamos el tema y los minutos, y volvemos a poner la fecha de hoy
  campoTema.value = "";
  campoMinutos.value = "";
  campoFecha.value = hoyEnTexto();
});

// ---------- Inicio ----------

campoFecha.value = hoyEnTexto();
mostrarTodo();
