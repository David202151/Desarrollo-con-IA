// Lógica del Diario de Estudio: solo cálculos, sin tocar la página ni localStorage.
// Las funciones reciben todo lo que necesitan (las sesiones y "hoy" como "AAAA-MM-DD"),
// así se pueden probar con node --test. Ver docs/constitution.md (principios 3 y 4).

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

// Devuelve el día anterior a una fecha en texto
function diaAnterior(texto) {
  const fecha = textoAFecha(texto);
  fecha.setDate(fecha.getDate() - 1);
  return fechaATexto(fecha);
}

// Devuelve el día 1 del mes de "hoy" como "AAAA-MM-DD"
function inicioDeMes(hoy) {
  return hoy.slice(0, 8) + "01";
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

// ---------- Datos guardados ----------

// Convierte el texto guardado en localStorage en la lista de sesiones.
// Si no hay nada, el JSON está roto o no es una lista, devuelve una lista vacía
// para que la página siga funcionando (specs/001-mapa-de-calor, CA-10.2).
function sesionesDesdeTexto(texto) {
  if (!texto) {
    return [];
  }
  try {
    const datos = JSON.parse(texto);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

// ---------- Racha ----------

function calcularRacha(sesiones, hoy) {
  // Guardamos los días que tienen al menos una sesión
  const diasConSesion = new Set();
  sesiones.forEach(function (sesion) {
    diasConSesion.add(sesion.fecha);
  });

  // Empezamos a contar desde hoy.
  // Si hoy aún no hay sesión, empezamos desde ayer (la racha sigue viva hasta que acaba el día).
  let dia = hoy;
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

// Nivel de la racha: decide el color del número y de la llama (ver styles.css)
function nivelDeRacha(racha) {
  if (racha === 0) {
    return "apagada"; // gris
  }
  if (racha < 100) {
    return "roja";
  }
  if (racha < 300) {
    return "azul";
  }
  if (racha < 500) {
    return "morada";
  }
  return "dorada";
}

// ---------- Mejor racha ----------

// La serie más larga de días seguidos con sesión en todo el historial
function calcularMejorRacha(sesiones, hoy) {
  // Días distintos con sesión, sin fechas futuras
  const diasConSesion = new Set();
  sesiones.forEach(function (sesion) {
    if (sesion.fecha <= hoy) {
      diasConSesion.add(sesion.fecha);
    }
  });

  // Las fechas "AAAA-MM-DD" ordenadas como texto quedan de la más antigua a la más reciente
  const dias = Array.from(diasConSesion).sort();

  let mejor = 0;
  let actual = 0;
  dias.forEach(function (dia) {
    // Si el día anterior también tiene sesión, la serie continúa; si no, empieza otra
    if (diasConSesion.has(diaAnterior(dia))) {
      actual = actual + 1;
    } else {
      actual = 1;
    }
    if (actual > mejor) {
      mejor = actual;
    }
  });
  return mejor;
}

// ---------- Días estudiados este mes ----------

function diasEstudiadosEsteMes(sesiones, hoy) {
  const inicio = inicioDeMes(hoy);

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

// ---------- Mapa de calor (specs/001-mapa-de-calor) ----------

// Semanas que muestra el mapa: la actual y las 12 anteriores
const SEMANAS_DEL_MAPA = 13;

// Devuelve la fecha desplazada n días (n puede ser negativo).
// Usa setDate, nunca milisegundos: así los cambios de hora no pierden ni repiten días.
function sumarDias(texto, n) {
  const fecha = textoAFecha(texto);
  fecha.setDate(fecha.getDate() + n);
  return fechaATexto(fecha);
}

// ¿Es un texto "AAAA-MM-DD" de un día que existe? ("2026-02-30" no existe)
function esFechaReal(texto) {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return false;
  }
  // Si el día no existe, Date lo pasa al mes siguiente y el texto ya no coincide
  return fechaATexto(textoAFecha(texto)) === texto;
}

// Sesión válida para el mapa: fecha real y minutos enteros entre 1 y 1440
function esSesionValida(sesion) {
  if (sesion === null || typeof sesion !== "object") {
    return false;
  }
  return (
    esFechaReal(sesion.fecha) &&
    typeof sesion.minutos === "number" &&
    Number.isInteger(sesion.minutos) &&
    sesion.minutos >= 1 &&
    sesion.minutos <= 1440
  );
}

// Devuelve el lunes de la semana de una fecha
function inicioDeSemana(texto) {
  const diaDeLaSemana = textoAFecha(texto).getDay(); // 0 = domingo, 1 = lunes...
  const diasDesdeElLunes = diaDeLaSemana === 0 ? 6 : diaDeLaSemana - 1;
  return sumarDias(texto, -diasDesdeElLunes);
}

// Intensidad del color de un día según sus minutos (0 = vacío, 4 = máximo)
function nivelDeMinutos(minutos) {
  if (minutos === 0) {
    return 0;
  }
  if (minutos < 30) {
    return 1;
  }
  if (minutos < 60) {
    return 2;
  }
  if (minutos < 120) {
    return 3;
  }
  return 4;
}

// Suma los minutos de las sesiones válidas de cada día entre "desde" y "hoy" (incluidos).
// Devuelve un objeto como { "2026-10-03": 35, "2026-10-04": 20 }.
function minutosPorDia(sesiones, desde, hoy) {
  const total = {};
  sesiones.forEach(function (sesion) {
    if (!esSesionValida(sesion)) {
      return; // se ignora en el mapa, pero no se borra
    }
    if (sesion.fecha < desde || sesion.fecha > hoy) {
      return;
    }
    total[sesion.fecha] = (total[sesion.fecha] || 0) + sesion.minutos;
  });
  return total;
}

// Construye el mapa: 13 semanas (columnas) de lunes a domingo.
// Cada día es { fecha, minutos, nivel, esHoy }; los días posteriores a hoy son null.
function construirMapa(sesiones, hoy) {
  // Si los datos guardados no son una lista, el mapa se muestra vacío
  if (!Array.isArray(sesiones)) {
    sesiones = [];
  }

  const primerDia = sumarDias(inicioDeSemana(hoy), -(SEMANAS_DEL_MAPA - 1) * 7);
  const minutos = minutosPorDia(sesiones, primerDia, hoy);

  const semanas = [];
  let diasConEstudio = 0;
  for (let s = 0; s < SEMANAS_DEL_MAPA; s++) {
    const semana = [];
    for (let d = 0; d < 7; d++) {
      // Siempre desde el primer día: así no se acumulan errores
      const fecha = sumarDias(primerDia, s * 7 + d);
      if (fecha > hoy) {
        semana.push(null); // todavía no ha llegado: no se muestra
      } else {
        const minutosDelDia = minutos[fecha] || 0;
        if (minutosDelDia > 0) {
          diasConEstudio = diasConEstudio + 1;
        }
        semana.push({
          fecha: fecha,
          minutos: minutosDelDia,
          nivel: nivelDeMinutos(minutosDelDia),
          esHoy: fecha === hoy,
        });
      }
    }
    semanas.push(semana);
  }
  return { semanas: semanas, diasConEstudio: diasConEstudio };
}

// Nombre corto del mes de una fecha: "oct", "sept"...
function mesAbreviado(texto) {
  return textoAFecha(texto).toLocaleDateString("es-ES", { month: "short" });
}

// Etiqueta de mes para cada columna: el mes en la columna que contiene su día 1, "" en el resto.
// La primera columna también lleva su mes si la siguiente etiqueta está a 3 columnas o más
// (así no se juntan dos etiquetas).
function etiquetasDeMes(semanas) {
  const etiquetas = semanas.map(function (semana) {
    const diaUno = semana.find(function (dia) {
      return dia !== null && dia.fecha.slice(8) === "01";
    });
    return diaUno ? mesAbreviado(diaUno.fecha) : "";
  });

  if (etiquetas[0] === "") {
    let siguiente = etiquetas.findIndex(function (etiqueta) {
      return etiqueta !== "";
    });
    if (siguiente === -1) {
      siguiente = etiquetas.length;
    }
    if (siguiente >= 3) {
      etiquetas[0] = mesAbreviado(semanas[0][0].fecha);
    }
  }
  return etiquetas;
}

// Texto de un día del mapa: "sábado, 3 de octubre de 2026: 45 min"
function textoDeDia(dia) {
  const minutos = dia.minutos === 0 ? "sin estudio" : dia.minutos + " min";
  return fechaBonita(dia.fecha) + ": " + minutos;
}

// Resumen del mapa: "23 días con estudio en las últimas 13 semanas"
function textoResumen(diasConEstudio) {
  const periodo = " en las últimas " + SEMANAS_DEL_MAPA + " semanas";
  if (diasConEstudio === 0) {
    return "Todavía no hay sesiones" + periodo;
  }
  const dias = diasConEstudio === 1 ? " día con estudio" : " días con estudio";
  return diasConEstudio + dias + periodo;
}

// ---------- Exportar para los tests ----------

// En el navegador "module" no existe y estas funciones quedan disponibles para app.js.
// En Node (node --test) se exportan para poder usarlas con require.
if (typeof module !== "undefined") {
  module.exports = {
    fechaATexto,
    textoAFecha,
    diaAnterior,
    inicioDeMes,
    fechaBonita,
    sesionesDesdeTexto,
    calcularRacha,
    nivelDeRacha,
    calcularMejorRacha,
    diasEstudiadosEsteMes,
    sumarDias,
    esFechaReal,
    esSesionValida,
    inicioDeSemana,
    nivelDeMinutos,
    minutosPorDia,
    construirMapa,
    mesAbreviado,
    etiquetasDeMes,
    textoDeDia,
    textoResumen,
  };
}
