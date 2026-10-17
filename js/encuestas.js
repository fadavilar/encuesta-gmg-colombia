/* Contenido de las encuestas autoaplicadas (v16-oct-2026).
   Texto tomado de Encuesta_gMG_Paciente_autoaplicada_v16102026.docx y
   Encuesta_gMG_Cuidador_autoaplicada_v16102026.docx.

   Tipos de ítem:
     single  una respuesta (radio)        multi  varias respuestas (casillas)
     nums    campos numéricos [sufijo, etiqueta, unidad, {min,max}]
     texts   campos de texto corto [sufijo, etiqueta]
     place   departamento + municipio     grid   matriz filas × columnas
     long    texto abierto                costs  tabla de gastos
   Claves: cada ítem define `k`; las subclaves se forman como k_sufijo o k_n.
   `excl` = opciones que excluyen a las demás; `otro` = agrega "Otro, ¿cuál?".
   `showIf(r)` oculta la pregunta (o el ítem) cuando no aplica (saltos del .docx). */
(function () {
  'use strict';

  const SEXO = ['Mujer', 'Hombre', 'Otro', 'Prefiero no responder'];
  const ESTUDIOS = ['Primaria o menos', 'Bachillerato', 'Técnico o tecnólogo', 'Universitario', 'Posgrado'];
  const FRECUENCIA_4 = ['Nunca', 'Una vez', 'De 2 a 3 veces', '4 veces o más'];
  const PREOCUPACION = ['Preocupación grande', 'Alguna preocupación', 'Ninguna preocupación'];
  const CLARIDAD = ['Sí, con claridad', 'Algo', 'No'];
  const INGRESO_HOGAR = [
    'Menos de ¼ del salario mínimo mensual', 'De ¼ a menos de ½ salario mínimo',
    'De ½ a menos de 1 salario mínimo', 'De 1 a menos de 2 salarios mínimos',
    '2 salarios mínimos o más', 'Prefiero no responder'
  ];
  const GASTO_GRANDE = [
    'Ahorros', 'Ayuda de familiares o amigos',
    'Préstamos o deudas (bancos, tarjetas, “gota a gota”, otros)', 'Vendí o empeñé bienes',
    'Dejé de pagar otras cosas (arriendo, servicios, estudio de los hijos, alimentación)',
    'Colectas, rifas o ayuda de una fundación', 'Tutela u otro trámite legal', 'No he tenido gastos grandes'
  ];
  const AYUDAS = [
    'Pensión de invalidez', 'Subsidio del Estado', 'Fundación o asociación de pacientes',
    'Ayuda de familiares', 'Ayuda que no es dinero (orientación, transporte, respiro)', 'Ninguna'
  ];
  const PREOCUPACIONES_FILAS = [
    'Tener dinero para una urgencia o una crisis', 'Perder o reducir los ingresos',
    'El costo de los medicamentos y tratamientos', 'Gastos que no son médicos: transporte, comida, alojamiento',
    'Manejar el presupuesto del hogar día a día', 'El costo de ayuda para el cuidado o para la casa (cuidador, hijos)',
    'Los trámites para conseguir ayudas: pensión, calificación de invalidez, subsidios',
    'El costo de adecuar la casa o de transporte accesible'
  ];
  const OPCIONAL = 'Pregunta opcional: puede dejarla en blanco.';

  /* Fuentes de los instrumentos validados (DOI verificados en Crossref, 16-oct-2026). */
  const FUENTES = {
    zarit: {
      instrumento: 'Escala de sobrecarga del cuidador de Zarit (22 ítems)',
      usadaEn: 'Cuidadores, pregunta 27',
      refs: [
        { cita: 'Zarit SH, Reever KE, Bach-Peterson J. Relatives of the impaired elderly: correlates of feelings of burden. Gerontologist. 1980;20(6):649-55.', url: 'https://doi.org/10.1093/geront/20.6.649' },
        { cita: 'Barreto-Osorio RV, Campos de Aldana MS, Carrillo-González GM, Coral-Ibarra R, et al. Entrevista Percepción de Carga del Cuidado de Zarit: pruebas psicométricas para Colombia. Aquichan. 2015;15(3):368-80.', url: 'https://doi.org/10.5294/aqui.2015.15.3.5' }
      ]
    },
    mgadl: {
      instrumento: 'Actividades de la vida diaria y calidad de vida en miastenia gravis (MG-ADL)',
      usadaEn: 'Pacientes, pregunta 38',
      refs: [
        { cita: 'Wolfe GI, Herbelin L, Nations SP, Foster B, Bryan WW, Barohn RJ. Myasthenia gravis activities of daily living profile. Neurology. 1999;52(7):1487-9.', url: 'https://doi.org/10.1212/WNL.52.7.1487' },
        { cita: 'Hoyos Cerón JA. Evaluación de la calidad de vida en pacientes con miastenia gravis [tesis de especialización en Neurología]. Bogotá: Universidad Nacional de Colombia; 2014.', url: 'https://repositorio.unal.edu.co/handle/unal/21862' }
      ]
    }
  };
  const anio = { min: 1940, max: 2026 };
  const de100 = { min: 0, max: 100 };

  /* ---------------------------------------------------------------- */
  const paciente = {
    rol: 'paciente',
    prefijo: 'P',
    titulo: 'Encuesta para personas con miastenia gravis generalizada',
    subtitulo: 'Versión autoaplicada para pacientes · v16-oct-2026',
    tiempo: '40 a 60 minutos',
    bienvenida: 'Gracias por su interés en contarnos cómo ha sido su experiencia con la miastenia gravis. Esta encuesta es para personas adultas con miastenia gravis generalizada.',
    consentimiento: {
      trata: 'Lo invitamos a responder una encuesta sobre cómo es vivir con miastenia gravis generalizada (gMG) y recibir atención en Colombia, desde los primeros síntomas hasta hoy. También queremos conocer cómo la enfermedad afecta el trabajo o el estudio y cuánto dinero y tiempo les cuesta a las personas con gMG y a sus cuidadores. Con las respuestas se describirá la carga real de la enfermedad en el país, para que quienes toman decisiones en salud la conozcan desde la voz de los pacientes.',
      pide: [
        'Responder esta encuesta usted mismo(a), a su propio ritmo. Tarda aproximadamente 40 a 60 minutos. Puede hacer pausas y continuar después.',
        'Las preguntas tratan de su experiencia con el diagnóstico, el tratamiento y el acceso a los medicamentos, de cómo la enfermedad ha afectado su trabajo o estudio y de los gastos que ha tenido.',
        'No necesita facturas ni cifras exactas: un cálculo aproximado es suficiente.',
        'No se harán exámenes ni procedimientos, y no se cambiará ningún tratamiento.',
        'Si su cuidador principal también participa, responderá su propia encuesta por separado. Sus respuestas no se compartirán entre ustedes.'
      ],
      riesgos: 'El riesgo es mínimo. Hablar de la enfermedad, del trabajo o del dinero puede cansarlo(a) o despertar emociones. Puede saltarse cualquier pregunta, parar cuando quiera o no enviar la encuesta. Si lo necesita, pida orientación en apoyo psicológico a través de su EPS. Si mientras responde siente que aumenta la debilidad o le cuesta respirar o tragar, deje la encuesta y busque atención de urgencias.',
      beneficios: 'No recibirá un beneficio económico ni clínico directo. Su participación puede ayudar a que se entienda mejor la carga de la gMG en Colombia y a mejorar el acceso y la atención de otras personas.',
      voluntario: 'Su participación es completamente voluntaria. Puede no participar o retirarse en cualquier momento, sin dar explicaciones y sin que esto afecte la atención médica que recibe, la entrega de medicamentos ni ningún trámite con su EPS o IPS, hoy ni en el futuro. Si se retira, sus respuestas podrán eliminarse mientras no hayan sido anonimizadas ni agregadas.',
      decision: [
        'Tengo 18 años o más.',
        'Un médico me ha dicho que tengo miastenia gravis generalizada.',
        'He leído (o me han leído) este documento y he podido hacer preguntas.',
        'Acepto participar voluntariamente en esta encuesta y que mis respuestas se usen como se explicó.',
        'Autorizo que me contacten más adelante para confirmar o ampliar mis respuestas (opcional).'
      ]
    },
    partes: [
      {
        titulo: 'Sobre usted', min: 5,
        preguntas: [
          { n: 1, q: '¿Qué edad tiene?', items: [{ t: 'nums', k: 'P01', f: [['', 'Edad', 'años', { min: 18, max: 110 }]] }] },
          { n: 2, q: '¿Cuál es su sexo?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P02', o: SEXO }] },
          { n: 3, q: '¿Dónde vive?', items: [{ t: 'place', k: 'P03' }] },
          { n: 4, q: '¿Cuál es su afiliación al sistema de salud?', items: [
            { t: 'single', k: 'P04_regimen', label: 'Régimen', o: ['Régimen contributivo', 'Régimen subsidiado', 'Régimen especial o de excepción (Fuerzas Militares, magisterio, otros)', 'Sin afiliación', 'No sé'] },
            { t: 'texts', k: 'P04', f: [['eps', 'Nombre de su EPS']] }
          ] },
          { n: 5, q: '¿Cuál es el nivel de estudios más alto que ha alcanzado?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P05', o: ESTUDIOS }] },
          { n: 6, q: '¿Con quién vive?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P06', o: ['Solo(a)', 'Pareja', 'Hijos', 'Padres', 'Otros familiares', 'Otras personas', 'Persona contratada para ayudarme'], excl: ['Solo(a)'] }] },
          { n: 7, q: '¿A qué se dedica o se dedicaba cuando empezó la enfermedad?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P07', o: ['Empleado(a) con contrato', 'Independiente', 'Trabajo informal', 'Oficios del hogar o cuidado de personas', 'Estudiante', 'Pensionado(a)', 'Sin trabajo'], otro: true }] },
          { n: 8, q: '¿En qué año tuvo los primeros síntomas y en qué año le dijeron que tenía miastenia gravis?', items: [{ t: 'nums', k: 'P08', f: [['sintomas', 'Año de los primeros síntomas', '(aprox.)', anio], ['dx', 'Año del diagnóstico', '(aprox.)', anio]] }] }
        ]
      },
      {
        titulo: 'El camino hasta el diagnóstico', min: 10,
        intro: 'Piense en el tiempo desde que notó los primeros síntomas hasta que le dijeron que tenía miastenia gravis.',
        preguntas: [
          { n: 9, q: '¿Cuáles fueron los primeros síntomas que notó?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P09', o: ['Párpados caídos', 'Visión doble', 'Debilidad en brazos o piernas', 'Dificultad para tragar o masticar', 'Voz que se apaga o nasal', 'Dificultad para respirar', 'Cansancio que mejora con el reposo', 'Dificultad para sostener la cabeza'], otro: true }] },
          { n: 10, q: '¿A qué atribuyó esos síntomas en ese momento?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P10', o: ['Estrés o nervios', 'Cansancio o exceso de trabajo', 'La edad', 'Un problema de los ojos', 'Otra enfermedad que ya tenía', 'No sabía a qué se debían'], otro: true }] },
          { n: 11, q: '¿Cuánto tiempo pasó entre los primeros síntomas y la primera consulta médica por ellos?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P11', o: ['Menos de 1 semana', 'De 1 semana a 1 mes', 'De 1 a 6 meses', 'Más de 6 meses a 1 año', 'Más de 1 año'] }] },
          { n: 12, q: 'Si esperó para consultar, ¿por qué?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P12', o: ['Pensé que se pasaría solo', 'No pensé que fuera grave', 'No tenía dinero o tiempo', 'Dificultad para conseguir cita', 'Miedo al diagnóstico', 'No esperé: consulté de inmediato'], excl: ['No esperé: consulté de inmediato'], otro: true }] },
          { n: 13, q: '¿Quién fue el primer profesional que lo atendió por estos síntomas?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P13', o: ['Médico general', 'Oftalmólogo', 'Médico de urgencias', 'Médico internista', 'Neurólogo', 'Otro especialista', 'Medicina alternativa u otro', 'No recuerdo'] }] },
          { n: 14, q: 'Antes de llegar a neurología, ¿con cuántos médicos o especialistas consultó y cuántos exámenes le hicieron hasta que alguien le dio una explicación?', items: [{ t: 'nums', k: 'P14', f: [['medicos', 'Médicos o especialistas', 'número'], ['examenes', 'Exámenes', 'número']] }] },
          { n: 15, q: '¿Le dieron antes algún diagnóstico distinto al de miastenia gravis?', items: [
            { t: 'single', k: 'P15', o: ['No', 'Sí', 'No recuerdo'] },
            { t: 'texts', k: 'P15', f: [['cual', 'Si fue así, ¿cuál?']], showIf: r => r.P15 === 'Sí' }
          ] },
          { n: 16, q: 'Esas consultas y exámenes antes del diagnóstico, ¿quién los pagó?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P16', o: ['La EPS cubrió todo', 'Pagué una parte yo mismo(a)', 'Pagué todo yo mismo(a)', 'No recuerdo'] }] },
          { n: 17, q: 'Más o menos, ¿cuánto pagó de su bolsillo hasta tener el diagnóstico?', s: true, note: OPCIONAL, items: [{ t: 'nums', k: 'P17', f: [['', 'Total aproximado', 'pesos']] }] },
          { n: 18, q: '¿Cómo consiguió la cita con neurología?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P18', o: ['La EPS la asignó directamente', 'Tuve que pedir autorización o remisión', 'Pagué la consulta particular', 'Fui a urgencias y me vio un especialista', 'Me ayudó una fundación, asociación u otra persona', 'Presenté tutela, derecho de petición o queja'], otro: true }] },
          { n: 19, q: '¿Cuánto tiempo pasó entre la orden de remisión a neurología y la primera cita?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P19', o: ['Menos de 1 semana', 'De 1 a 4 semanas', 'De 1 a 3 meses', 'Más de 3 meses', 'No recuerdo'] }] },
          { n: 20, q: 'Pensando en el día de su primera consulta con neurología, desde que salió de su casa hasta que terminó, ¿cuánto tiempo le tomó y cuánto costó?', s: true, note: OPCIONAL, items: [{ t: 'nums', k: 'P20', f: [['horas', 'Tiempo total', 'horas'], ['transporte', 'Transporte', 'pesos'], ['comida', 'Comida y alojamiento', 'pesos'], ['acompanante', 'Gasto del acompañante', 'pesos']] }] },
          { n: 21, q: 'Para confirmar la enfermedad, ¿qué le pasó con cada uno de estos exámenes?', items: [{ t: 'grid', k: 'P21', rows: ['Anticuerpos en sangre (anti-receptor de acetilcolina, anti-MuSK)', 'Electromiografía o estimulación repetitiva', 'Tomografía o resonancia de tórax (timo)', 'Otras pruebas'], cols: ['Me lo hicieron sin demora', 'Me lo hicieron con demora o tras varios intentos', 'Me lo ordenaron y no me lo hicieron', 'No me lo ordenaron / no sé'] }] },
          { n: 22, q: '¿Quién le dijo que tenía miastenia gravis?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P22', o: ['Neurólogo', 'Otro especialista', 'Médico general', 'Médico de urgencias', 'Otro'] }] },
          { n: 23, q: 'En ese momento, ¿le explicaron claramente…?', items: [{ t: 'grid', k: 'P23', rows: ['Qué es la enfermedad', 'El resultado de sus anticuerpos u otros exámenes', 'Cómo puede evolucionar', 'Las señales de alarma', 'Los medicamentos que debe evitar'], cols: CLARIDAD }] }
        ]
      },
      {
        titulo: 'Su tratamiento y el acceso a medicamentos', min: 12,
        preguntas: [
          { n: 24, q: '¿Cuáles de estos tratamientos ha recibido desde el diagnóstico?', items: [
            { t: 'grid', k: 'P24', rows: ['Piridostigmina', 'Corticoides (por ejemplo, prednisona)', 'Inmunosupresores (azatioprina, micofenolato, otros)', 'Inmunoglobulina intravenosa', 'Plasmaféresis', 'Cirugía del timo (timectomía)', 'Rituximab', 'Medicamentos biológicos o terapias dirigidas más recientes (segunda línea)', 'Otro'], cols: ['Lo recibo hoy', 'Lo recibí antes', 'Nunca lo he recibido', 'No sé'] },
            { t: 'texts', k: 'P24', f: [['otro', 'Si marcó “Otro”, ¿cuál?']] }
          ] },
          { n: 25, q: '¿Hace cuánto toma (o tomó) corticoides?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P25', o: ['Nunca los he tomado', 'Menos de 3 meses', 'De 3 a 12 meses', 'Más de 1 año'], salto: { 'Nunca los he tomado': 27 } }] },
          { n: 26, q: '¿Qué efectos ha notado con los corticoides?', note: 'Solo si tomó corticoides. Puede marcar varias respuestas.', showIf: r => r.P25 !== 'Nunca los he tomado', items: [{ t: 'multi', k: 'P26', o: ['Aumento de peso o cara redonda', 'Mal dormir', 'Cambios de ánimo', 'Glucosa alta o diabetes', 'Presión alta', 'Dolor de estómago o gastritis', 'Pérdida de masa ósea o fracturas', 'Ninguno'], excl: ['Ninguno'], otro: true }] },
          { n: 27, q: '¿Le recomendaron o le hicieron cirugía del timo?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P27', o: ['No me hablaron de esa cirugía', 'Me la recomendaron y no me la hicieron', 'Me la hicieron', 'Me la recomendaron y la estoy esperando'] }] },
          { n: 28, q: '¿Alguna vez dejó de tomar o cambió un medicamento por su cuenta o por indicación médica?', items: [
            { t: 'single', k: 'P28', o: ['No', 'Sí, por indicación médica', 'Sí, por decisión mía', 'Sí, ambas'] },
            { t: 'multi', k: 'P28_porque', label: 'Si respondió “Sí”, ¿por qué?', o: ['Efectos adversos', 'No me hacía efecto', 'No me lo entregaron', 'Costo', 'Olvido', 'Me sentía bien'], otro: true, showIf: r => !!r.P28 && r.P28 !== 'No' }
          ] },
          { n: 29, q: '¿Cómo consigue sus medicamentos cada mes?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P29', o: ['Los entrega la EPS en mi casa', 'Los recojo en la farmacia de la EPS', 'Los compro con mi dinero', 'Los gestiona un familiar o cuidador', 'Me los entrega una fundación'], otro: true }] },
          { n: 30, q: 'En el último año, ¿cuántas veces se quedó sin un medicamento o sin una aplicación? ¿Cuántos días lo pasó en total sin él?', items: [{ t: 'nums', k: 'P30', f: [['veces', 'Veces', 'número'], ['dias', 'Días en total sin medicamento', 'días']] }] },
          { n: 31, q: 'En esos días sin medicamento, ¿qué le pasó?', note: 'Solo si se quedó sin medicamento. Puede marcar varias respuestas.', showIf: r => r.P30_veces !== '0', items: [{ t: 'multi', k: 'P31', o: ['Nada', 'Empeoraron mis síntomas', 'Fui a urgencias', 'Me hospitalizaron', 'Tuve que comprarlo yo mismo(a)'], excl: ['Nada'], otro: true }] },
          { n: 32, q: '¿Recibe medicamentos que se aplican por vena (como la inmunoglobulina)?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P32', o: ['Sí', 'No'], salto: { 'No': 36 } }] },
          { n: 33, q: '¿Dónde se aplican esos medicamentos?', note: 'Puede marcar varias respuestas.', showIf: r => r.P32 !== 'No', items: [{ t: 'multi', k: 'P33', o: ['Hospital o clínica', 'Centro de infusión', 'En mi casa'], otro: true }] },
          { n: 34, q: 'Por cada aplicación, ¿cuánto tiempo toma conseguirla y recibirla (incluido el traslado y la espera)?', showIf: r => r.P32 !== 'No', items: [{ t: 'nums', k: 'P34', f: [['horas', 'Tiempo desde que sale de casa hasta que regresa', 'horas'], ['dias', 'Tiempo entre la orden y la aplicación', 'días']] }] },
          { n: 35, q: '¿Ha necesitado alguno de estos trámites para conseguir un medicamento o una atención?', s: true, note: OPCIONAL, showIf: r => r.P32 !== 'No', items: [{ t: 'grid', k: 'P35', rows: ['Tutela', 'Derecho de petición', 'Queja ante la Superintendencia de Salud'], cols: FRECUENCIA_4 }] },
          { n: 36, q: '¿Cada cuánto lo citan a control con neurología?', items: [
            { t: 'single', k: 'P36_frecuencia', label: 'Frecuencia', o: ['Cada mes o menos', 'Cada 2 a 3 meses', 'Cada 4 a 6 meses', 'Una vez al año o menos', 'No tengo control regular'] },
            { t: 'single', k: 'P36_mismo', label: '¿Lo atiende el mismo médico?', o: ['Siempre el mismo médico', 'Casi siempre el mismo', 'Cada vez uno distinto'] },
            { t: 'nums', k: 'P36', f: [['espera', 'Tiempo de espera para conseguir la cita de control', 'días']] }
          ] },
          { n: 37, q: '¿Alguna vez le han hecho una escala o cuestionario sobre cómo la enfermedad afecta sus actividades diarias?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P37', o: ['Sí', 'No', 'No sé'] }] },
          { n: 38, q: 'Pensando en los últimos 7 días, marque qué tanto le ha afectado la enfermedad en cada actividad (0 = nada; 3 = muchísimo).', fuente: 'mgadl', items: [{ t: 'grid', k: 'P38', rows: ['Hablar', 'Masticar', 'Tragar', 'Respirar', 'Cepillarse los dientes o peinarse', 'Levantarse de una silla', 'Ver doble', 'Mantener los párpados abiertos'], cols: ['0', '1', '2', '3'] }] },
          { n: 39, q: 'En el último año, su enfermedad ha estado…', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P39', o: ['Mejor', 'Igual', 'Peor', 'No sé'] }] },
          { n: 40, q: 'Además de neurología, ¿qué otros servicios usa por la enfermedad?', items: [
            { t: 'grid', k: 'P40', rows: ['Fisioterapia o rehabilitación', 'Fonoaudiología', 'Psicología o psiquiatría', 'Nutrición', 'Oftalmología', 'Neumología', 'Endocrinología', 'Otro'], cols: ['Lo uso y lo consigo', 'Lo uso con dificultad', 'Lo necesito y no lo consigo', 'No lo necesito'] },
            { t: 'texts', k: 'P40', f: [['otro', 'Si marcó “Otro”, ¿cuál?']] }
          ] },
          { n: 41, q: '¿Tiene otras enfermedades además de la miastenia?', s: true, note: OPCIONAL + ' Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P41', o: ['Hipertensión', 'Diabetes', 'Enfermedad de tiroides', 'Otra enfermedad autoinmune', 'Osteoporosis', 'Depresión o ansiedad', 'Enfermedad del corazón o pulmón', 'Ninguna'], excl: ['Ninguna'], otro: true }] }
        ]
      },
      {
        titulo: 'Crisis y hospitalizaciones', min: 8,
        preguntas: [
          { n: 42, q: 'En los últimos 12 meses, ¿estuvo hospitalizado(a) por la miastenia?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P42', o: ['Sí', 'No'], salto: { 'No': 47 } }] },
          { n: 43, q: 'Pensando en esas hospitalizaciones…', showIf: r => r.P42 !== 'No', items: [
            { t: 'nums', k: 'P43', f: [['n', 'Número de hospitalizaciones', 'veces'], ['dias', 'Días hospitalizado en total', 'días']] },
            { t: 'single', k: 'P43_uci', label: '¿Estuvo en UCI?', o: ['No', 'Sí'] },
            { t: 'single', k: 'P43_respirador', label: '¿Necesitó respirador?', o: ['No', 'Sí'] },
            { t: 'multi', k: 'P43_tratamiento', label: '¿Qué tratamiento le dieron?', o: ['Inmunoglobulina', 'Plasmaféresis', 'Corticoides', 'Otro', 'No sé'], excl: ['No sé'] }
          ] },
          { n: 44, q: 'Desde que llegó a urgencias en la última crisis, ¿cuánto tardó en recibir el tratamiento adecuado?', note: 'Marque una sola respuesta.', showIf: r => r.P42 !== 'No', items: [{ t: 'single', k: 'P44', o: ['Menos de 6 horas', 'De 6 a 24 horas', 'De 1 a 3 días', 'Más de 3 días', 'No recuerdo'] }] },
          { n: 45, q: 'En esa crisis, ¿tuvieron que trasladarlo a otra institución?', note: 'Marque una sola respuesta.', showIf: r => r.P42 !== 'No', items: [{ t: 'single', k: 'P45', o: ['Sí', 'No', 'No recuerdo'] }] },
          { n: 46, q: 'Después de salir del hospital…', showIf: r => r.P42 !== 'No', items: [
            { t: 'single', k: 'P46_seguimiento', label: 'Seguimiento', o: ['Tuve control en los primeros 15 días', 'Tuve control después de 15 días', 'No me hicieron seguimiento'] },
            { t: 'single', k: 'P46_recaida', label: '¿Volvió a ponerse mal?', o: ['No', 'Sí, dentro de los 3 meses siguientes', 'Sí, después de 3 meses'] }
          ] },
          { n: 47, q: 'En los últimos 12 meses, ¿cuántas veces fue a urgencias por la miastenia sin quedar hospitalizado(a)?', items: [{ t: 'nums', k: 'P47', f: [['', 'Visitas a urgencias', 'veces']] }] },
          { n: 48, q: 'Si hoy se pusiera muy mal en casa…', items: [
            { t: 'single', k: 'P48_sabe', label: '¿Sabe qué hacer?', o: ['Sí, sé qué hacer y a dónde ir', 'Tengo una idea', 'No sé qué hacer'] },
            { t: 'single', k: 'P48_tarjeta', label: '¿Tiene un plan o una tarjeta que lo identifique como paciente con miastenia?', o: ['Sí', 'No'] }
          ] },
          { n: 49, q: '¿Alguna vez le hablaron de otras opciones de tratamiento más nuevas o de segunda línea?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P49', o: ['Nadie me ha hablado de eso', 'Me hablaron y no se solicitó', 'Se solicitó y está en trámite', 'Se solicitó y fue aprobada', 'Se solicitó y fue negada'] }] },
          { n: 50, q: '¿Ha cambiado de tratamiento por alguna de estas razones?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P50', o: ['Falta de respuesta', 'Efectos adversos', 'La EPS o el operador lo cambió', 'No lo he cambiado'], excl: ['No lo he cambiado'], otro: true }] },
          { n: 51, q: 'Cuando lo remiten a otro sitio (especialista, laboratorio, farmacia, urgencias)…', items: [
            { t: 'multi', k: 'P51_explica', label: '¿Quién le explica qué debe hacer?', o: ['Un profesional de salud', 'Un administrativo', 'Nadie; lo averiguo yo', 'Un familiar'], excl: ['Nadie; lo averiguo yo'] },
            { t: 'multi', k: 'P51_lleva', label: '¿Qué información lleva consigo?', o: ['Resumen de mi historia clínica', 'Órdenes y fórmulas', 'Resultados de exámenes', 'Tarjeta o carné de paciente', 'Nada; empiezo de cero cada vez'], excl: ['Nada; empiezo de cero cada vez'] }
          ] }
        ]
      },
      {
        titulo: 'Su vida cotidiana y bienestar', min: 5,
        preguntas: [
          { n: 52, q: '¿Qué tanto ha cambiado la enfermedad estas áreas de su vida?', items: [{ t: 'grid', k: 'P52', rows: ['Actividades del hogar', 'Cuidado personal (bañarse, vestirse, comer)', 'Moverse o conducir', 'Vida social y familiar', 'Pareja o vida íntima', 'Ocio, deporte o viajes', 'Sueño y descanso'], cols: ['Nada', 'Poco', 'Bastante', 'Mucho'] }] },
          { n: 53, q: '¿Quién lo acompaña o lo cuida?', items: [
            { t: 'multi', k: 'P53', label: 'Personas', o: ['Pareja', 'Hijo(a)', 'Padre o madre', 'Otro familiar', 'Persona contratada', 'Nadie'], excl: ['Nadie'] },
            { t: 'nums', k: 'P53', f: [['horas', 'Horas de ayuda por semana en total', 'horas']] }
          ] },
          { n: 54, q: 'Desde el diagnóstico, ¿con qué frecuencia ha sentido…?', s: true, note: OPCIONAL, items: [{ t: 'grid', k: 'P54', rows: ['Tristeza', 'Preocupación o ansiedad', 'Frustración o rabia', 'Soledad'], cols: ['Nunca', 'Algunas veces', 'Con frecuencia', 'Casi siempre'] }] },
          { n: 55, q: '¿Ha recibido algún tipo de apoyo psicológico por la enfermedad?', s: true, note: OPCIONAL + ' Marque una sola respuesta.', items: [{ t: 'single', k: 'P55', o: ['Sí, y me ha servido', 'Sí, pero no me ha servido', 'No, y no lo he necesitado', 'No, y lo he necesitado'] }] }
        ]
      },
      {
        titulo: 'Trabajo, estudio y tiempo perdido', min: 8,
        intro: 'Las preguntas marcadas como sensibles puede dejarlas en blanco. Un cálculo aproximado es suficiente.',
        preguntas: [
          { n: 56, q: '¿Cuál era su situación antes del diagnóstico?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P56', o: ['Trabajaba', 'Estudiaba', 'Oficios del hogar o cuidado de personas', 'Estaba pensionado(a)', 'No trabajaba ni estudiaba'] }] },
          { n: 57, q: '¿Cuál es su situación hoy?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P57', o: ['Trabajo', 'Estudio', 'Estoy incapacitado(a)', 'Estoy pensionado(a)', 'Dejé de trabajar o estudiar por la enfermedad', 'Oficios del hogar o cuidado de personas', 'No trabajo ni estudio por otra razón'] }] },
          { n: 58, q: 'Horas que trabaja o trabajaba por semana', note: 'Si no trabaja ni trabajaba, deje en blanco.', items: [{ t: 'nums', k: 'P58', f: [['antes', 'Antes del diagnóstico', 'horas por semana', { min: 0, max: 112 }], ['hoy', 'Hoy', 'horas por semana', { min: 0, max: 112 }]] }] },
          { n: 59, q: 'Pensando en el último mes (las últimas cuatro semanas), ¿cuántos días no pudo ir a trabajar, estudiar o hacer sus actividades habituales por la miastenia?', note: 'Si no trabaja ni estudia, cuente los días en que no pudo hacer lo que tenía previsto (oficios, trámites, cuidar niños).', items: [{ t: 'nums', k: 'P59', f: [['dias', 'Días completos', 'días', { min: 0, max: 31 }], ['medios', 'Medios días, llegadas tarde o salidas antes de hora', 'veces']] }] },
          { n: 60, q: 'En los últimos 12 meses, ¿cuántos días en total estuvo incapacitado(a) o dejó de trabajar o estudiar por la enfermedad?', items: [{ t: 'nums', k: 'P60', f: [['dias', 'Días en total', 'días', { min: 0, max: 366 }], ['incapacidades', 'Número de incapacidades', 'incapacidades']] }] },
          { n: 61, q: 'De esos días en los últimos 12 meses, ¿cuántos fueron por…?', items: [{ t: 'nums', k: 'P61', f: [['sintomas', 'Los síntomas', 'días'], ['tramites', 'Citas, exámenes y trámites con la EPS, IPS o farmacia', 'días'], ['aplicaciones', 'Aplicaciones intravenosas o plasmaféresis (con traslado)', 'días'], ['crisis', 'Hospitalización o crisis', 'días']] }] },
          { n: 62, q: 'Los días en que sí trabaja o estudia, ¿cómo le afecta la enfermedad? Si un día normal sin enfermedad su rendimiento fuera 100…', items: [
            { t: 'nums', k: 'P62', f: [['malo', 'En un día malo rindo', 'de 100', de100], ['bueno', 'En un día bueno rindo', 'de 100', de100]] },
            { t: 'multi', k: 'P62_cambios', label: '¿Qué ha tenido que cambiar?', o: ['Reduje mis horas', 'Cambié de tareas', 'Necesito pausas o siestas', 'Trabajo desde casa', 'Evito turnos, conducir o trabajo de pie', 'Ninguno de estos cambios'], excl: ['Ninguno de estos cambios'] }
          ] },
          { n: 63, q: 'Si estudia o estudiaba cuando empezó la enfermedad, ¿qué le ha pasado?', note: 'Solo si estudia o estudiaba. Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P63', o: ['Faltó a clases', 'Aplazó semestres', 'Repitió materias', 'Cambió de programa', 'Ninguna de las anteriores', 'No aplica'], excl: ['Ninguna de las anteriores', 'No aplica'] }] },
          { n: 64, q: 'Si se encarga de la casa o de cuidar a otras personas, ¿qué tareas ha tenido que dejar de hacer o pagar para que otro las haga?', note: 'Solo si corresponde. Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P64', o: ['Oficios de la casa', 'Compras', 'Cuidado de hijos', 'Cuidado de adultos mayores', 'Ninguna de las anteriores', 'No aplica'], excl: ['Ninguna de las anteriores', 'No aplica'] }] },
          { n: 65, q: '¿Ha dejado de trabajar, cambiado de empleo, renunciado a un ascenso o cambiado sus planes de estudio por la enfermedad?', s: true, note: OPCIONAL, items: [
            { t: 'multi', k: 'P65', o: ['Renuncié', 'Me despidieron o no me renovaron el contrato', 'Me retiré antes de tiempo o me pensioné por invalidez', 'Cambié de empleo u oficio', 'Rechacé un ascenso o una oportunidad', 'Cambié mis planes de estudio', 'Ninguna de las anteriores'], excl: ['Ninguna de las anteriores'] },
            { t: 'nums', k: 'P65', f: [['anio', 'Año en que ocurrió (si aplica)', '', anio]] }
          ] },
          { n: 66, q: 'Cuando estuvo incapacitado(a), ¿le pagaron esos días?', s: true, note: OPCIONAL, items: [
            { t: 'single', k: 'P66_quien', label: '¿Quién pagó?', o: ['Mi empleador', 'La EPS', 'Ambos', 'Nadie', 'No estuve incapacitado(a)', 'No sé'] },
            { t: 'single', k: 'P66_parte', label: '¿Qué parte del salario recibió?', o: ['100 % del salario', 'Entre 50 % y 99 %', 'Menos del 50 %', 'Nada', 'No sé'], showIf: r => r.P66_quien !== 'No estuve incapacitado(a)' }
          ] },
          { n: 67, q: 'En su trabajo o estudio…', s: true, note: OPCIONAL, items: [
            { t: 'single', k: 'P67_saben', label: '¿Saben de su enfermedad?', o: ['Sí, todos lo saben', 'Sí, algunos', 'No lo saben'] },
            { t: 'single', k: 'P67_experiencia', label: '¿Cómo ha sido la experiencia?', o: ['Me han apoyado', 'Les es indiferente', 'He tenido dificultades o me han juzgado', 'No aplica'] }
          ] },
          { n: 68, q: 'Con estos cambios, ¿cómo han variado los ingresos de su hogar?', s: true, note: OPCIONAL, items: [
            { t: 'single', k: 'P68_cambio', label: 'Cambio', o: ['Disminuyeron mucho', 'Disminuyeron algo', 'Siguen igual', 'Aumentaron'] },
            { t: 'single', k: 'P68_aporta', label: '¿Quién aporta hoy el ingreso principal?', o: ['Yo', 'Mi pareja', 'Otro familiar', 'Pensión o subsidio'] },
            { t: 'single', k: 'P68_ingreso', label: 'Ingreso mensual actual del hogar', o: INGRESO_HOGAR }
          ] }
        ]
      },
      {
        titulo: 'Gastos y economía', min: 8,
        intro: 'Escriba cuánto paga usted o su hogar por la enfermedad. Deje en blanco lo que no aplique. Si no recuerda la cifra, dé un cálculo aproximado.',
        preguntas: [
          { n: 69, q: 'Anote sus gastos por la enfermedad:', items: [{ t: 'costs', k: 'P69' }] },
          { n: 70, q: 'En total, ¿cuánto gasta de su bolsillo por la enfermedad en un mes típico y en un mes malo?', s: true, note: OPCIONAL, items: [{ t: 'nums', k: 'P70', f: [['tipico', 'Mes típico', 'pesos'], ['malo', 'Mes malo (crisis, hospitalización)', 'pesos']] }] },
          { n: 71, q: 'En los últimos 12 meses, ¿cuántos meses malos tuvo (con crisis, hospitalización o muchas consultas de urgencia)?', items: [{ t: 'nums', k: 'P71', f: [['', 'Meses malos', 'meses', { min: 0, max: 12 }]] }] },
          { n: 72, q: 'El cubrimiento de su EPS (o seguro) a los costos de su enfermedad le ha parecido…', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'P72', o: ['Adecuado', 'Aceptable', 'Insuficiente', 'Inexistente', 'No sé'] }] },
          { n: 73, q: '¿Qué es lo que más se queda sin cubrir?', note: OPCIONAL, items: [{ t: 'long', k: 'P73' }] },
          { n: 74, q: 'Desde el diagnóstico, ¿cada una de estas situaciones ha sido para usted una preocupación grande, alguna preocupación o ninguna preocupación?', items: [{ t: 'grid', k: 'P74', rows: PREOCUPACIONES_FILAS, cols: PREOCUPACION }] },
          { n: 75, q: 'En el último año, ¿cuántas veces dejó de hacer algo de esto por falta de dinero o por lo que costaba llegar?', s: true, note: OPCIONAL, items: [{ t: 'grid', k: 'P75', rows: ['Faltar a una cita', 'No hacerse un examen', 'No reclamar un medicamento', 'Reducir o espaciar la dosis para que rindiera', 'Ir a urgencias por haber esperado'], cols: FRECUENCIA_4 }] },
          { n: 76, q: 'Cuando ha tenido un gasto grande por la enfermedad, ¿cómo lo ha cubierto?', s: true, note: OPCIONAL + ' Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P76', o: GASTO_GRANDE, excl: ['No he tenido gastos grandes'], otro: true }] },
          { n: 77, q: '¿Ha recibido alguna ayuda económica o apoyo?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'P77', o: AYUDAS, excl: ['Ninguna'], otro: true }] },
          { n: 78, q: 'Si pidió alguna ayuda, ¿cuánto tardó el trámite?', note: 'Solo si hizo algún trámite. Marque una sola respuesta.', items: [{ t: 'single', k: 'P78', o: ['Menos de 1 mes', 'De 1 a 3 meses', 'De 3 a 6 meses', 'Más de 6 meses', 'No la he pedido'] }] },
          { n: 79, q: 'Si pudiera cambiar una sola cosa para aliviar la carga económica o laboral de la miastenia, ¿cuál sería?', note: OPCIONAL, items: [{ t: 'long', k: 'P79' }] }
        ]
      },
      {
        titulo: 'Para terminar', min: 5,
        intro: 'Estas preguntas son abiertas y opcionales. Escriba lo que quiera, con sus propias palabras.',
        preguntas: [
          { n: 80, q: 'De todo lo que ha vivido con la enfermedad, ¿cuáles han sido los tres momentos más difíciles?', note: OPCIONAL, items: [{ t: 'long', k: 'P80' }] },
          { n: 81, q: '¿Hubo algún momento en que sintió que lo atendieron bien de verdad? Cuéntenos cuál.', note: OPCIONAL, items: [{ t: 'long', k: 'P81' }] },
          { n: 82, q: 'Si pudiera hablarle hoy a la EPS, a la clínica o al Ministerio de Salud, ¿qué les diría sobre la atención de la miastenia?', note: OPCIONAL, items: [{ t: 'long', k: 'P82' }] },
          { n: 83, q: '¿Hay algo importante que no le preguntamos y que crea que debemos saber?', note: OPCIONAL, items: [{ t: 'long', k: 'P83' }] }
        ]
      }
    ]
  };

  /* ---------------------------------------------------------------- */
  const ZARIT = [
    '¿Piensa que su familiar le pide más ayuda de la que realmente necesita?',
    '¿Piensa que debido al tiempo que dedica a su familiar no tiene suficiente tiempo para Vd.?',
    '¿Se siente agobiado por intentar compatibilizar el cuidado de su familiar con otras responsabilidades (trabajo, familia)?',
    '¿Siente vergüenza por la conducta de su familiar?',
    '¿Se siente enfadado cuando está cerca de su familiar?',
    '¿Piensa que el cuidar de su familiar afecta negativamente la relación que usted tiene con otros miembros de su familia?',
    '¿Tiene miedo por el futuro de su familiar?',
    '¿Piensa que su familiar depende de Vd.?',
    '¿Se siente tenso cuando está cerca de su familiar?',
    '¿Piensa que su salud ha empeorado debido a tener que cuidar de su familiar?',
    '¿Piensa que no tiene tanta intimidad como le gustaría debido a tener que cuidar de su familiar?',
    '¿Piensa que su vida social se ha visto afectada negativamente por tener que cuidar a su familiar?',
    '¿Se siente incómodo por distanciarse de sus amistades debido a tener que cuidar de su familiar?',
    '¿Piensa que su familiar le considera a usted la única persona que le puede cuidar?',
    '¿Piensa que no tiene suficientes ingresos económicos para los gastos de cuidar a su familiar, además de sus otros gastos?',
    '¿Piensa que no será capaz de cuidar a su familiar por mucho más tiempo?',
    '¿Siente que ha perdido el control de su vida desde que comenzó la enfermedad de su familiar?',
    '¿Desearía poder dejar el cuidado de su familiar a otra persona?',
    '¿Se siente indeciso sobre qué hacer con su familiar?',
    '¿Piensa que debería hacer más por su familiar?',
    '¿Piensa que podría cuidar mejor a su familiar?',
    'Globalmente, ¿qué grado de "carga" experimenta por el hecho de cuidar a su familiar?'
  ];

  const cuidador = {
    rol: 'cuidador',
    prefijo: 'C',
    titulo: 'Encuesta para cuidadores de personas con miastenia gravis generalizada',
    subtitulo: 'Versión autoaplicada para cuidadores · v16-oct-2026',
    tiempo: '30 a 45 minutos',
    bienvenida: 'Gracias por su interés en contarnos cómo ha sido su experiencia cuidando a una persona con miastenia gravis. Esta encuesta es para cuidadores principales de personas adultas con miastenia gravis generalizada.',
    consentimiento: {
      trata: 'Lo invitamos a responder una encuesta sobre cómo es cuidar a una persona con miastenia gravis generalizada (gMG) en Colombia. Queremos conocer el recorrido de su familiar visto desde quien lo acompaña y cómo cuidar afecta su trabajo, su tiempo y sus gastos. Con las respuestas se describirá la carga real de la enfermedad en el país, para que quienes toman decisiones en salud la conozcan desde la voz de pacientes y cuidadores.',
      pide: [
        'Responder esta encuesta usted mismo(a), a su propio ritmo. Tarda aproximadamente 30 a 45 minutos. Puede hacer pausas y continuar después.',
        'Las preguntas tratan de su experiencia con el diagnóstico, el tratamiento y el acceso a los medicamentos, de su papel como cuidador, de su trabajo y de los gastos que usted asume.',
        'No necesita facturas ni cifras exactas: un cálculo aproximado es suficiente.',
        'No se harán exámenes ni procedimientos, y no se cambiará ningún tratamiento.',
        'Si su familiar con miastenia también participa, responderá su propia encuesta por separado. Sus respuestas no se compartirán entre ustedes.'
      ],
      riesgos: 'El riesgo es mínimo. Hablar de la enfermedad, del cuidado, del trabajo o del dinero puede cansarlo(a) o despertar emociones. Puede saltarse cualquier pregunta, parar cuando quiera o no enviar la encuesta. Si lo necesita, pida orientación en apoyo psicológico a través de su EPS.',
      beneficios: 'No recibirá un beneficio económico ni clínico directo. Su participación puede ayudar a que se entienda mejor la carga de la gMG en Colombia, incluida la que asumen los cuidadores, y a mejorar el acceso y la atención de otras personas.',
      voluntario: 'Su participación es completamente voluntaria. Puede no participar o retirarse en cualquier momento, sin dar explicaciones y sin que esto afecte la atención médica de su familiar, la entrega de medicamentos ni ningún trámite con su EPS o IPS, hoy ni en el futuro. Si se retira, sus respuestas podrán eliminarse mientras no hayan sido anonimizadas ni agregadas.',
      decision: [
        'Tengo 18 años o más.',
        'Cuido (o he cuidado en el último año) a una persona con miastenia gravis generalizada, sin recibir un pago por hacerlo.',
        'He leído (o me han leído) este documento y he podido hacer preguntas.',
        'Acepto participar voluntariamente en esta encuesta y que mis respuestas se usen como se explicó.',
        'Autorizo que me contacten más adelante para confirmar o ampliar mis respuestas (opcional).'
      ]
    },
    partes: [
      {
        titulo: 'Sobre usted y su familiar', min: 5,
        intro: 'En esta encuesta, “su familiar” o “la persona que cuida” es la persona con miastenia gravis a quien usted acompaña.',
        preguntas: [
          { n: 1, q: '¿Qué edad tiene?', items: [{ t: 'nums', k: 'C01', f: [['', 'Su edad', 'años', { min: 18, max: 110 }]] }] },
          { n: 2, q: '¿Cuál es su sexo?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C02', o: SEXO }] },
          { n: 3, q: '¿Dónde vive?', items: [{ t: 'place', k: 'C03' }] },
          { n: 4, q: '¿Cuál es su parentesco con la persona que cuida?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C04', o: ['Pareja', 'Hijo(a)', 'Padre o madre', 'Hermano(a)', 'Otro familiar', 'Amigo(a) u otra persona'] }] },
          { n: 5, q: '¿Vive con la persona que cuida?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C05', o: ['Sí', 'No'] }] },
          { n: 6, q: '¿Cuál es el nivel de estudios más alto que ha alcanzado?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C06', o: ESTUDIOS }] },
          { n: 7, q: '¿Hace cuánto tiempo cuida a su familiar con miastenia y en qué año le diagnosticaron la enfermedad?', items: [{ t: 'nums', k: 'C07', f: [['anios', 'Tiempo cuidándolo(a)', 'años'], ['dx', 'Año del diagnóstico de su familiar', '(aprox.)', anio]] }] },
          { n: 8, q: 'Su familiar tiene cobertura de salud en el régimen…', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C08', o: ['Contributivo', 'Subsidiado', 'Especial o de excepción', 'Sin afiliación', 'No sé'] }] }
        ]
      },
      {
        titulo: 'Su papel como cuidador(a)', min: 6,
        preguntas: [
          { n: 9, q: '¿Cómo llegó a ser la persona que cuida a su familiar?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C09', o: ['Fue una decisión mía', 'Nadie más podía hacerlo', 'Me lo pidió la familia o el paciente', 'Ocurrió poco a poco', 'Otra razón'] }] },
          { n: 10, q: '¿Cuenta con otras personas que también ayuden a cuidarlo(a)?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C10', o: ['Sí, con frecuencia', 'Sí, de vez en cuando', 'No, cuido solo(a)'] }] },
          { n: 11, q: '¿Con qué frecuencia hace usted estas tareas por su familiar?', items: [{ t: 'grid', k: 'C11', rows: ['Dar o gestionar los medicamentos', 'Acompañarlo(a) a citas y exámenes', 'Hacer trámites (autorizaciones, entregas, citas)', 'Acompañarlo(a) a las aplicaciones o infusiones', 'Ayudarle con la alimentación, el aseo o la movilidad', 'Vigilar señales de alarma (respiración, tragar, voz)', 'Apoyo emocional'], cols: ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'] }] },
          { n: 12, q: '¿Cuántas horas dedica al cuidado de su familiar?', items: [{ t: 'nums', k: 'C12', f: [['buena', 'En una semana buena de la enfermedad', 'horas por semana', { min: 0, max: 168 }], ['mala', 'En una semana mala de la enfermedad', 'horas por semana', { min: 0, max: 168 }]] }] }
        ]
      },
      {
        titulo: 'El recorrido de su familiar visto desde su lugar', min: 10,
        preguntas: [
          { n: 13, q: '¿Cuánto tiempo pasó desde los primeros síntomas de su familiar hasta que le dijeron que tenía miastenia gravis?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C13', o: ['Menos de 6 meses', 'De 6 meses a 1 año', 'De 1 a 2 años', 'Más de 2 años', 'No sé / no estaba presente'] }] },
          { n: 14, q: 'Desde que empezó la enfermedad, ¿cuántas veces ha tenido que intervenir usted para que la atención avanzara?', items: [{ t: 'grid', k: 'C14', rows: ['Insistir o llamar para conseguir una cita', 'Reclamar un medicamento o una aplicación', 'Presentar tutela, derecho de petición o queja', 'Buscar otro médico o institución', 'Pagar de su bolsillo para no esperar', 'Llevarlo(a) a urgencias porque no tuvo otra opción'], cols: ['Nunca', 'Una vez', 'Varias veces', 'Muchas veces'] }] },
          { n: 15, q: 'En un mes típico, ¿cuánto tiempo le toman los trámites (autorizaciones, entrega de medicamentos, aplicaciones, citas)?', items: [{ t: 'nums', k: 'C15', f: [['horas', 'Horas dedicadas a trámites', 'horas al mes'], ['viajes', 'Desplazamientos', 'viajes al mes']] }] },
          { n: 16, q: '¿Le explicaron a usted claramente…?', items: [{ t: 'grid', k: 'C16', rows: ['Qué es la enfermedad', 'Cómo cuidar a su familiar', 'Las señales de alarma', 'Los medicamentos que debe evitar'], cols: CLARIDAD }] },
          { n: 17, q: '¿Quién se lo explicó?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'C17', o: ['El neurólogo', 'Otro médico', 'Enfermería', 'Otro familiar', 'Una fundación o asociación de pacientes', 'Internet o redes sociales', 'Nadie'], excl: ['Nadie'], otro: true }] },
          { n: 18, q: 'Si su familiar se pusiera muy mal en casa (dificultad para respirar o tragar, voz que se apaga), ¿sabe qué hacer y a dónde iría?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C18', o: ['Sí, con seguridad', 'Tengo una idea', 'No sé qué hacer'] }] },
          { n: 19, q: 'En los últimos 12 meses, ¿su familiar estuvo hospitalizado por la miastenia?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C19', o: ['Sí', 'No'], salto: { 'No': 21 } }] },
          { n: 20, q: 'Pensando en esas hospitalizaciones…', showIf: r => r.C19 !== 'No', items: [{ t: 'nums', k: 'C20', f: [['n', 'Número de hospitalizaciones', 'veces'], ['noches', 'Noches en que usted acompañó', 'noches']] }] },
          { n: 21, q: '¿Quién se encarga de los medicamentos de su familiar?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C21', o: ['Yo', 'Él o ella misma', 'Otro familiar', 'Entre varios'] }] },
          { n: 22, q: 'En el último año, ¿cuántos días estuvo su familiar sin un medicamento o sin una aplicación?', items: [{ t: 'nums', k: 'C22', f: [['', 'Días sin medicamento', 'días', { min: 0, max: 366 }]] }] },
          { n: 23, q: '¿Su familiar recibe medicamentos que se aplican por vena (como la inmunoglobulina)?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C23', o: ['Sí', 'No'], salto: { 'No': 25 } }] },
          { n: 24, q: 'Para cada aplicación…', showIf: r => r.C23 !== 'No', items: [
            { t: 'single', k: 'C24_lleva', label: '¿Quién lo(la) lleva?', o: ['Yo', 'Otro familiar', 'Una persona contratada', 'Va solo(a)'] },
            { t: 'nums', k: 'C24', f: [['horas', 'Tiempo total (traslado, espera y aplicación)', 'horas']] }
          ] },
          { n: 25, q: '¿Qué apoyo ha recibido usted, como cuidador(a), de la EPS o de la institución?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'C25', o: ['Información o educación', 'Orientación psicológica', 'Apoyo para trámites', 'Transporte', 'Ninguno'], excl: ['Ninguno'], otro: true }] }
        ]
      },
      {
        titulo: 'Cómo le ha afectado cuidar', min: 7,
        preguntas: [
          { n: 26, q: 'Desde que cuida a su familiar, ¿qué tanto han cambiado estas áreas de su vida?', s: true, note: OPCIONAL, items: [{ t: 'grid', k: 'C26', rows: ['Su salud física', 'Su ánimo y tranquilidad', 'Su sueño y descanso', 'Su tiempo libre', 'Sus relaciones con la familia y los amigos', 'Su proyecto personal o de estudio'], cols: ['Nada', 'Poco', 'Moderadamente / Regular', 'Bastante', 'Mucho'] }] },
          { n: 27, q: 'Cuestionario sobre la carga del cuidador', note: 'A continuación, se presenta una lista de afirmaciones, en las cuales se refleja cómo se sienten, a veces, las personas que cuidan a otra persona. Después de leer cada afirmación, debe indicar con qué frecuencia se siente Ud. así: nunca, raramente, algunas veces, bastante a menudo y casi siempre. A la hora de responder piense que no existen respuestas acertadas o equivocadas, sino tan sólo su experiencia.', fuente: 'zarit', items: [{ t: 'grid', k: 'C27', rows: ZARIT, cols: ['Nunca', 'Rara vez', 'Algunas veces', 'Bastantes veces', 'Casi siempre'] }] },
          { n: 28, q: '¿Cómo describiría su salud en general?', s: true, note: OPCIONAL + ' Marque una sola respuesta.', items: [{ t: 'single', k: 'C28', o: ['Excelente', 'Muy buena', 'Buena', 'Regular', 'Mala'] }] },
          { n: 29, q: '¿Ha necesitado atención médica o psicológica por el cansancio de cuidar?', s: true, note: OPCIONAL + ' Marque una sola respuesta.', items: [{ t: 'single', k: 'C29', o: ['Sí, y la recibí', 'Sí, y no la he podido recibir', 'No la he necesitado'] }] },
          { n: 30, q: 'Cuando usted no puede cuidar…', s: true, note: OPCIONAL, items: [
            { t: 'multi', k: 'C30_reemplaza', label: '¿Quién lo(la) reemplaza?', o: ['Otro familiar', 'Un amigo o vecino', 'Una persona contratada', 'Nadie me reemplaza'], excl: ['Nadie me reemplaza'] },
            { t: 'single', k: 'C30_paga', label: '¿Ha tenido que pagar a alguien para ello?', o: ['Sí', 'No'] },
            { t: 'nums', k: 'C30', f: [['horas', 'Horas pagadas por semana', 'horas'], ['costo', 'Costo mensual', 'pesos']], showIf: r => r.C30_paga !== 'No' }
          ] }
        ]
      },
      {
        titulo: 'Su trabajo y el tiempo perdido', min: 8,
        intro: 'Las preguntas marcadas como sensibles puede dejarlas en blanco. Un cálculo aproximado es suficiente.',
        preguntas: [
          { n: 31, q: '¿Cuál era su situación antes de asumir el cuidado?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C31', o: ['Trabajaba con contrato', 'Trabajaba de forma independiente o informal', 'Estudiaba', 'Oficios del hogar', 'Estaba pensionado(a)', 'No trabajaba ni estudiaba'] }] },
          { n: 32, q: '¿Cuál es su situación hoy?', note: 'Marque una sola respuesta.', items: [{ t: 'single', k: 'C32', o: ['Trabajo con contrato', 'Trabajo de forma independiente o informal', 'Estudio', 'Oficios del hogar', 'Pensionado(a)', 'Dejé de trabajar para cuidar', 'No trabajo ni estudio por otra razón'] }] },
          { n: 33, q: 'Horas que trabaja o trabajaba por semana', note: 'Si no trabaja, deje en blanco.', items: [{ t: 'nums', k: 'C33', f: [['antes', 'Antes de cuidar', 'horas por semana', { min: 0, max: 112 }], ['hoy', 'Hoy', 'horas por semana', { min: 0, max: 112 }]] }] },
          { n: 34, q: 'En el último mes, ¿cuántos días dejó de trabajar, llegó tarde o salió antes por acompañar o atender a su familiar?', items: [{ t: 'nums', k: 'C34', f: [['dias', 'Días completos', 'días', { min: 0, max: 31 }], ['medios', 'Medios días, llegadas tarde o salidas antes de hora', 'veces']] }] },
          { n: 35, q: 'En los últimos 12 meses, ¿cuántos días tuvo que pedir permiso, tomar vacaciones o licencia no remunerada, o faltar al trabajo por cuidar?', items: [{ t: 'nums', k: 'C35', f: [['dias', 'Días en total', 'días', { min: 0, max: 366 }], ['vacaciones', 'De esos, días usados en vacaciones o licencia', 'días', { min: 0, max: 366 }]] }] },
          { n: 36, q: 'De esos días, ¿cuántos fueron por…?', items: [{ t: 'nums', k: 'C36', f: [['citas', 'Citas, exámenes, aplicaciones y trámites', 'días'], ['crisis', 'Hospitalizaciones o crisis', 'días']] }] },
          { n: 37, q: 'Comparando una semana buena y una semana mala de su familiar, ¿cuántos días de trabajo pierde usted en cada una?', items: [{ t: 'nums', k: 'C37', f: [['buena', 'Semana buena', 'días', { min: 0, max: 7 }], ['mala', 'Semana mala', 'días', { min: 0, max: 7 }]] }] },
          { n: 38, q: '¿Ha tenido que reducir su jornada o dejar de aceptar oportunidades por cuidar? Si trabaja, ¿cómo le afecta el cansancio o la preocupación por su familiar? Si un día normal su rendimiento fuera 100…', items: [
            { t: 'multi', k: 'C38', label: 'Cambios por cuidar', o: ['Reduje mi jornada', 'Pasé a un trabajo más flexible', 'Rechacé un ascenso o un empleo nuevo', 'Ninguna de las anteriores'], excl: ['Ninguna de las anteriores'] },
            { t: 'nums', k: 'C38', f: [['rinde', 'En un día malo de mi familiar rindo', 'de 100', de100]] }
          ] },
          { n: 39, q: '¿Ha dejado de trabajar, renunciado o se ha retirado antes de tiempo para cuidar a su familiar?', s: true, note: OPCIONAL, items: [
            { t: 'single', k: 'C39', o: ['Sí', 'No'] },
            { t: 'nums', k: 'C39', f: [['anio', 'Año en que ocurrió', '', anio], ['ingreso', 'Ingreso mensual de entonces', 'pesos']], showIf: r => r.C39 !== 'No' }
          ] },
          { n: 40, q: '¿Cómo han respondido su empleador o su equipo de trabajo?', s: true, note: OPCIONAL + ' Marque una sola respuesta.', items: [{ t: 'single', k: 'C40', o: ['Me han apoyado', 'Les es indiferente', 'He tenido dificultades o me han juzgado', 'No saben de mi situación', 'No aplica'] }] },
          { n: 41, q: 'Con estos cambios, ¿cómo ha variado el ingreso de su hogar?', s: true, note: OPCIONAL, items: [
            { t: 'single', k: 'C41_cambio', label: 'Cambio', o: ['Disminuyó mucho', 'Disminuyó algo', 'Sigue igual', 'Aumentó'] },
            { t: 'single', k: 'C41_ingreso', label: 'Ingreso mensual actual del hogar', o: INGRESO_HOGAR }
          ] }
        ]
      },
      {
        titulo: 'Gastos y economía', min: 8,
        intro: 'Escriba cuánto paga usted o su hogar por la enfermedad de su familiar. Deje en blanco lo que no aplique. Un cálculo aproximado es suficiente.',
        preguntas: [
          { n: 42, q: 'Anote los gastos que usted asume por la enfermedad de su familiar:', items: [{ t: 'costs', k: 'C42' }] },
          { n: 43, q: 'En total, ¿cuánto gasta usted por el cuidado de su familiar en un mes típico y en un mes malo?', s: true, note: OPCIONAL, items: [{ t: 'nums', k: 'C43', f: [['tipico', 'Mes típico', 'pesos'], ['malo', 'Mes malo (crisis, hospitalización)', 'pesos']] }] },
          { n: 44, q: 'En los últimos 12 meses, ¿cuántos meses malos tuvo su familiar (con crisis, hospitalización o muchas consultas de urgencia)?', items: [{ t: 'nums', k: 'C44', f: [['', 'Meses malos', 'meses', { min: 0, max: 12 }]] }] },
          { n: 45, q: 'Desde que cuida a su familiar, ¿cada una de estas situaciones ha sido para usted y su hogar una preocupación grande, alguna preocupación o ninguna preocupación?', items: [{ t: 'grid', k: 'C45', rows: PREOCUPACIONES_FILAS, cols: PREOCUPACION }] },
          { n: 46, q: 'En el último año, ¿cuántas veces no pudieron hacer algo de esto por falta de dinero o por lo que costaba el traslado?', s: true, note: OPCIONAL, items: [{ t: 'grid', k: 'C46', rows: ['Ir a una cita', 'Hacer un examen', 'Comprar o reclamar un medicamento', 'Reducir o espaciar la dosis para que rindiera', 'Ir a urgencias por haber esperado'], cols: FRECUENCIA_4 }] },
          { n: 47, q: 'Cuando ha habido un gasto grande por la enfermedad, ¿cómo lo han cubierto?', s: true, note: OPCIONAL + ' Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'C47', o: GASTO_GRANDE, excl: ['No he tenido gastos grandes'], otro: true }] },
          { n: 48, q: '¿Ha recibido alguna ayuda económica o apoyo para cuidar?', note: 'Puede marcar varias respuestas.', items: [{ t: 'multi', k: 'C48', o: AYUDAS, excl: ['Ninguna'], otro: true }] },
          { n: 49, q: 'Si pudiera cambiar una sola cosa para aliviar la carga económica o laboral de cuidar, ¿cuál sería?', note: OPCIONAL, items: [{ t: 'long', k: 'C49' }] }
        ]
      },
      {
        titulo: 'Para terminar', min: 4,
        intro: 'Estas preguntas son abiertas y opcionales. Escriba lo que quiera, con sus propias palabras.',
        preguntas: [
          { n: 50, q: 'Si pudiera cambiar una sola cosa en la forma en que atienden a su familiar, ¿cuál sería?', note: OPCIONAL, items: [{ t: 'long', k: 'C50' }] },
          { n: 51, q: '¿Y una sola cosa que la institución o la EPS deberían hacer por los cuidadores?', note: OPCIONAL, items: [{ t: 'long', k: 'C51' }] },
          { n: 52, q: '¿Hay algo importante que no le preguntamos y que crea que debemos saber?', note: OPCIONAL, items: [{ t: 'long', k: 'C52' }] }
        ]
      }
    ]
  };

  const COSTOS = [
    { grupo: 'Gastos médicos directos' },
    'Medicamentos pagados (no entregados o no cubiertos)',
    'Cuotas moderadoras y copagos',
    'Consultas, exámenes y terapias particulares',
    'Medicina prepagada o póliza por la enfermedad',
    { grupo: 'Gastos no médicos' },
    'Transporte a citas, exámenes y aplicaciones',
    'Alimentación fuera de casa por trámites y citas',
    'Alojamiento',
    'Cuidador o ayuda pagada en casa',
    'Cuidado de hijos u otras personas a cargo',
    'Adecuaciones del hogar y ayudas técnicas (barandas, baño adaptado, silla…)',
    'Alimentación especial y suplementos',
    'Otros (escriba cuáles)'
  ];

  const DEPARTAMENTOS = ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'];

  window.ENCUESTAS = { paciente, cuidador, COSTOS, DEPARTAMENTOS, FUENTES };
})();
