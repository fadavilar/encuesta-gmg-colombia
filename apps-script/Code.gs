/**
 * Receptor de respuestas — Encuesta gMG Colombia.
 * Pegue este código en Extensiones → Apps Script de la hoja de cálculo donde quiere
 * recibir las respuestas y despliéguelo como aplicación web (ver README.md).
 *
 * Crea y mantiene tres hojas:
 *   Pacientes   una fila por encuesta de paciente
 *   Cuidadores  una fila por encuesta de cuidador
 *   Diccionario variable → pregunta, etiqueta y opciones
 * Las columnas nuevas se agregan solas si la encuesta cambia.
 */
var HOJAS = { paciente: 'Pacientes', cuidador: 'Cuidadores' };

function doGet() {
  return json_({ ok: true, servicio: 'encuesta-gmg', hora: new Date().toISOString() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.hp) return json_({ ok: true }); // trampa para robots: se descarta en silencio
    var d = body.data || {};
    var nombreHoja = HOJAS[d.rol];
    if (!nombreHoja || !d._id) return json_({ ok: false, error: 'datos incompletos' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(nombreHoja) || ss.insertSheet(nombreHoja);

    // Encabezados: los existentes + las variables nuevas que traiga esta respuesta.
    var claves = Object.keys(d);
    var headers = sh.getLastColumn() > 0 ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
    var nuevas = claves.filter(function (k) { return headers.indexOf(k) < 0; });
    if (nuevas.length) {
      sh.getRange(1, headers.length + 1, 1, nuevas.length).setValues([nuevas]).setFontWeight('bold');
      headers = headers.concat(nuevas);
      sh.setFrozenRows(1);
    }

    // Evita duplicados si el participante reintenta el envío.
    var colId = headers.indexOf('_id') + 1;
    if (sh.getLastRow() > 1 && colId > 0) {
      var ids = sh.getRange(2, colId, sh.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; });
      if (ids.indexOf(d._id) >= 0) return json_({ ok: true, id: d._id, duplicado: true });
    }

    var fila = headers.map(function (h) { return Object.prototype.hasOwnProperty.call(d, h) ? limpiar_(d[h]) : ''; });
    sh.appendRow(fila);

    actualizarDiccionario_(ss, d.rol, body.diccionario || []);
    return json_({ ok: true, id: d._id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function actualizarDiccionario_(ss, rol, dic) {
  if (!dic.length) return;
  var sh = ss.getSheetByName('Diccionario');
  if (!sh) {
    sh = ss.insertSheet('Diccionario');
    sh.appendRow(['rol', 'variable', 'pregunta_n', 'pregunta', 'etiqueta', 'opciones']);
    sh.getRange(1, 1, 1, 6).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  var existentes = {};
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { existentes[r[0] + '|' + r[1]] = true; });
  }
  var filas = dic.filter(function (x) { return !existentes[rol + '|' + x[0]]; })
    .map(function (x) { return [rol, x[0], x[1], x[2], x[3], x[4]].map(limpiar_); });
  if (filas.length) sh.getRange(sh.getLastRow() + 1, 1, filas.length, 6).setValues(filas);
}

// Texto plano: evita que una respuesta que empiece por = + - @ se interprete como fórmula.
function limpiar_(v) {
  var s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s.slice(0, 45000);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
