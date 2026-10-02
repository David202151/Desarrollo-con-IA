// Nombre con el que guardamos las sesiones en localStorage
const CLAVE_GUARDADO = "diario-de-estudio-sesiones";

// Elementos de la página que vamos a usar
const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const textoError = document.getElementById("error");
const lista = document.getElementById("lista");
const textoVacio = document.getElementById("vacio");
const rachaNumero = document.getElementById("racha-numero");
const rachaTexto = document.getElementById("racha-texto");
const diasMes = document.getElementById("dias-mes");
const diasMesTexto = document.getElementById("dias-mes-texto");

// Lista de sesiones. Cada sesión es: { id, fecha: "AAAA-MM-DD", tema, minutos }
let sesiones = cargarSesiones();

// ---------- Fechas (siempre en hora local, nunca UTC) ----------

// Convierte un objeto Date en texto "AAAA-MM-DD" usando la fecha local
function fechaATexto(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// Convierte un texto "AAAA-MM-DD" en un objeto Date local
function textoAFecha(texto) {
  const partes = texto.split("-");
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

// Devuelve la fecha de hoy como "AAAA-MM-DD"
function hoyEnTexto() {
  return fechaATexto(new Date());
}

// Devuelve el día anterior a una fecha en texto
function diaAnterior(texto) {
  const fecha = textoAFecha(texto);
  fecha.setDate(fecha.getDate() - 1);
  return fechaATexto(fecha);
}

// Devuelve el día 1 del mes actual como "AAAA-MM-DD"
function inicioDeMes() {
  const hoy = new Date();
  return fechaATexto(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

// Muestra la fecha de forma bonita, por ejemplo: "jueves, 2 de octubre de 2026"
function fechaBonita(texto) {
  return textoAFecha(texto).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------- Guardar y cargar ----------

function cargarSesiones() {
  const guardado = localStorage.getItem(CLAVE_GUARDADO);
  if (!guardado) {
    return [];
  }
  try {
    return JSON.parse(guardado);
  } catch (error) {
    return [];
  }
}

function guardarSesiones() {
  localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(sesiones));
}

// ---------- Racha ----------

function calcularRacha() {
  // Guardamos los días que tienen al menos una sesión
  const diasConSesion = new Set();
  sesiones.forEach(function (sesion) {
    diasConSesion.add(sesion.fecha);
  });

  // Empezamos a contar desde hoy.
  // Si hoy aún no hay sesión, empezamos desde ayer (la racha sigue viva hasta que acaba el día).
  let dia = hoyEnTexto();
  if (!diasConSesion.has(dia)) {
    dia = diaAnterior(dia);
  }

  // Contamos hacia atrás mientras haya sesión ese día
  let racha = 0;
  while (diasConSesion.has(dia)) {
    racha = racha + 1;
    dia = diaAnterior(dia);
  }
  return racha;
}

// ---------- Días estudiados este mes ----------

function diasEstudiadosEsteMes() {
  const inicio = inicioDeMes();
  const hoy = hoyEnTexto();

  // Un Set guarda cada fecha una sola vez:
  // varias sesiones el mismo día cuentan como un solo día.
  const dias = new Set();
  sesiones.forEach(function (sesion) {
    // Las fechas "AAAA-MM-DD" se pueden comparar como texto.
    // Solo cuentan los días entre el 1 del mes y hoy (las fechas futuras no suman).
    if (sesion.fecha >= inicio && sesion.fecha <= hoy) {
      dias.add(sesion.fecha);
    }
  });
  return dias.size;
}

// ---------- Mostrar en pantalla ----------

function mostrarRacha() {
  const racha = calcularRacha();
  rachaNumero.textContent = racha;
  rachaTexto.textContent = racha === 1 ? "día seguido" : "días seguidos";
}

function mostrarLista() {
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
  const dias = diasEstudiadosEsteMes();
  diasMes.textContent = dias;
  diasMesTexto.textContent = dias === 1 ? "día" : "días";
}

function mostrarTodo() {
  mostrarRacha();
  mostrarDiasMes();
  mostrarLista();
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
  if (!Number.isInteger(minutos) || minutos <= 0) {
    textoError.textContent = "Los minutos deben ser un número entero mayor que 0.";
    return;
  }
  textoError.textContent = "";

  // Añadimos la sesión, guardamos y actualizamos la pantalla
  sesiones.push({
    id: Date.now(),
    fecha: fecha,
    tema: tema,
    minutos: minutos,
  });
  guardarSesiones();
  mostrarTodo();

  // Limpiamos el tema y los minutos, y volvemos a poner la fecha de hoy
  campoTema.value = "";
  campoMinutos.value = "";
  campoFecha.value = hoyEnTexto();
});

// ---------- Inicio ----------

campoFecha.value = hoyEnTexto();
mostrarTodo();
