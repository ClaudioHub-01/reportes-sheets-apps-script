/**
 * Calculos.gs
 * Agregaciones puras sobre las filas limpias. También se prueban con Node.
 */

/** Clave "aaaa-mm" de una fecha. */
function claveMes(fecha) {
  var m = fecha.getMonth() + 1;
  return fecha.getFullYear() + '-' + (m < 10 ? '0' + m : m);
}

/** Suma el total agrupando por el campo indicado. Devuelve [[clave, total], ...] ordenado de mayor a menor. */
function totalPor(filas, campo) {
  var acc = {};
  filas.forEach(function (f) {
    var k = campo === 'mes' ? claveMes(f.fecha) : f[campo];
    acc[k] = (acc[k] || 0) + f.total;
  });
  var lista = Object.keys(acc).map(function (k) { return [k, acc[k]]; });
  if (campo === 'mes') return lista.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
  return lista.sort(function (a, b) { return b[1] - a[1]; });
}

/** Filtra las filas de un mes "aaaa-mm". */
function filasDelMes(filas, mes) {
  return filas.filter(function (f) { return claveMes(f.fecha) === mes; });
}

/** Mes anterior a "aaaa-mm". */
function mesAnterior(mes) {
  var p = mes.split('-');
  var d = new Date(Number(p[0]), Number(p[1]) - 2, 1);
  return claveMes(d);
}

/**
 * Indicadores del mes: ventas, unidades, n° de ventas, ticket promedio
 * y variación contra el mes anterior.
 */
function indicadoresMes(filas, mes) {
  var actual = filasDelMes(filas, mes);
  var previo = filasDelMes(filas, mesAnterior(mes));
  var suma = function (arr, campo) { return arr.reduce(function (s, f) { return s + f[campo]; }, 0); };
  var ventas = suma(actual, 'total');
  var ventasPrevio = suma(previo, 'total');
  return {
    mes: mes,
    ventas: ventas,
    unidades: suma(actual, 'cantidad'),
    transacciones: actual.length,
    ticketPromedio: actual.length ? ventas / actual.length : 0,
    variacion: ventasPrevio ? (ventas - ventasPrevio) / ventasPrevio : null
  };
}

/** Último mes con datos. */
function ultimoMes(filas) {
  return filas.reduce(function (max, f) {
    var k = claveMes(f.fecha);
    return k > max ? k : max;
  }, '0000-00');
}
