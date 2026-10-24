# Tablero epidemiológico · Miastenia gravis en Colombia

Tablero interactivo (React + Recharts + SheetJS, todo en el navegador) sobre personas con miastenia gravis y síndromes
miasténicos atendidas en Colombia: **RIPS–SISPRO 2019–2025** (G70.0, G70.2, G73.0, G73.2, G73.3, P94.0) y
**MIPRES 2017–2026** (2026 parcial).

Sitio publicado: <https://fadavilar.github.io/encuesta-gmg-colombia/tablero/>

## El repositorio no contiene datos

La página **no incluye ninguna cifra**. Al abrirla pide el libro `MgG_14102026.xlsx` (arrastrar o seleccionar); se lee
con SheetJS en el navegador, no se envía a ningún servidor y queda guardado en el IndexedDB de ese navegador para la
próxima visita («Cambiar archivo» lo reemplaza). El `.gitignore` de la raíz excluye `*.xlsx` a propósito: no suba el
libro al repositorio.

Hojas que lee el tablero: `D00` a `D13` (obligatorias), `Caracterizacion_MG`, `Caracterizacion_MIPRES` y `Mipres`
(opcionales: sin ellas se desactivan «Totales únicos» y «MIPRES»).

## Vistas

Resumen · Totales únicos · Tipo de atención y ámbito · Demografía · Residencia · Aseguradores · Lugares de atención ·
Procedimientos · MIPRES · Calidad y notas.

Reglas estadísticas: las personas (`P_`) nunca se suman entre filas; las atenciones (`A_`) sí. Los totales con valores
únicos salen de `Caracterizacion_MG` (conteo directo al cubo). Cuando un filtro obliga a sumar personas entre celdas se
marca «≈ aproximado». Las categorías «no definido», «no reportado» y «no aplica» se omiten de las vistas; la pestaña
Calidad y notas informa cuánto se omite y verifica que la suma de atenciones de cada hoja coincida con D01.

## Archivos

- `index.html`: aplicación completa (JS y CSS en línea). Librerías desde jsDelivr con versión exacta: React 18.3.1,
  ReactDOM 18.3.1, prop-types 15.8.1, Recharts 2.15.0, SheetJS 0.18.5. Tipografías de Google Fonts.
- `colombia_deptos.json`: geometría simplificada de los departamentos (código DANE) para el mapa coroplético.

La página lleva `noindex`, pero GitHub Pages es público: cualquiera con el enlace puede abrirla (sin datos) y cargar su
propio libro.

## Móvil

Diseño responsivo: barra de pestañas fija con acceso a «Controles», panel de filtros a pantalla completa, rankings con
barras bajo la etiqueta y listas desplegables como panel inferior. Probado a 390 px sin desbordes horizontales.
