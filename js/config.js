/* Configuración del estudio.
   endpoint: URL de la aplicación web de Google Apps Script que guarda las respuestas
   en la hoja de cálculo (ver README.md, sección "Conectar Google Sheets").
   Mientras esté vacío, la encuesta funciona en modo prueba: no envía nada y ofrece
   descargar una copia de las respuestas. */
window.ENCUESTA_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/AKfycbxgytayYeNZRFel5HLmcj_kYmrxj7qnbsUG1-RwBb2CTmtqdDPEcBN6HCm8lfvZP-MjJw/exec',
  version: 'v21102026-r2',
  estudio: 'Estudio sobre la vida con miastenia gravis generalizada en Colombia',
  // Declaración de financiación y conflicto de interés (Declaración de Helsinki, párr. 26; IETS 2025).
  // Si el comité de ética lo exige, nombre aquí al financiador.
  realiza: 'El estudio lo realiza un consultor independiente y lo financia una compañía farmacéutica que investiga tratamientos para la miastenia gravis; por eso declaramos un posible conflicto de interés. El financiador no participa en la recolección de los datos, no tendrá acceso a sus respuestas individuales ni a datos que permitan identificarlo, y solo recibirá resultados agregados o anonimizados.',
  responsableDatos: 'Fabian Antonio Dávila Ramírez, investigador responsable',
  conservacion: '3 meses',
  // Concepto del comité de ética (Resolución 8430 de 1993). Ejemplo: 'Aprobado por el Comité de Ética de …, acta n.º … del …'.
  comiteEtica: '',
  devolucion: 'Sí. Al terminar el estudio publicaremos en esta misma página un resumen de los resultados en lenguaje sencillo y lo compartiremos con las asociaciones de pacientes.',
  alternativas: '¿Prefiere responder por teléfono, en papel o con ayuda de alguien del estudio? Escriba o llame a:',
  investigador: {
    nombre: 'Fabian Antonio Dávila Ramírez',
    telefono: '3102221277',
    correo: 'fadavilar@gmail.com'
  }
};
