# ShadowOps Cyber Radar · HMMMM

**NO OTRA VEZ. LO SABÍA.**

Radar visual semanal de incidentes de ciberseguridad, con foco en hechos comprobables y lecciones prácticas de SRE / DevSecOps.

## Ejecutar

Abrir `index.html` en el navegador o servir el repositorio:

```sh
python3 -m http.server 8080
```

Sin dependencias de frontend, backend, claves API ni telemetría. La edición inicial cubre una selección del 21–27 de noviembre de 2026. No es un feed en tiempo real.

## Calidad

```sh
node --test tests/*.test.cjs
```

Node 20+; sin npm install. CI ligera por PR, sin tareas programadas ni deploy automático todavía.

## Criterio editorial

- Distinguir brecha confirmada, explotación activa y alerta/seguimiento.
- Separar fecha del incidente de publicación o actualización. No presentar incidentes históricos como ataques nuevos.
- Preferir comunicados del afectado, CERT/CSIRT y avisos del fabricante; enlazar cada ficha.
- No convertir sospechas, CVE o afirmaciones de atacantes en brechas confirmadas.
- Separar impacto observado de impacto potencial; identificar datos no disponibles.
- Las lecciones técnicas son recomendaciones, no causas raíz demostradas.
- El análisis de tendencias describe la selección, no una estadística mundial.

La app permite importar y exportar una edición JSON localmente. El objeto contiene period, pattern, action e items; cada ficha contiene name, type, date, incident, vector, impact, lesson, tags y sources (pares de etiqueta y URL HTTPS).

## Archivo semanal

Las ediciones publicadas residen en `data/editions.js`, como una lista JSON asignada a `RADAR_EDITIONS`. Cada edición incluye `id` (fecha de corte ISO YYYY-MM-DD). Añadir nuevas ediciones al principio, mantener las anteriores y ejecutar los tests. El selector permite consultar el histórico; importar JSON no modifica el archivo publicado. Se conserva el funcionamiento desde file:// sin servidor.

## Ingesta de candidatos CISA KEV

```sh
node scripts/ingest-kev.cjs 2026-11-21 2026-11-27 > candidatos.json
# Repetición offline: añadir como tercer argumento un catálogo KEV JSON local.
```

La ventana es inclusiva y usa la fecha de incorporación a KEV, no la fecha del ataque. Los candidatos tienen estado pending, tipo exploit, fuente oficial y fecha del incidente desconocida. No se modifica el archivo publicado; revisar antes de redactar una ficha. La descarga tiene timeout y límite de tamaño. CI usa exclusivamente fixtures sintéticas, no red.

## Revisión y deduplicación

```sh
node scripts/review-kev.cjs candidatos.json > revision.json
```

El informe conserva todos los CVE pendientes y sus fuentes. Marca `new_cve` cuando no hay referencia, `historical_match` si existe en el histórico y `covered_in_window` cuando aparece en una edición con fecha de corte dentro del intervalo. Las coincidencias son por etiqueta CVE exacta, nunca por nombre de proveedor; no prueban que dos ataques sean el mismo incidente. Los candidatos idénticos se consolidan y los contradictorios se rechazan. Ningún candidato se publica ni se descarta automáticamente.

## Comunicados oficiales revisados por el editor

```sh
node scripts/review-disclosures.cjs 2026-11-21 2026-11-27 data/disclosures.json > revision-comunicados.json
```

El registro JSON contiene comunicados seleccionados manualmente, con fecha de publicación, fecha de incidente (o null), tipo propuesto, organización, resumen y URL. No descarga ni certifica automáticamente que una URL pertenezca a la organización: el editor debe comprobarlo. La clasificación es provisional y todos los candidatos quedan pendientes. La comparación con el histórico usa URL canónica, conserva parámetros significativos y no equipara enlaces distintos al mismo incidente. Los dos ejemplos iniciales ya están cubiertos por la edición publicada.

## Áreas técnicas

El selector combina área, tipo y búsqueda. Las áreas se derivan únicamente de etiquetas explícitas normalizadas; no del texto de recomendaciones. Cloud/Kubernetes es una agrupación temática, no una afirmación de que todos los incidentes afecten Kubernetes. Los recuentos son de la edición completa y pueden solaparse. No representan frecuencia mundial ni atribución MITRE.

## Mesa de revisión local

Abre `review.html` en el navegador e importa la salida de `review-kev.cjs` o `review-disclosures.cjs`. Consulta fuentes, fechas, referencias y estado provisional; filtra por decisión y exporta el informe JSON. Una cola a la vez; la cola y sus decisiones se guardan en localStorage cuando está disponible. Al recargar se revalida el snapshot. Si el almacenamiento falla, se informa y se mantiene la sesión en memoria; exporta una copia. El botón de borrado elimina la sesión local. No hay sincronización entre dispositivos ni garantía de persistencia en file://. No se modifica el archivo editorial ni se publica nada. Los enlaces importados son texto no confiable y solo se aceptan HTTPS sin credenciales; la autenticidad sigue requiriendo revisión humana.

## Cola semanal unificada

```sh
node scripts/weekly-review.cjs 2026-11-21 2026-11-27 > revision-semanal.json
# Offline, con catálogo KEV guardado:
node scripts/weekly-review.cjs 2026-11-21 2026-11-27 kev.json > revision-semanal.json
```

Importa el resultado en `review.html`. Ambas fuentes conservan identidad, fechas y evidencias; se ordenan por fecha de fuente y se exige un intervalo común. El proceso falla sin emitir JSON parcial si una fuente no está disponible o los datos son inválidos. Los comunicados siguen siendo de selección manual. Las coincidencias entre fuentes se revisan por el editor, no se fusionan automáticamente. CI prueba todo el flujo con catálogo local, sin red.

## Borrador editorial

En la mesa de revisión, marca los candidatos que merecen investigación y pulsa **Preparar borrador**. El JSON exportado conserva las evidencias y crea campos de redacción vacíos para cada candidato seleccionado. Las decisiones pendientes, descartadas o ya cubiertas solo se contabilizan; no se incluyen como fichas. El borrador tiene un esquema distinto del radar y no puede importarse como edición publicada. No presupone confirmación, impacto ni causa raíz, y no ejecuta ninguna IA. El editor debe verificar fuentes y completar los campos antes de preparar una edición.

## Descubrimiento RSS de fuentes oficiales

```sh
python3 scripts/discover-rss.py 2026-11-21 2026-11-27 --feed cisa > rss-cisa.json
python3 scripts/discover-rss.py 2026-11-21 2026-11-27 --feed cloudflare > rss-cloudflare.json
# Offline: añadir --local feed.xml
node scripts/review-disclosures.cjs 2026-11-21 2026-11-27 rss-cisa.json > revision-rss.json
```

CISA y el blog de seguridad de Cloudflare son fuentes fijas. Solo se extraen título, URL y fecha de publicación UTC; toda entrada se clasifica provisionalmente como watch, incluso si su título parece describir un ataque. No se descargan páginas de terceros ni se procesan instrucciones contenidas en el feed. El editor debe leer y verificar el comunicado; estos feeds no garantizan cobertura histórica ni exhaustiva. Python 3 (biblioteca estándar) para RSS; CI offline con fixtures. Si la descarga falla no se emite JSON parcial.

## Empaquetado y despliegue estático

```sh
node scripts/build-static.cjs dist
python3 -m http.server 8080 --directory dist
```

La salida es un sitio estático sin backend ni instalación de dependencias. El directorio de destino no debe existir; no se sobrescribe ni se borra un directorio previo. Solo se incluyen los cuatro archivos de runtime del radar y .nojekyll. No se empaquetan la mesa editorial, scripts, fuentes de candidatos ni tests. Publicar únicamente dist en el alojamiento estático elegido, no la raíz del repositorio. La mesa editorial sigue siendo una herramienta local. Esto no activa ningún hosting ni configura autenticación. El repositorio y sus archivos actuales son públicos; no almacenar información privada en él.

## Roadmap

1. Ediciones versionadas y selector de semanas (implementado); ampliar validación compartida.
2. Ingesta de CISA KEV y otras fuentes autorizadas con deduplicación y procedencia.
3. Cola de revisión editorial; nunca publicar rumores como hechos.
4. Relevancia cloud, IAM, CI/CD, Kubernetes y clasificación MITRE cuando haya evidencia.
5. Histórico y tendencias, y publicación semanal controlada.

No habilitar publicación automática hasta disponer de validaciones de calidad y procedencia.
