/* Configuración del estudio.
   endpoint: URL de la aplicación web de Google Apps Script que guarda las respuestas
   en la hoja de cálculo (ver README.md, sección "Conectar Google Sheets").
   Mientras esté vacío, la encuesta funciona en modo prueba: no envía nada y ofrece
   descargar una copia de las respuestas. */
window.ENCUESTA_CONFIG = {
  endpoint: '',
  version: 'v16102026',
  estudio: 'Estudio sobre la vida con miastenia gravis generalizada en Colombia',
  realiza: 'Este es un estudio de investigación social a cargo del investigador responsable, Fabian Antonio Dávila Ramírez.',
  responsableDatos: 'Funcolehf',
  conservacion: '3 meses',
  investigador: {
    nombre: 'Fabian Antonio Dávila Ramírez',
    telefono: '3102221277',
    correo: 'fadavilar@gmail.com'
  }
};
