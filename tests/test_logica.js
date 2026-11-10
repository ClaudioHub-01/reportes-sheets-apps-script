/**
 * Pruebas de la lógica pura (Limpieza.gs y Calculos.gs) con Node, sin Google.
 * Uso: node tests/test_logica.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ctx = {};
vm.createContext(ctx);
for (const archivo of ['Limpieza.gs', 'Calculos.gs']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', archivo), 'utf8'), ctx);
}
const { normalizarTexto, convertirNumero, convertirFecha, limpiarFilas, totalPor, indicadoresMes, mesAnterior, ultimoMes } = ctx;

let ok = 0;
const prueba = (nombre, fn) => { fn(); ok++; console.log('✓', nombre); };

prueba('normaliza texto', () => {
  assert.strictEqual(normalizarTexto('  PROVIDENCIA '), 'Providencia');
  assert.strictEqual(normalizarTexto('  la florida'), 'La Florida');
  assert.strictEqual(normalizarTexto('CAFÉ EN GRANO 1 KG  ', 'frase'), 'Café en grano 1 kg');
  assert.strictEqual(normalizarTexto(null), '');
});

prueba('convierte montos chilenos', () => {
  assert.strictEqual(convertirNumero('$14.990'), 14990);
  assert.strictEqual(convertirNumero('14.990'), 14990);
  assert.strictEqual(convertirNumero(7990), 7990);
  assert.strictEqual(convertirNumero('12.990,5'), 12990.5);
  assert.ok(Number.isNaN(convertirNumero('sin dato')));
  assert.ok(Number.isNaN(convertirNumero('')));
});

prueba('convierte fechas', () => {
  assert.strictEqual(convertirFecha('05/03/2026').getMonth(), 2);
  assert.strictEqual(convertirFecha('2026-03-05').getDate(), 5);
  assert.strictEqual(convertirFecha('ayer'), null);
});

prueba('limpia filas: vacías, inválidas y duplicadas', () => {
  const filas = [
    ['2026-01-10', 101, 'Providencia', 'Ana', 'Café', 'Brownie', 2, '$2.490'],
    ['10/01/2026', 101, ' PROVIDENCIA ', 'ana', 'café', 'brownie', 2, 2490], // duplicada tras limpiar
    ['2026-01-10', 102, 'Providencia', 'Ana', 'Café', 'Brownie', 2, 2490],   // venta idéntica, otra boleta: válida
    ['', '', '', '', '', '', '', ''],                                          // vacía (se ignora)
    ['2026-01-11', 201, 'Maipú', 'Luis', 'Café', 'Brownie', '-', 2490],        // cantidad inválida
    ['2026-02-01', 202, 'Maipú', 'Luis', 'Café', 'Brownie', 1, 2490],
  ];
  const r = limpiarFilas(filas);
  assert.strictEqual(r.filas.length, 3);
  assert.strictEqual(r.duplicadas, 1);
  assert.strictEqual(r.descartadas, 1);
  assert.strictEqual(r.filas[0].total, 4980);
});

prueba('agrega por mes y calcula indicadores', () => {
  const r = limpiarFilas([
    ['2026-01-10', 1, 'A', 'x', 'C', 'P1', 1, 1000],
    ['2026-02-10', 2, 'A', 'x', 'C', 'P1', 1, 1000],
    ['2026-02-11', 3, 'B', 'x', 'C', 'P2', 2, 1000],
  ]);
  assert.strictEqual(JSON.stringify(totalPor(r.filas, 'mes')), JSON.stringify([['2026-01', 1000], ['2026-02', 3000]]));
  assert.strictEqual(ultimoMes(r.filas), '2026-02');
  const k = indicadoresMes(r.filas, '2026-02');
  assert.strictEqual(k.ventas, 3000);
  assert.strictEqual(k.transacciones, 2);
  assert.strictEqual(k.ticketPromedio, 1500);
  assert.strictEqual(k.variacion, 2);
  assert.strictEqual(mesAnterior('2026-01'), '2025-12');
});

// Prueba con el archivo de ejemplo completo
const csv = fs.readFileSync(path.join(__dirname, '..', 'datos', 'ventas_ejemplo.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1)
  .map(l => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).slice(0, 8).map(c => c.replace(/,$/, '').replace(/^"|"$/g, '')));
prueba('procesa el archivo de ejemplo', () => {
  const r = limpiarFilas(csv);
  const k = indicadoresMes(r.filas, ultimoMes(r.filas));
  console.log(`   filas: ${csv.length} | válidas: ${r.filas.length} | descartadas: ${r.descartadas} | duplicadas: ${r.duplicadas}`);
  console.log(`   ${k.mes}: ventas $${Math.round(k.ventas).toLocaleString('es-CL')} | n° ${k.transacciones} | variación ${(k.variacion * 100).toFixed(1)}%`);
  assert.strictEqual(r.duplicadas, 25);
  assert.strictEqual(r.descartadas, 6);
  assert.strictEqual(JSON.stringify(totalPor(r.filas, 'sucursal').map(x => x[0]).sort()), JSON.stringify(['La Florida', 'Maipú', 'Providencia', 'Ñuñoa'].sort()));
});

console.log(`\n${ok} pruebas correctas`);
