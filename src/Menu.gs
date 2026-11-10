/**
 * Menu.gs
 * Menú "Reportes" dentro de Google Sheets y programación del envío mensual.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Reportes')
    .addItem('Generar resumen', 'menuGenerarResumen')
    .addItem('Enviar reporte ahora', 'menuEnviarReporte')
    .addSeparator()
    .addItem('Programar envío mensual (día 1, 8:00)', 'instalarEnvioMensual')
    .addItem('Quitar envío programado', 'quitarEnvioProgramado')
    .addToUi();
}

function menuGenerarResumen() {
  var kpi = generarResumen();
  SpreadsheetApp.getActive().toast('Resumen de ' + kpi.mes + ' actualizado.', 'Reportes', 5);
}

function menuEnviarReporte() {
  var kpi = enviarReporte();
  SpreadsheetApp.getActive().toast('Reporte de ' + kpi.mes + ' enviado.', 'Reportes', 5);
}

/** Crea un activador que envía el reporte el día 1 de cada mes a las 8:00. */
function instalarEnvioMensual() {
  quitarEnvioProgramado(true);
  ScriptApp.newTrigger('enviarReporte').timeBased().onMonthDay(1).atHour(8).create();
  SpreadsheetApp.getActive().toast('Envío programado: día 1 de cada mes, 8:00.', 'Reportes', 5);
}

function quitarEnvioProgramado(silencioso) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'enviarReporte') ScriptApp.deleteTrigger(t);
  });
  if (silencioso !== true) SpreadsheetApp.getActive().toast('Envío programado eliminado.', 'Reportes', 5);
}
