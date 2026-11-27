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
node --test tests/radar.test.cjs
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

## Roadmap

1. Ediciones versionadas y selector de semanas (implementado); ampliar validación compartida.
2. Ingesta de CISA KEV y otras fuentes autorizadas con deduplicación y procedencia.
3. Cola de revisión editorial; nunca publicar rumores como hechos.
4. Relevancia cloud, IAM, CI/CD, Kubernetes y clasificación MITRE cuando haya evidencia.
5. Histórico y tendencias, y publicación semanal controlada.

No habilitar publicación automática hasta disponer de validaciones de calidad y procedencia.
