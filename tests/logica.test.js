// Pruebas de la lógica general del diario (spec 002).
// Se ejecutan con: node --test

// Zona horaria con cambio de hora, fijada antes de crear ninguna fecha
process.env.TZ = "Europe/Madrid";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  fechaATexto,
  textoAFecha,
  diaAnterior,
  inicioDeMes,
  fechaBonita,
  calcularRacha,
  nivelDeRacha,
  calcularMejorRacha,
  diasEstudiadosEsteMes,
  sesionesDesdeTexto,
} = require("../logica.js");

// Crea una lista de sesiones a partir de fechas (minutos fijos)
function sesionesDe(fechas) {
  return fechas.map(function (fecha, i) {
    return { id: i + 1, fecha: fecha, tema: "Tema", minutos: 30 };
  });
}

test("la zona horaria de las pruebas tiene cambio de hora", function () {
  assert.notEqual(
    new Date(2026, 9, 24).getTimezoneOffset(),
    new Date(2026, 9, 26).getTimezoneOffset()
  );
});

test("fechaATexto y textoAFecha usan la fecha local", function () {
  assert.equal(fechaATexto(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(fechaATexto(new Date(2026, 9, 4, 0, 30)), "2026-10-04");
  assert.equal(fechaATexto(textoAFecha("2028-02-29")), "2028-02-29");
});

test("diaAnterior cruza meses, años, el 29 de febrero y el cambio de hora", function () {
  assert.equal(diaAnterior("2026-10-04"), "2026-10-03");
  assert.equal(diaAnterior("2026-03-01"), "2026-02-28");
  assert.equal(diaAnterior("2028-03-01"), "2028-02-29");
  assert.equal(diaAnterior("2027-01-01"), "2026-12-31");
  assert.equal(diaAnterior("2026-10-26"), "2026-10-25");
  assert.equal(diaAnterior("2026-03-30"), "2026-03-29");
});

test("inicioDeMes devuelve el día 1 del mes de hoy", function () {
  assert.equal(inicioDeMes("2026-10-04"), "2026-10-01");
  assert.equal(inicioDeMes("2026-12-31"), "2026-12-01");
});

test("fechaBonita escribe la fecha en español", function () {
  assert.equal(fechaBonita("2026-10-03"), "sábado, 3 de octubre de 2026");
});

test("calcularRacha cuenta días seguidos que terminan hoy", function () {
  const hoy = "2026-10-04";
  assert.equal(calcularRacha([], hoy), 0);
  assert.equal(calcularRacha(sesionesDe(["2026-10-04", "2026-10-03", "2026-10-02"]), hoy), 3);
  // Hueco: solo cuenta la serie que termina hoy
  assert.equal(calcularRacha(sesionesDe(["2026-10-04", "2026-10-02"]), hoy), 1);
});

test("calcularRacha sigue viva desde ayer si hoy aún no hay sesión", function () {
  assert.equal(calcularRacha(sesionesDe(["2026-10-03", "2026-10-02"]), "2026-10-04"), 2);
  assert.equal(calcularRacha(sesionesDe(["2026-10-02"]), "2026-10-04"), 0);
});

test("calcularRacha: varias sesiones el mismo día cuentan una vez", function () {
  assert.equal(calcularRacha(sesionesDe(["2026-10-04", "2026-10-04", "2026-10-03"]), "2026-10-04"), 2);
});

test("calcularRacha cruza el cambio de hora y el de año", function () {
  assert.equal(
    calcularRacha(sesionesDe(["2026-10-24", "2026-10-25", "2026-10-26"]), "2026-10-26"),
    3
  );
  assert.equal(
    calcularRacha(sesionesDe(["2026-12-31", "2027-01-01"]), "2027-01-01"),
    2
  );
});

test("nivelDeRacha respeta los límites de cada color", function () {
  const casos = { 0: "apagada", 1: "roja", 99: "roja", 100: "azul", 299: "azul",
    300: "morada", 499: "morada", 500: "dorada", 1000: "dorada" };
  Object.keys(casos).forEach(function (racha) {
    assert.equal(nivelDeRacha(Number(racha)), casos[racha], "racha " + racha);
  });
});

test("calcularMejorRacha encuentra la serie más larga del historial", function () {
  const hoy = "2026-10-04";
  assert.equal(calcularMejorRacha([], hoy), 0);
  const fechas = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05",
    "2026-10-03", "2026-10-04"];
  assert.equal(calcularMejorRacha(sesionesDe(fechas), hoy), 5);
});

test("calcularMejorRacha ignora las fechas futuras y cruza fin de año y 29 de febrero", function () {
  assert.equal(
    calcularMejorRacha(sesionesDe(["2026-10-04", "2026-10-05", "2026-10-06"]), "2026-10-04"),
    1
  );
  assert.equal(
    calcularMejorRacha(sesionesDe(["2025-12-30", "2025-12-31", "2026-01-01"]), "2026-10-04"),
    3
  );
  assert.equal(
    calcularMejorRacha(sesionesDe(["2028-02-28", "2028-02-29", "2028-03-01"]), "2028-03-10"),
    3
  );
});

test("diasEstudiadosEsteMes cuenta días distintos del mes de calendario hasta hoy", function () {
  const hoy = "2026-10-04";
  const fechas = ["2026-10-01", "2026-10-01", "2026-10-03",
    "2026-09-30", // mes anterior: no cuenta
    "2026-10-20", // futura: no cuenta
  ];
  assert.equal(diasEstudiadosEsteMes(sesionesDe(fechas), hoy), 2);
  assert.equal(diasEstudiadosEsteMes([], hoy), 0);
});

test("sesionesDesdeTexto devuelve la lista guardada o una lista vacía si no se puede usar", function () {
  const guardadas = sesionesDe(["2026-10-04"]);
  assert.deepEqual(sesionesDesdeTexto(JSON.stringify(guardadas)), guardadas);
  assert.deepEqual(sesionesDesdeTexto("[]"), []);
  // Nada guardado, JSON roto o JSON que no es una lista (spec 001, CA-10.2)
  [null, "", "{roto", "{}", "null", "42", '"texto"', '{"0":{"fecha":"2026-10-04"}}'].forEach(function (texto) {
    assert.deepEqual(sesionesDesdeTexto(texto), [], String(texto));
  });
});

test("las funciones no modifican la lista de sesiones", function () {
  const sesiones = sesionesDe(["2026-10-04", "2026-10-02", "2026-10-03"]);
  const copia = JSON.parse(JSON.stringify(sesiones));
  calcularRacha(sesiones, "2026-10-04");
  calcularMejorRacha(sesiones, "2026-10-04");
  diasEstudiadosEsteMes(sesiones, "2026-10-04");
  assert.deepEqual(sesiones, copia);
});
