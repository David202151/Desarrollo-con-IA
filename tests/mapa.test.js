// Pruebas de la lógica del mapa de calor (specs/001-mapa-de-calor).
// Se ejecutan con: node --test

// Zona horaria con cambio de hora, fijada antes de crear ninguna fecha (T02)
process.env.TZ = "Europe/Madrid";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
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
  calcularMejorRacha,
} = require("../logica.js");

// Crea una sesión válida
function sesion(fecha, minutos) {
  return { id: 1, fecha: fecha, tema: "Tema", minutos: minutos };
}

// Días visibles del mapa (sin los huecos futuros), en orden
function diasVisibles(mapa) {
  const dias = [];
  mapa.semanas.forEach(function (semana) {
    semana.forEach(function (dia) {
      if (dia !== null) {
        dias.push(dia);
      }
    });
  });
  return dias;
}

// Busca un día del mapa por su fecha
function buscar(mapa, fecha) {
  return diasVisibles(mapa).find(function (dia) {
    return dia.fecha === fecha;
  });
}

// ---------- T02 ----------

test("T02: la zona horaria de las pruebas tiene cambio de hora", function () {
  assert.notEqual(
    new Date(2026, 9, 24).getTimezoneOffset(),
    new Date(2026, 9, 26).getTimezoneOffset()
  );
});

// ---------- T03 sumarDias ----------

test("T03: sumarDias suma y resta días", function () {
  assert.equal(sumarDias("2026-10-04", 1), "2026-10-05");
  assert.equal(sumarDias("2026-10-04", -1), "2026-10-03");
  assert.equal(sumarDias("2026-10-04", 0), "2026-10-04");
});

test("T03: sumarDias cruza meses, años y el 29 de febrero", function () {
  assert.equal(sumarDias("2026-01-31", 1), "2026-02-01");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(sumarDias("2027-01-01", -1), "2026-12-31");
  assert.equal(sumarDias("2028-02-28", 1), "2028-02-29");
  assert.equal(sumarDias("2028-02-29", 1), "2028-03-01");
  assert.equal(sumarDias("2026-02-28", 1), "2026-03-01");
});

test("T03: sumarDias no pierde ni repite días en los cambios de hora", function () {
  assert.equal(sumarDias("2026-10-24", 1), "2026-10-25");
  assert.equal(sumarDias("2026-10-25", 1), "2026-10-26");
  assert.equal(sumarDias("2027-03-27", 1), "2027-03-28");
  assert.equal(sumarDias("2027-03-28", 1), "2027-03-29");
  assert.equal(sumarDias("2026-10-20", 14), "2026-11-03");
});

// ---------- T04 esFechaReal ----------

test("T04: esFechaReal acepta solo días reales con formato AAAA-MM-DD", function () {
  assert.equal(esFechaReal("2026-10-04"), true);
  assert.equal(esFechaReal("2028-02-29"), true);
  assert.equal(esFechaReal("2026-02-29"), false);
  assert.equal(esFechaReal("2026-02-30"), false);
  assert.equal(esFechaReal("2026-13-01"), false);
  assert.equal(esFechaReal("2026-2-3"), false);
  assert.equal(esFechaReal(""), false);
  assert.equal(esFechaReal(null), false);
  assert.equal(esFechaReal(undefined), false);
  assert.equal(esFechaReal(20261004), false);
});

// ---------- T05 esSesionValida ----------

test("T05: esSesionValida acepta minutos enteros de 1 a 1440 y fecha real", function () {
  assert.equal(esSesionValida(sesion("2026-10-04", 1)), true);
  assert.equal(esSesionValida(sesion("2026-10-04", 1440)), true);
});

test("T05: esSesionValida rechaza datos dañados", function () {
  assert.equal(esSesionValida(sesion("2026-10-04", 0)), false);
  assert.equal(esSesionValida(sesion("2026-10-04", 29.5)), false);
  assert.equal(esSesionValida(sesion("2026-10-04", "30")), false);
  assert.equal(esSesionValida(sesion("2026-10-04", -5)), false);
  assert.equal(esSesionValida(sesion("2026-10-04", 1441)), false);
  assert.equal(esSesionValida(sesion("2026-02-30", 30)), false);
  assert.equal(esSesionValida({ id: 1, tema: "Sin fecha", minutos: 30 }), false);
  assert.equal(esSesionValida({ id: 1, fecha: "2026-10-04", tema: "Sin minutos" }), false);
  assert.equal(esSesionValida(null), false);
  assert.equal(esSesionValida("2026-10-04"), false);
});

// ---------- T06 inicioDeSemana ----------

test("T06: inicioDeSemana devuelve el lunes de la semana", function () {
  assert.equal(inicioDeSemana("2026-09-28"), "2026-09-28"); // lunes
  assert.equal(inicioDeSemana("2026-10-01"), "2026-09-28"); // jueves, cruza mes
  assert.equal(inicioDeSemana("2026-10-04"), "2026-09-28"); // domingo: 6 días antes
  assert.equal(inicioDeSemana("2027-01-02"), "2026-12-28"); // sábado, cruza año
  assert.equal(inicioDeSemana("2026-10-25"), "2026-10-19"); // domingo del cambio de hora
});

// ---------- T07 nivelDeMinutos ----------

test("T07: nivelDeMinutos respeta los tramos fijos", function () {
  const casos = [[0, 0], [1, 1], [29, 1], [30, 2], [59, 2], [60, 3], [119, 3], [120, 4], [900, 4]];
  casos.forEach(function (caso) {
    assert.equal(nivelDeMinutos(caso[0]), caso[1], caso[0] + " minutos");
  });
});

// ---------- T08 minutosPorDia ----------

test("T08: minutosPorDia suma las sesiones del mismo día", function () {
  const sesiones = [sesion("2026-10-03", 20), sesion("2026-10-03", 15), sesion("2026-10-02", 45)];
  assert.deepEqual(minutosPorDia(sesiones, "2026-09-01", "2026-10-04"), {
    "2026-10-03": 35,
    "2026-10-02": 45,
  });
});

test("T08: minutosPorDia permite más de 1440 minutos sumando sesiones", function () {
  const sesiones = [sesion("2026-10-03", 1000), sesion("2026-10-03", 1000)];
  assert.equal(minutosPorDia(sesiones, "2026-09-01", "2026-10-04")["2026-10-03"], 2000);
});

test("T08: minutosPorDia excluye fechas fuera del período y sesiones no válidas", function () {
  const sesiones = [
    sesion("2026-10-05", 30), // futura
    sesion("2026-08-31", 30), // anterior a "desde"
    sesion("2026-09-01", 30), // primer día: cuenta
    sesion("2026-10-04", 30), // hoy: cuenta
    sesion("2026-10-02", 0), // no válida
    sesion("2026-02-30", 30), // no válida
  ];
  assert.deepEqual(minutosPorDia(sesiones, "2026-09-01", "2026-10-04"), {
    "2026-09-01": 30,
    "2026-10-04": 30,
  });
});

// ---------- T09 construirMapa: forma, última columna y hoy ----------

test("T09: el mapa tiene 13 semanas de 7 días y empieza en lunes", function () {
  const mapa = construirMapa([], "2026-10-04");
  assert.equal(mapa.semanas.length, 13);
  mapa.semanas.forEach(function (semana) {
    assert.equal(semana.length, 7);
  });
  assert.equal(mapa.semanas[0][0].fecha, "2026-07-06");
  assert.equal(inicioDeSemana(mapa.semanas[0][0].fecha), mapa.semanas[0][0].fecha);
  const visibles = diasVisibles(mapa);
  assert.equal(visibles[visibles.length - 1].fecha, "2026-10-04");
});

test("T09: con hoy lunes la última columna tiene 1 día y 6 huecos", function () {
  const ultima = construirMapa([], "2026-10-05").semanas[12];
  assert.equal(ultima[0].fecha, "2026-10-05");
  assert.deepEqual(ultima.slice(1), [null, null, null, null, null, null]);
});

test("T09: con hoy domingo la última columna está completa", function () {
  const ultima = construirMapa([], "2026-10-04").semanas[12];
  assert.equal(ultima.filter(function (dia) { return dia !== null; }).length, 7);
});

test("T09: solo hoy está marcado y sin sesiones tiene nivel 0", function () {
  const mapa = construirMapa([], "2026-10-01");
  const marcados = diasVisibles(mapa).filter(function (dia) { return dia.esHoy; });
  assert.equal(marcados.length, 1);
  assert.equal(marcados[0].fecha, "2026-10-01");
  assert.equal(marcados[0].nivel, 0);
  assert.equal(marcados[0].minutos, 0);
});

test("T09: una sesión pasada cambia solo su día", function () {
  const sin = construirMapa([], "2026-10-04");
  const con = construirMapa([sesion("2026-09-15", 45)], "2026-10-04");
  const distintos = diasVisibles(con).filter(function (dia, i) {
    return dia.nivel !== diasVisibles(sin)[i].nivel;
  });
  assert.equal(distintos.length, 1);
  assert.equal(distintos[0].fecha, "2026-09-15");
  assert.equal(distintos[0].nivel, 2);
  assert.equal(con.diasConEstudio, 1);
});

// ---------- T10 construirMapa: continuidad, cambio de semana y futuras ----------

test("T10: los días visibles son consecutivos en cambios de hora, de año y 29 de febrero", function () {
  ["2026-11-01", "2027-04-04", "2027-01-10", "2028-03-05"].forEach(function (hoy) {
    const visibles = diasVisibles(construirMapa([], hoy));
    for (let i = 1; i < visibles.length; i++) {
      assert.equal(visibles[i].fecha, sumarDias(visibles[i - 1].fecha, 1), "hoy " + hoy);
    }
    assert.equal(visibles[visibles.length - 1].fecha, hoy);
  });
  const conBisiesto = diasVisibles(construirMapa([], "2028-03-05")).map(function (dia) {
    return dia.fecha;
  });
  assert.ok(conBisiesto.includes("2028-02-29"));
});

test("T10: al llegar el lunes la primera columna avanza una semana", function () {
  const domingo = construirMapa([], "2026-10-04");
  const lunes = construirMapa([], "2026-10-05");
  assert.equal(lunes.semanas[0][0].fecha, sumarDias(domingo.semanas[0][0].fecha, 7));
  assert.equal(lunes.semanas[11][0].fecha, domingo.semanas[12][0].fecha);
});

test("T10: una sesión futura solo cuenta cuando llega su fecha", function () {
  const sesiones = [sesion("2026-10-10", 45)];
  assert.equal(construirMapa(sesiones, "2026-10-04").diasConEstudio, 0);
  const ese = construirMapa(sesiones, "2026-10-10");
  assert.equal(ese.diasConEstudio, 1);
  assert.equal(buscar(ese, "2026-10-10").nivel, 2);
});

// ---------- Casos límite de la sección 6 de la spec ----------

test("Caso límite: una sesión de hace más de 13 semanas no sale en el mapa pero cuenta en la mejor racha", function () {
  const hoy = "2026-10-04";
  // Serie de 5 días en junio, antes del primer día del mapa (6 de julio)
  const sesiones = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05"].map(function (fecha) {
    return sesion(fecha, 30);
  });
  const mapa = construirMapa(sesiones, hoy);
  assert.equal(mapa.diasConEstudio, 0);
  assert.equal(buscar(mapa, "2026-06-01"), undefined);
  assert.equal(calcularMejorRacha(sesiones, hoy), 5);
});

test("Caso límite y CA-2.3: el mapa usa la fecha del dispositivo y cada sesión conserva su día en cualquier zona horaria", function () {
  const sesiones = [sesion("2026-10-03", 45), sesion("2026-09-15", 20)];
  // Fecha del dispositivo mal puesta (en el pasado): las sesiones posteriores no cuentan, y no se tocan
  const atrasado = construirMapa(sesiones, "2026-09-20");
  assert.equal(atrasado.diasConEstudio, 1);
  assert.equal(sesiones[0].fecha, "2026-10-03");
  // Viajar: el mismo "hoy" en otra zona horaria da exactamente el mismo mapa
  const enMadrid = JSON.stringify(construirMapa(sesiones, "2026-10-04"));
  try {
    process.env.TZ = "America/Guayaquil";
    assert.equal(JSON.stringify(construirMapa(sesiones, "2026-10-04")), enMadrid);
    process.env.TZ = "Asia/Tokyo";
    assert.equal(JSON.stringify(construirMapa(sesiones, "2026-10-04")), enMadrid);
  } finally {
    process.env.TZ = "Europe/Madrid";
  }
});

// ---------- T11 construirMapa: datos raros, datos intactos y rendimiento ----------

test("T11: si las sesiones no son una lista, el mapa sale vacío", function () {
  [null, undefined, {}, "texto", 42].forEach(function (valor) {
    const mapa = construirMapa(valor, "2026-10-04");
    assert.equal(mapa.diasConEstudio, 0);
    assert.ok(diasVisibles(mapa).every(function (dia) { return dia.nivel === 0; }));
  });
});

test("T11: construirMapa no modifica la lista de sesiones", function () {
  const sesiones = [sesion("2026-10-03", 20), sesion("2026-02-30", 30), sesion("2026-10-03", 0)];
  const copia = JSON.parse(JSON.stringify(sesiones));
  construirMapa(sesiones, "2026-10-04");
  assert.deepEqual(sesiones, copia);
});

test("T11: con 5000 sesiones el mapa se calcula en menos de 100 ms", function () {
  const sesiones = [];
  for (let i = 0; i < 5000; i++) {
    sesiones.push(sesion(sumarDias("2026-10-04", -(i % 400)), 1 + (i % 150)));
  }
  const inicio = Date.now();
  construirMapa(sesiones, "2026-10-04");
  assert.ok(Date.now() - inicio < 100, "tardó " + (Date.now() - inicio) + " ms");
});

// ---------- T12 etiquetasDeMes ----------

test("T12: mesAbreviado devuelve el nombre corto del mes en español", function () {
  assert.equal(mesAbreviado("2026-01-15"), "ene");
  assert.equal(mesAbreviado("2026-09-01"), "sept");
  assert.equal(mesAbreviado("2026-10-31"), "oct");
});

test("T12: etiqueta el mes en la columna que contiene su día 1", function () {
  const etiquetas = etiquetasDeMes(construirMapa([], "2026-10-04").semanas);
  // Columnas: 0 empieza el 6 de julio; el 1 de agosto está en la 3, el 1 de septiembre
  // en la 8 y el 1 de octubre en la 12
  assert.equal(etiquetas.length, 13);
  assert.equal(etiquetas[3], "ago");
  assert.equal(etiquetas[8], "sept");
  assert.equal(etiquetas[12], "oct");
  // La primera columna lleva su mes porque la siguiente etiqueta está a 3 columnas
  assert.equal(etiquetas[0], "jul");
});

test("T12: un mes que empieza en lunes se etiqueta en esa columna", function () {
  // El 1 de junio de 2026 es lunes
  const semanas = construirMapa([], "2026-06-07").semanas;
  const etiquetas = etiquetasDeMes(semanas);
  assert.equal(semanas[12][0].fecha, "2026-06-01");
  assert.equal(etiquetas[12], "jun");
});

test("T12: nunca hay dos etiquetas en columnas contiguas", function () {
  let hoy = "2026-01-04";
  for (let i = 0; i < 60; i++) {
    const etiquetas = etiquetasDeMes(construirMapa([], hoy).semanas);
    for (let c = 1; c < etiquetas.length; c++) {
      assert.ok(etiquetas[c] === "" || etiquetas[c - 1] === "", "hoy " + hoy + ", columna " + c);
    }
    hoy = sumarDias(hoy, 6);
  }
});

test("T12: la primera columna no lleva etiqueta si la siguiente está a menos de 3", function () {
  // Con hoy 2026-10-18 la primera columna empieza el 20 de julio y el 1 de agosto
  // está en la columna 1
  const etiquetas = etiquetasDeMes(construirMapa([], "2026-10-18").semanas);
  assert.equal(etiquetas[1], "ago");
  assert.equal(etiquetas[0], "");
});

// ---------- T13 textoDeDia y textoResumen ----------

test("T13: textoDeDia escribe la fecha y los minutos", function () {
  assert.equal(textoDeDia({ fecha: "2026-10-03", minutos: 45 }), "sábado, 3 de octubre de 2026: 45 min");
  assert.equal(textoDeDia({ fecha: "2026-10-03", minutos: 125 }), "sábado, 3 de octubre de 2026: 125 min");
  assert.equal(textoDeDia({ fecha: "2026-10-03", minutos: 0 }), "sábado, 3 de octubre de 2026: sin estudio");
});

test("T13: textoResumen usa singular, plural y el texto sin sesiones", function () {
  assert.equal(textoResumen(0), "Todavía no hay sesiones en las últimas 13 semanas");
  assert.equal(textoResumen(1), "1 día con estudio en las últimas 13 semanas");
  assert.equal(textoResumen(23), "23 días con estudio en las últimas 13 semanas");
});
