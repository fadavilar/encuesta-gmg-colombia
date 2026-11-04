/* Configuración del estudio.
   endpoint: URL de la aplicación web de Google Apps Script que guarda las respuestas
   en la hoja de cálculo (ver README.md, sección "Conectar Google Sheets").
   Mientras esté vacío, la encuesta funciona en modo prueba: no envía nada y ofrece
   descargar una copia de las respuestas. */
window.ENCUESTA_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/AKfycbxgytayYeNZRFel5HLmcj_kYmrxj7qnbsUG1-RwBb2CTmtqdDPEcBN6HCm8lfvZP-MjJw/exec',
  version: 'v21102026-r3',
  // Acceso privado: huella SHA-256 de 'gmg-acceso|' + la clave del estudio (en mayúsculas, sin guiones).
  // La clave NO se guarda en el repositorio; vacío = encuesta abierta. Para cambiarla, ver README.md.
  accesoHash: '',
  estudio: 'Estudio sobre la vida con miastenia gravis generalizada en Colombia',
  realiza: 'Este es un estudio de investigación social a cargo del investigador responsable, Fabian Antonio Dávila Ramírez.',
  responsableDatos: 'Fabian Antonio Dávila Ramírez, investigador responsable',
  conservacion: '3 meses',
  devolucion: 'Sí. Al terminar el estudio publicaremos en esta misma página un resumen de los resultados en lenguaje sencillo y lo compartiremos con las asociaciones de pacientes.',
  alternativas: '¿Prefiere responder por teléfono, en papel o con ayuda de alguien del estudio? Escriba o llame a:',
  investigador: {
    nombre: 'Fabian Antonio Dávila Ramírez',
    telefono: '3102221277',
    correo: 'fadavilar@gmail.com'
  }
};
