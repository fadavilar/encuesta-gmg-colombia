# Encuesta gMG Colombia

Aplicación web para recoger, por enlace enviado por correo, las respuestas de las dos encuestas autoaplicadas del
*Estudio sobre la vida con miastenia gravis generalizada en Colombia* (versión v21-oct-2026, rev. 2):

- **Pacientes** — 88 preguntas en 8 partes.
- **Cuidadores** — 65 preguntas en 7 partes.

Sitio publicado: <https://fadavilar.github.io/encuesta-gmg-colombia/>

## Cómo funciona

- HTML/CSS/JS sin dependencias, publicado en GitHub Pages. El repositorio **no contiene respuestas**.
- Consentimiento informado al inicio, con cinco autorizaciones obligatorias (incluida la autorización expresa de datos
  sensibles, Ley 1581 de 2012) y dos opcionales (unir respuestas paciente–cuidador; recontacto). Si alguna obligatoria
  es “No”, la encuesta termina sin enviar nada.
- Una parte por pantalla, barra de avance y saltos automáticos (las preguntas que no aplican se ocultan y se
  registran como `NA`).
- Guardado automático en el navegador del participante: puede cerrar y volver con el mismo enlace.
- Letra grande ajustable (A−/A+), modo claro/oscuro y tipografía Atkinson Hyperlegible, pensada para personas con
  visión doble o párpados caídos.
- Al final, una pantalla de revisión muestra las preguntas sin responder; luego **Enviar mis respuestas** las manda a
  una hoja de Google Sheets privada. Si el envío falla, el participante puede descargar una copia y enviarla por correo.

## Unión paciente–cuidador (díada)

Los costos y el tiempo del cuidador varían con la intensidad de la enfermedad (Dewilde et al. 2025), así que cada
respuesta lleva dos llaves para unir paciente y cuidador del mismo hogar, solo si ambos lo autorizan
(`consent_vinculacion = Sí`):

1. **`codigo_hogar`** (llave principal). Quien empieza recibe un código como `H-7K4P2Q` y puede enviarlo al otro por
   WhatsApp o copiando el enlace (`?r=cuidador&c=H-7K4P2Q`). Si el otro ya respondió, puede escribir su código.
   `codigo_hogar_origen` indica si vino del enlace, si se generó o si se escribió.
2. **`P_vinculo` / `C_vinculo`** (llave de respaldo). SHA-256 (16 caracteres) de las iniciales del primer nombre y del
   primer apellido y del día y mes de nacimiento de la persona con miastenia, calculado en el dispositivo; los datos
   originales no se envían. Una con `codigo_hogar` vacío o distinto + mismo `P_vinculo = C_vinculo` y departamento.

Gravedad del paciente para estratificar los costos del cuidador:

- `P38_1`…`P38_8`, `P38_total` y `P38_banda`: MG-ADL autorreportado (leve 0–4, moderada 5–9, grave ≥10).
- `C_severidad` y `C_ayuda_avd`: gravedad y dependencia según el cuidador; sirven cuando el paciente no responde.

## Enlaces para el correo

Enlace único para el correo (pacientes y cuidadores): <https://fadavilar.github.io/encuesta-gmg-colombia/>.
Abre la portada **¿Quién responde la encuesta?**, donde cada persona elige la encuesta de paciente o de cuidador.

Si el equipo asigna códigos, envíe a cada hogar su propio enlace con `c=`, por ejemplo `?c=F001`: ese código pasa a ser
el `codigo_hogar` de ambos.

## Componentes de costos (perspectiva social)

| Componente | Pacientes | Cuidadores |
|---|---|---|
| Gastos médicos de bolsillo (medicamentos, copagos, particulares, urgencias, pólizas, insumos y equipos) | Tabla de gastos | Tabla de gastos |
| Gastos no médicos (transporte, acompañante, alimentación, alojamiento, trámites, cuidador pagado, oficios, cuidado de hijos, dieta especial, servicios públicos) | Tabla de gastos | Tabla de gastos |
| Adaptaciones locativas, ayudas técnicas, vehículo y mudanzas (estado, costo, año, quién pagó, necesidad no cubierta) | `P_adapt` | `C_adapt` |
| Productividad (ausentismo, presentismo, horas, retiro) | P56–P68 | C31–C41 + `C_ingreso_propio` |
| Tiempo de cuidado informal (horas por semana buena o mala, noches, trámites) y costo de reemplazo | — | C12, `C_noches`, C15, `C_reemplazo` |
| Salud del cuidador (efecto indirecto) | — | Zarit, C28–C29, `C_gasto_salud` |
| Estrategias de afrontamiento y ayudas (deudas, venta de bienes, subsidios, certificado de discapacidad, PCL) | P76–P78, `P_discapacidad` | C47–C48 |

Basado en Mattingly et al. 2022 ([doi:10.1080/14737167.2022.2080056](https://doi.org/10.1080/14737167.2022.2080056)),
Hughes et al. 2023 ([doi:10.3389/fpubh.2023.1247931](https://doi.org/10.3389/fpubh.2023.1247931)) y Dewilde et al. 2025
([doi:10.3389/fpubh.2025.1538789](https://doi.org/10.3389/fpubh.2025.1538789)).

## Contexto colombiano y aspectos éticos

- Determinantes sociales: zona (cabecera, centro poblado, rural disperso), estrato, tamaño del hogar y dependientes,
  autorreconocimiento étnico (categorías del DANE, opcional), tiempo de traslado a neurología, otras personas a cargo
  del cuidador.
- Consentimiento: declaración de la financiación y del posible conflicto de interés (Declaración de Helsinki; IETS 2025);
  autorización expresa de datos sensibles; información sobre el almacenamiento en la nube (Google); canal para ejercer
  derechos; explicación de la unión paciente–cuidador; aviso al cuidador sobre datos de un tercero; devolución de
  resultados; alternativas de respuesta por teléfono o en papel.
- Minimización de datos: no se pide nombre ni documento; el contacto solo se pide si la persona autoriza el recontacto.
- `P_asistencia` / `C_asistencia` registran si alguien ayudó a responder (calidad del dato).
- Farmacovigilancia: se retiraron las preguntas sobre tratamientos recibidos y efectos de los corticoides (P24–P26 del
  cuestionario v16), las preguntas no nombran medicamentos que se aplican por vena y todos los campos abiertos piden no
  mencionar medicamentos específicos.
- Responsable del tratamiento de datos: el investigador responsable.
- Pendiente de configurar en `js/config.js`: `comiteEtica` (concepto del comité, Resolución 8430 de 1993).

## Instrumentos validados

- **Escala de sobrecarga del cuidador de Zarit**: Zarit et al. 1980,
  [doi:10.1093/geront/20.6.649](https://doi.org/10.1093/geront/20.6.649); validación colombiana Barreto-Osorio et al. 2015,
  [doi:10.5294/aqui.2015.15.3.5](https://doi.org/10.5294/aqui.2015.15.3.5).
- **MG-ADL**: Wolfe et al. 1999, [doi:10.1212/WNL.52.7.1487](https://doi.org/10.1212/WNL.52.7.1487). Los anclajes en
  español son una traducción de trabajo; reemplácelos por la versión validada y licenciada antes del trabajo de campo.
  Calidad de vida en MG en Colombia: Hoyos Cerón 2014, [repositorio UNAL](https://repositorio.unal.edu.co/handle/unal/21862).

## Conectar Google Sheets (una sola vez, ≈ 5 min)

1. Cree una hoja de cálculo nueva en su Google Drive (por ejemplo, *Respuestas encuesta gMG*).
2. En la hoja: **Extensiones → Apps Script**. Borre el contenido de `Código.gs` y pegue
   [`apps-script/Code.gs`](apps-script/Code.gs). Guarde.
3. **Implementar → Nueva implementación → tipo: Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (necesario para que los participantes puedan enviar sin cuenta de Google;
     solo pueden *agregar* filas, no leer la hoja).
4. Autorice los permisos (Google mostrará “aplicación no verificada”: *Configuración avanzada → Ir a …*).
5. Copie la URL que termina en `/exec` y péguela en `js/config.js` → `endpoint: '…'`. Publique el cambio.
6. Pruebe con un envío propio y borre luego esa fila de la hoja.

Las respuestas llegan a las hojas **Pacientes** y **Cuidadores** (una columna por variable) y la hoja **Diccionario**
describe cada variable (número de pregunta, texto, etiqueta y opciones). Si cambia la estructura de la encuesta antes
de recibir respuestas reales, borre esas tres hojas para que se vuelvan a crear con los encabezados y el diccionario
nuevos.

## Variables

- Las preguntas heredadas del cuestionario en papel v16 conservan su clave (`P01`…`P83`, `C01`…`C52`); las nuevas
  tienen claves descriptivas (`P_estrato`, `C_reemplazo`…). El número que ve el participante es correlativo y está en
  la columna `pregunta_n` del Diccionario.
- Subcampos: `P20_transporte`; matrices `P21_1`…`P21_4` (una por fila); tabla de gastos `P69_01_tipico`, `_malo`,
  `_anual`, `_quien`; adaptaciones `P_adapt_01_estado`, `_costo`, `_anio`, `_quien`.
- Respuestas múltiples separadas por ` | `. Celda vacía = sin respuesta; `NA` = no aplica por salto.
- Montos en pesos sin separadores de miles.

## Editar el contenido

- Texto de las preguntas: [`js/encuestas.js`](js/encuestas.js).
- Datos del estudio, financiación, comité de ética, contacto y URL de envío: [`js/config.js`](js/config.js).
- Tras cada cambio, suba el número `?v=` de los archivos en `index.html` para evitar que el navegador use una copia vieja.
