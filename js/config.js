/* Configuración del estudio.
   endpoint: URL de la aplicación web de Google Apps Script que guarda las respuestas
   en la hoja de cálculo (ver README.md, sección "Conectar Google Sheets").
   Mientras esté vacío, la encuesta funciona en modo prueba: no envía nada y ofrece
   descargar una copia de las respuestas. */
window.ENCUESTA_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/AKfycbxgytayYeNZRFel5HLmcj_kYmrxj7qnbsUG1-RwBb2CTmtqdDPEcBN6HCm8lfvZP-MjJw/exec',
  version: 'v16102026',
  estudio: 'Estudio sobre la vida con miastenia gravis generalizada en Colombia',
  realiza: 'El estudio lo realiza y financia un consultor independiente. El financiador no recibirá su nombre ni datos que permitan identificarlo; solo recibirá resultados agregados o anonimizados.',
  responsableDatos: 'Funcolehf',
  conservacion: '3 meses',
  investigador: {
    nombre: 'Fabian Antonio Dávila Ramírez',
    telefono: '3102221277',
    correo: 'fadavilar@gmail.com'
  }
};
