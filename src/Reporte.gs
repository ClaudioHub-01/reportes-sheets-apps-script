/**
 * Reporte.gs
 * Lee la hoja de ventas, la limpia, arma la hoja "Resumen" con gráfico
 * y envía el reporte en PDF por correo.
 */

var FORMATO_PESOS = '$#,##0';
var COLOR_TITULO = '#1D2433';
var COLOR_ACENTO = '#34A853';

/** Lee la hoja "Config" (columna A = clave, columna B = valor). */
function leerConfig() {
  var hoja = SpreadsheetApp.getActive().getSheetByName('Config');
  var config = { HojaDatos: 'Ventas', Destinatarios: '', Asunto: 'Reporte de ventas', NombreEmpresa: 'Mi empresa' };
  if (!hoja) return config;
  hoja.getDataRange().getValues().slice(1).forEach(function (fila) {
    if (fila[0]) config[String(fila[0]).trim()] = String(fila[1]).trim();
  });
  return config;
}

/** Devuelve la hoja con ese nombre, vacía. La crea si no existe. */
function hojaLimpia(nombre) {
  var libro = SpreadsheetApp.getActive();
  var hoja = libro.getSheetByName(nombre) || libro.insertSheet(nombre);
  hoja.clear();
  hoja.getCharts().forEach(function (g) { hoja.removeChart(g); });
  return hoja;
}

/** Escribe una tabla con encabezado formateado. Devuelve la fila siguiente libre. */
function escribirTabla(hoja, fila, col, titulo, encabezado, datos) {
  hoja.getRange(fila, col).setValue(titulo).setFontWeight('bold').setFontSize(12).setFontColor(COLOR_TITULO);
  hoja.getRange(fila + 1, col, 1, encabezado.length).setValues([encabezado])
    .setBackground(COLOR_TITULO).setFontColor('#FFFFFF').setFontWeight('bold');
  if (datos.length) {
    hoja.getRange(fila + 2, col, datos.length, encabezado.length).setValues(datos);
    hoja.getRange(fila + 2, col + 1, datos.length, 1).setNumberFormat(FORMATO_PESOS);
  }
  return fila + 3 + datos.length;
}

/** Proceso principal: limpiar + resumir. Devuelve los indicadores del último mes. */
function generarResumen() {
  var config = leerConfig();
  var libro = SpreadsheetApp.getActive();
  var origen = libro.getSheetByName(config.HojaDatos);
  if (!origen) throw new Error('No existe la hoja "' + config.HojaDatos + '". Revisa la hoja Config.');

  var valores = origen.getDataRange().getValues();
  var resultado = limpiarFilas(valores.slice(1));
  var filas = resultado.filas;
  if (!filas.length) throw new Error('No hay filas válidas en la hoja "' + config.HojaDatos + '".');

  // 1) Datos limpios
  var limpia = hojaLimpia('Datos limpios');
  var tabla = filas.map(function (f) {
    return [f.fecha, f.boleta, f.sucursal, f.vendedor, f.categoria, f.producto, f.cantidad, f.precio, f.total];
  });
  limpia.getRange(1, 1, 1, 9).setValues([COLUMNAS.concat(['Total'])])
    .setBackground(COLOR_TITULO).setFontColor('#FFFFFF').setFontWeight('bold');
  limpia.getRange(2, 1, tabla.length, 9).setValues(tabla);
  limpia.getRange(2, 1, tabla.length, 1).setNumberFormat('dd-mm-yyyy');
  limpia.getRange(2, 8, tabla.length, 2).setNumberFormat(FORMATO_PESOS);
  limpia.setFrozenRows(1);
  limpia.autoResizeColumns(1, 9);

  // 2) Resumen
  var mes = ultimoMes(filas);
  var kpi = indicadoresMes(filas, mes);
  var delMes = filasDelMes(filas, mes);
  var hoja = hojaLimpia('Resumen');

  hoja.getRange('A1').setValue(config.NombreEmpresa + ' · Reporte de ventas ' + mes)
    .setFontSize(18).setFontWeight('bold').setFontColor(COLOR_TITULO);
  hoja.getRange('A2').setValue('Generado automáticamente el ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm'))
    .setFontColor('#5B6475');

  var tarjetas = [
    ['Ventas del mes', kpi.ventas, FORMATO_PESOS],
    ['Variación vs mes anterior', kpi.variacion === null ? 'Sin dato' : kpi.variacion, '+0.0%;-0.0%'],
    ['N° de ventas', kpi.transacciones, '#,##0'],
    ['Ticket promedio', kpi.ticketPromedio, FORMATO_PESOS]
  ];
  tarjetas.forEach(function (t, i) {
    var col = 1 + i * 2;
    hoja.getRange(4, col).setValue(t[0]).setFontColor('#5B6475');
    hoja.getRange(5, col).setValue(t[1]).setNumberFormat(t[2]).setFontSize(16).setFontWeight('bold');
  });
  if (kpi.variacion !== null) {
    hoja.getRange(5, 3).setFontColor(kpi.variacion >= 0 ? COLOR_ACENTO : '#D93025');
  }

  var meses = totalPor(filas, 'mes');
  var siguiente = escribirTabla(hoja, 8, 1, 'Ventas por mes', ['Mes', 'Ventas'], meses);
  escribirTabla(hoja, 8, 4, 'Ventas por sucursal (' + mes + ')', ['Sucursal', 'Ventas'], totalPor(delMes, 'sucursal'));
  var trasCategorias = escribirTabla(hoja, 8, 7, 'Ventas por categoría (' + mes + ')', ['Categoría', 'Ventas'], totalPor(delMes, 'categoria'));
  escribirTabla(hoja, trasCategorias, 7, 'Top 5 productos (' + mes + ')', ['Producto', 'Ventas'], totalPor(delMes, 'producto').slice(0, 5));

  var grafico = hoja.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(hoja.getRange(9, 1, meses.length + 1, 2))
    .setPosition(siguiente, 1, 0, 0)
    .setOption('title', 'Ventas por mes')
    .setOption('legend', { position: 'none' })
    .setOption('colors', [COLOR_TITULO])
    .setOption('width', 520).setOption('height', 300)
    .build();
  hoja.insertChart(grafico);
  hoja.autoResizeColumns(1, 8);
  hoja.setHiddenGridlines(true);

  // 3) Registro de ejecuciones
  var registro = libro.getSheetByName('Registro') || libro.insertSheet('Registro');
  if (registro.getLastRow() === 0) {
    registro.appendRow(['Fecha', 'Filas leídas', 'Filas válidas', 'Descartadas', 'Duplicadas']);
    registro.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  registro.appendRow([new Date(), valores.length - 1, filas.length, resultado.descartadas, resultado.duplicadas]);

  libro.setActiveSheet(hoja);
  return kpi;
}

/** Exporta la hoja "Resumen" como PDF (horizontal, ajustado al ancho). */
function resumenComoPdf(nombreArchivo) {
  var libro = SpreadsheetApp.getActive();
  var hoja = libro.getSheetByName('Resumen');
  SpreadsheetApp.flush();
  var url = 'https://docs.google.com/spreadsheets/d/' + libro.getId() + '/export' +
    '?format=pdf&gid=' + hoja.getSheetId() +
    '&portrait=false&fitw=true&gridlines=false&printtitle=false&sheetnames=false&pagenum=UNDEFINED';
  var respuesta = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  });
  return respuesta.getBlob().setName(nombreArchivo + '.pdf');
}

/** Genera el resumen y lo envía por correo con el PDF adjunto. */
function enviarReporte() {
  var config = leerConfig();
  if (!config.Destinatarios) throw new Error('Agrega al menos un correo en Config > Destinatarios.');
  var kpi = generarResumen();
  var pdf = resumenComoPdf('Reporte_ventas_' + kpi.mes);
  var pesos = function (n) { return '$' + Math.round(n).toLocaleString('es-CL'); };
  var variacion = kpi.variacion === null ? 'sin dato del mes anterior'
    : (kpi.variacion >= 0 ? '▲ ' : '▼ ') + (Math.abs(kpi.variacion) * 100).toFixed(1) + '% vs mes anterior';

  var html =
    '<div style="font-family:Arial,sans-serif;color:#1D2433">' +
    '<h2 style="margin:0">' + config.NombreEmpresa + ' · Ventas ' + kpi.mes + '</h2>' +
    '<p style="color:#5B6475">Reporte generado automáticamente.</p>' +
    '<table cellpadding="8" style="border-collapse:collapse">' +
    '<tr><td>Ventas del mes</td><td><b>' + pesos(kpi.ventas) + '</b> (' + variacion + ')</td></tr>' +
    '<tr><td>N° de ventas</td><td><b>' + kpi.transacciones + '</b></td></tr>' +
    '<tr><td>Ticket promedio</td><td><b>' + pesos(kpi.ticketPromedio) + '</b></td></tr>' +
    '</table><p>El detalle está en el PDF adjunto.</p></div>';

  MailApp.sendEmail({
    to: config.Destinatarios,
    subject: config.Asunto + ' · ' + kpi.mes,
    htmlBody: html,
    attachments: [pdf]
  });
  return kpi;
}
