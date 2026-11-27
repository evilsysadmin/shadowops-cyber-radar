# ShadowOps Cyber Radar · HMMMM

**NO OTRA VEZ. LO SABÍA.**

Radar visual semanal de incidentes de ciberseguridad, con foco en hechos comprobables y lecciones prácticas de SRE / DevSecOps.

## Ejecutar

Arrancar el servidor local (Node.js 20+; sin instalar paquetes):

```sh
make serve
# O directamente:
node scripts/serve-local.cjs 8080
```

Radar: http://127.0.0.1:8080/ · Mesa editorial: http://127.0.0.1:8080/review.html. Usa `make serve PORT=9000` si el puerto está ocupado. Solo escucha en loopback y sirve una lista explícita de archivos: no expone Git, scripts, directorios ni borradores. Guarda ficheros privados en `work/` (ignorado por Git); no los añadas con git add -f. No sirve como autenticación o hosting de producción. Abrir index.html directamente sigue siendo posible.

Sin dependencias de frontend, backend, claves API ni telemetría. La edición inicial cubre una selección del 21–27 de noviembre de 2026. No es un feed en tiempo real.

## Calidad

```sh
node --test tests/*.test.cjs
```

Node 20+; sin npm install. CI por PR y build de release en main; recogida semanal programada, sin deploy automático.

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

La salida es un sitio estático sin backend ni instalación de dependencias. El directorio de destino no debe existir; no se sobrescribe ni se borra un directorio previo. Solo se incluyen los archivos de runtime del radar enumerados explícitamente y .nojekyll. No se empaquetan la mesa editorial, scripts, fuentes de candidatos ni tests. Publicar únicamente dist en el alojamiento estático elegido, no la raíz del repositorio. La mesa editorial sigue siendo una herramienta local. Esto no activa ningún hosting ni configura autenticación. El repositorio y sus archivos actuales son públicos; no almacenar información privada en él.

## RSS en la cola semanal

```sh
python3 scripts/discover-rss.py 2026-11-21 2026-11-27 --feed cisa > rss-cisa.json
python3 scripts/discover-rss.py 2026-11-21 2026-11-27 --feed cloudflare > rss-cloudflare.json
node scripts/weekly-review.cjs 2026-11-21 2026-11-27 --rss rss-cisa.json --rss rss-cloudflare.json > revision-semanal.json
```

Cada argumento RSS es opcional, acepta únicamente candidatos watch no verificados y conserva URL y fecha. Un comunicado curado prevalece sobre un descubrimiento de la misma URL canónica dentro de la ventana; los conflictos entre descubrimientos se rechazan. No se modifica la edición publicada. Sin RSS explícito se conserva el flujo anterior.

## Ingesta completa y comprobación de fuentes

```sh
node scripts/live-review.cjs 2026-11-21 2026-11-27 > revision-semanal.json
```

Ejecuta los tres descubrimientos RSS, descarga KEV y genera la cola conjunta. Los fallos de fuente impiden emitir una cola parcial; los temporales se eliminan. Para reproducir offline, añade `--offline kev.json cisa.xml cloudflare.xml`. El workflow manual **Live source smoke** comprueba la conectividad y la compatibilidad de las fuentes reales para los últimos siete días UTC. No publica ni sube candidatos como artefactos. Se ejecuta en PR únicamente cuando cambian los adaptadores o el workflow de fuentes; es un diagnóstico separado de Radar CI, que sigue offline. La ingesta conjunta completa solo se comprueba en ejecución manual. Una ejecución correcta demuestra disponibilidad y parsing, no cobertura completa. CI ordinaria sigue siendo offline.

## Compilar una edición revisada

Completa el JSON del borrador: `editorial.pattern`, `editorial.action` y todos los campos de cada `review`. Usa "Desconocido" o "En investigación" cuando corresponda; marca `verified: true` solo después de comprobar las fuentes. Conserva `publicationReady: false` (el fichero sigue siendo un borrador). Los casos KEV requieren etiqueta CVE y no pueden clasificarse como brecha por sí solos.

```sh
node scripts/compile-draft.cjs borrador.json > edicion.json
```

El resultado se puede previsualizar importándolo en el radar. No modifica el histórico ni publica automáticamente. La compilación comprueba estructura, decisiones, fechas y enlaces; no puede verificar la veracidad de una afirmación redactada por el editor. Los borradores sin candidatos o incompletos se rechazan.

## Preparar una publicación controlada

```sh
node scripts/prepare-release.cjs borrador.json editions-candidate.js
```

Genera un archivo de histórico candidato a partir del borrador revisado. Solo admite una edición posterior, conserva todas las anteriores y nunca sobrescribe archivos existentes. Revisa el diff, previsualiza la edición, sustituye deliberadamente `data/editions.js` y abre una PR para pasar CI. No existe publicación automática ni se altera el histórico real durante la preparación. Una misma organización puede aparecer en varios incidentes distintos.

## Histórico visual

El desplegable de histórico muestra hasta ocho ediciones publicadas, con barras y cifras por categoría y acceso a cada edición. No incorpora importaciones locales, no rellena semanas ausentes ni interpreta el número de fichas como frecuencia global de ataques. Con una sola edición informa de que todavía no existe tendencia comparable.

El mismo desplegable incluye patrones técnicos por etiquetas explícitas: fichas, número de ediciones con presencia y recuento en la última edición. Las categorías se solapan y un seguimiento repetido cuenta como ficha, no como ataque independiente. No se infieren causas raíz ni se fabrican tendencias con una sola edición.

## Cabeceras de seguridad del despliegue

El paquete estático incluye `_headers` para Cloudflare Pages: CSP restrictiva sin unsafe-inline ni unsafe-eval, protección contra framing, nosniff y política de referrer. Los scripts y CSS del radar son externos y se sirven desde el mismo origen. El radar no necesita conexiones de red en runtime. En otros hostings hay que configurar las cabeceras equivalentes (GitHub Pages no aplica automáticamente _headers). No sustituye autenticación ni activa el alojamiento. La mesa editorial local no se empaqueta.

## Smoke del navegador

```sh
node tests/browser-smoke.cjs
# Si Chromium está instalado con otro nombre:
CHROME_BIN=chromium node tests/browser-smoke.cjs
```

El smoke levanta un servidor local del paquete real con las cabeceras de despliegue y ejecuta Chrome headless instalado en el runner. Comprueba CSS, filtros combinados, búsqueda, navegación del histórico, reinicio, desbordamiento y errores CSP. No instala paquetes npm, no accede a fuentes externas y no incluye el harness en el sitio desplegable. Es una prueba funcional de navegador, no una auditoría visual exhaustiva.

## Diagnóstico independiente de fuentes

`node scripts/source-health.cjs FROM THROUGH` comprueba KEV y ambos RSS independientemente, incluso si uno falla, y devuelve un JSON con estado y recuento por fuente. Cero candidatos no implica fallo; el código de salida es no cero si algún adaptador falla. No incluye textos externos en el informe. El workflow Live source smoke no debe configurarse como check requerido: la disponibilidad externa no debe bloquear cambios no relacionados.

## Redacción asistida (proveedor independiente)

```sh
node scripts/editorial-assistance.cjs request borrador.json > solicitud-ia.json
# Entregar voluntariamente la solicitud a un modelo local o externo y guardar su respuesta JSON.
node scripts/editorial-assistance.cjs apply borrador.json respuesta.json > borrador-asistido.json
```

El paquete separa instrucciones y evidencias no confiables. No contiene claves, no llama a modelos, no descarga enlaces ni envía datos a terceros. Las propuestas solo rellenan campos vacíos, conservan las fuentes y la fecha original, no elevan alertas a brechas y nunca verifican ni publican. Una revisión marcada como verificada no puede modificarse mediante este flujo. El editor debe comprobar la exactitud del texto y cualquier posible instrucción maliciosa en las fuentes; el filtro estructural no garantiza veracidad. Solo compartir datos autorizados con el proveedor elegido.

## Asistencia con Ollama local

```sh
node scripts/local-editorial.cjs borrador.json NOMBRE_MODELO > borrador-asistido.json
```

Requiere Ollama ya ejecutándose en 127.0.0.1:11434 y el modelo elegido instalado localmente. El comando no instala ni descarga modelos. Utiliza exclusivamente la API local fija, sin redirecciones, y envía un candidato por solicitud (máximo 20 por ejecución). Se aplican las mismas restricciones de la asistencia manual. No se envían candidatos ya verificados. Si una respuesta falla, no se emite un borrador parcial. No se ejecuta el modelo en CI: los tests simulan su API. Usa modelos realmente locales, no variantes cloud ni un servidor local configurado para reenviar solicitudes; el cliente no puede garantizar qué hace el servidor. Revisar el resultado antes de publicar.

## Búsqueda editorial

La mesa de revisión combina búsqueda por palabras (sin distinguir mayúsculas ni acentos), estado de decisión y coincidencia histórica. Los filtros solo cambian la vista; exportar decisiones y preparar borradores sigue considerando la cola completa, no únicamente los resultados visibles. Los recuentos globales y visibles se muestran por separado.

El smoke también ejercita la mesa editorial local en el navegador: importación JSON, texto no confiable, búsqueda, filtros, decisiones, recuperación en una segunda navegación y borrado de sesión. No se añade la mesa editorial al paquete público.

## Briefing semanal en Markdown

```sh
node scripts/weekly-briefing.cjs > briefing.md
node scripts/weekly-briefing.cjs 2026-11-27 > briefing-2026-11-27.md
```

Genera un resumen de la última edición publicada o de una fecha concreta, agrupado por tipo y con enlaces originales, fechas, impacto y lecciones. No consulta Internet ni utiliza candidatos pendientes; tampoco añade datos, cambia el histórico o publica automáticamente. El resultado es portable a notas, correo o documentación.

## Fuente europea CERT-FR

```sh
python3 scripts/discover-rss.py 2026-11-21 2026-11-27 --feed cert-fr > rss-cert-fr.json
node scripts/weekly-review.cjs 2026-11-21 2026-11-27 --rss rss-cert-fr.json > revision.json
```

El [catálogo oficial RSS del CERT-FR](https://cert.cyber.gouv.fr/flux-rss/) publica un flujo específico de amenazas e incidentes (CTI). Se utiliza el dominio actual cert.cyber.gouv.fr, admitiendo enlaces del dominio anterior del organismo. Todas las entradas siguen siendo watch pendientes. El diagnóstico independiente incluye esta cuarta fuente; la ingesta completa incluye las cuatro fuentes por defecto. El flujo explícito --rss permite incorporarla sin alterar el histórico.

## Recogida semanal en GitHub Actions

El workflow **Weekly candidate collection** se ejecuta los viernes a las 11:30 UTC, manualmente o en PRs que cambien la orquestación. Recoge los últimos siete días UTC de KEV y tres RSS, valida la cola y sube `radar-unpublished-review-queue` como artefacto de Actions con siete días de retención. Descarga el ZIP, extrae `radar-review.json` e impórtalo en `review.html`. No modifica main, no publica ediciones ni invoca IA. Los candidatos contienen datos de fuentes públicas; no introducir datos privados en el registro del repositorio público. Si falla una fuente, no se sube un resultado parcial. La programación consume una ejecución semanal y no debe ser un check obligatorio. Para reproducción offline completa añade `--offline kev.json cisa.xml cloudflare.xml cert-fr.xml`; la variante histórica de tres ficheros sigue funcionando y avisa de que omite CERT-FR.

Los tres pasos del smoke anuncian su etapa y tienen un límite individual de 45 segundos. En Linux, un timeout termina el grupo de procesos de Chrome; no se reintentan ni se ignoran aserciones fallidas. Las opciones de arranque reducen actividad de fondo del navegador. El timeout de la PR #28 fue transitorio; este cambio mejora diagnóstico y margen, no demuestra que todos los timeouts futuros estén resueltos.

## Handoff de despliegue a ShadowOps Infra

Radar CI produce un artefacto `radar-static-SHA` en main cuando cambian archivos relevantes para despliegue (o manualmente en main), después de pasar tests y navegador. Incluye release.json con SHA exacto y hash SHA-256 de cada archivo. La mesa editorial no se incluye.

```sh
node scripts/release-candidate.cjs build release "$(git rev-parse HEAD)"
node scripts/release-candidate.cjs verify release "$(git rev-parse HEAD)"
```

El manifiesto permite detectar cambios accidentales; no es una firma ni acredita por sí solo el origen. El futuro propietario de despliegue debe comprobar el run de CI, su repositorio, SHA y evento de origen mediante GitHub, no confiar en el JSON por sí solo. No activar un Pages público directamente desde este repositorio. Conforme a los patrones de ShadowOps Infra, la infraestructura debe ser dueña de Pages y DNS, validar acceso a dominio canónico, origen pages.dev y previews, y verificar ShadowOps ID antes de exponer el contenido. Main todavía no está protegido; la protección de rama y el contrato de identidad/hosting son requisitos pendientes de admisión. Esta PR prepara el paquete, no crea un sitio ni cambia políticas de acceso.

## Recogida local con un comando

```sh
make collect
# O seleccionar fechas concretas:
node scripts/collect-local.cjs 2026-11-21 2026-11-27
```

Por defecto recoge los siete días UTC inclusivos hasta hoy y guarda la cola validada en `work/revision-FROM--THROUGH.json`. Si alguna fuente falla o la cola es inválida, no crea el fichero final. Nunca sobrescribe una cola existente, incluso si coinciden dos ejecuciones. Importa el archivo en la mesa editorial; sigue siendo una lista de candidatos, no una edición publicada. No se sincroniza ni se envía a IA automáticamente.

## Editor visual de borradores

Abre http://127.0.0.1:8080/draft.html después de `make serve`. Importa un borrador original o asistido por IA, edita una ficha cada vez, consulta sus enlaces y marca la verificación explícitamente. Cambiar cualquier campo de la ficha invalida la verificación. Exporta el JSON para compilarlo con el CLI existente, que sigue siendo la validación final. Los cambios se mantienen en memoria hasta exportar; no se publica, no se guarda en Git y no se incluye en el paquete público.

## Roadmap

1. Ediciones versionadas y selector de semanas (implementado); ampliar validación compartida.
2. Ingesta de CISA KEV y otras fuentes autorizadas con deduplicación y procedencia.
3. Cola de revisión editorial; nunca publicar rumores como hechos.
4. Relevancia cloud, IAM, CI/CD, Kubernetes y clasificación MITRE cuando haya evidencia.
5. Histórico y tendencias, y publicación semanal controlada.

No habilitar publicación automática hasta disponer de validaciones de calidad y procedencia.
