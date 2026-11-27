'use strict';
const fs = require('node:fs/promises');
const { candidatesFromKev, fetchKev, isoDate } = require('../lib/kev.cjs');
async function main() {
  const [from, through, input, ...extra] = process.argv.slice(2);
  if (!from || !through || extra.length) throw Error('Uso: node scripts/ingest-kev.cjs YYYY-MM-DD YYYY-MM-DD [catalogo-local.json]');
  isoDate(from); isoDate(through);
  if (from > through) throw Error('Intervalo invertido');
  const catalog = input ? JSON.parse(await fs.readFile(input, 'utf8')) : await fetchKev();
  const candidates = candidatesFromKev(catalog, from, through);
  process.stdout.write(JSON.stringify({ schemaVersion: 1, from, through, source: 'CISA KEV', candidates }, null, 2) + '\n');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
