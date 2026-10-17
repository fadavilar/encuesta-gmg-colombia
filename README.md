# Encuesta gMG Colombia

Aplicación web para recoger, por enlace enviado por correo, las respuestas de las dos encuestas autoaplicadas del
*Estudio sobre la vida con miastenia gravis generalizada en Colombia* (versión v16-oct-2026):

- **Pacientes** — 83 preguntas en 8 partes (≈ 40–60 min).
- **Cuidadores** — 52 preguntas en 7 partes (≈ 30–45 min).

Sitio publicado: <https://fadavilar.github.io/encuesta-gmg-colombia/>

## Cómo funciona

- HTML/CSS/JS sin dependencias, publicado en GitHub Pages. El repositorio **no contiene respuestas**.
- Consentimiento informado al inicio: si alguna de las cuatro primeras líneas de “Su decisión” es “No”, la
  encuesta termina sin enviar nada.
- Una parte por pantalla, barra de avance y saltos automáticos (las preguntas que no aplican se ocultan y se
  registran como `NA`).
- Guardado automático en el navegador del participante: puede cerrar y volver con el mismo enlace.
- Letra grande ajustable (A−/A+), modo claro/oscuro y tipografía Atkinson Hyperlegible, pensada para personas con
  visión doble o párpados caídos.
- Al final, una pantalla de revisión muestra las preguntas sin responder; luego **Enviar mis respuestas** las manda a
  una hoja de Google Sheets privada. Si el envío falla, el participante puede descargar una copia y enviarla por correo.

## Enlaces para el correo

| Para | Enlace |
|---|---|
| Pacientes | `https://fadavilar.github.io/encuesta-gmg-colombia/?r=paciente` |
| Cuidadores | `https://fadavilar.github.io/encuesta-gmg-colombia/?r=cuidador` |

Opcional: agregue un código de participante con `&c=`, por ejemplo `?r=paciente&c=P001` y `?r=cuidador&c=C001`.
El código se guarda en la columna `codigo` y permite emparejar paciente y cuidador sin usar nombres.
Sin `r=`, la página pregunta quién responde.

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
describe cada variable (pregunta, etiqueta y opciones). Si cambia el código de Apps Script, use
**Implementar → Administrar implementaciones → Editar → Nueva versión** para conservar la misma URL.

## Variables

- `P01`…`P83` (pacientes) y `C01`…`C52` (cuidadores) siguen la numeración del cuestionario en papel.
- Subcampos: `P20_transporte`, matrices `P21_1`…`P21_4` (una por fila), tabla de gastos `P69_01_tipico`, `_malo`,
  `_anual`, `_quien`.
- Respuestas múltiples separadas por ` | `. Celda vacía = sin respuesta; `NA` = no aplica por salto.
- Montos en pesos sin separadores de miles.

## Editar el contenido

- Texto de las preguntas: [`js/encuestas.js`](js/encuestas.js).
- Datos del estudio, contacto y URL de envío: [`js/config.js`](js/config.js).
