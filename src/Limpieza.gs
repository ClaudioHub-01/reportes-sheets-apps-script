/**
 * Limpieza.gs
 * Funciones puras (sin SpreadsheetApp) para limpiar las filas de ventas.
 * Al no depender de Google, se pueden probar con Node (ver tests/).
 */

var COLUMNAS = ['Fecha', 'Boleta', 'Sucursal', 'Vendedor', 'Categoria', 'Producto', 'Cantidad', 'PrecioUnitario'];

/**
 * Quita espacios sobrantes y corrige mayúsculas.
 * modo "titulo" (por defecto): "la florida" -> "La Florida" (nombres, sucursales).
 * modo "frase": "CAFÉ EN GRANO 1 KG" -> "Café en grano 1 kg" (productos, categorías).
 */
function normalizarTexto(valor, modo) {
  if (valor === null || valor === undefined) return '';
  var limpio = String(valor).replace(/\s+/g, ' ').trim().toLowerCase();
  if (modo === 'frase') return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  return limpio.replace(/(^|\s)(\S)/g, function (m, esp, letra) {
    return esp + letra.toUpperCase();
  });
}

/** Convierte "$12.990", "12990", "12.990,50" o un número a número. Devuelve NaN si no se puede. */
function convertirNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (valor === null || valor === undefined) return NaN;
  var s = String(valor).replace(/[$\s]/g, '');
  if (s === '') return NaN;
  // Formato chileno: punto = miles, coma = decimales
  s = s.replace(/\./g, '').replace(',', '.');
  return Number(s);
}

/** Acepta Date, "dd/mm/aaaa", "dd-mm-aaaa" o "aaaa-mm-dd". Devuelve Date o null. */
function convertirFecha(valor) {
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;
  if (valor === null || valor === undefined) return null;
  var s = String(valor).trim();
  var m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return null;
}

/**
 * Limpia una tabla (array de filas, sin encabezado).
 * Devuelve { filas: [...objetos limpios], descartadas: n, duplicadas: n }.
 */
function limpiarFilas(filas) {
  var vistas = {};
  var limpias = [];
  var descartadas = 0;
  var duplicadas = 0;

  filas.forEach(function (fila) {
    var vacia = fila.every(function (c) { return c === '' || c === null || c === undefined; });
    if (vacia) return;

    var registro = {
      fecha: convertirFecha(fila[0]),
      boleta: String(fila[1] === null || fila[1] === undefined ? '' : fila[1]).trim(),
      sucursal: normalizarTexto(fila[2]),
      vendedor: normalizarTexto(fila[3]),
      categoria: normalizarTexto(fila[4], 'frase'),
      producto: normalizarTexto(fila[5], 'frase'),
      cantidad: convertirNumero(fila[6]),
      precio: convertirNumero(fila[7])
    };

    var valida = registro.fecha && registro.sucursal && registro.producto &&
      registro.boleta && registro.cantidad > 0 && registro.precio > 0;
    if (!valida) { descartadas++; return; }

    // Una misma boleta no puede repetir el mismo producto: si pasa, es una fila duplicada.
    var clave = [registro.sucursal, registro.boleta, registro.producto].join('|');
    if (vistas[clave]) { duplicadas++; return; }
    vistas[clave] = true;

    registro.total = registro.cantidad * registro.precio;
    limpias.push(registro);
  });

  return { filas: limpias, descartadas: descartadas, duplicadas: duplicadas };
}
