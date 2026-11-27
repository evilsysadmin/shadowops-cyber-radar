const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const archive = fs.readFileSync(path.join(__dirname, "..", "data", "editions.js"), "utf8");
const editions = JSON.parse(archive.match(/^const RADAR_EDITIONS = ([\s\S]*);\s*$/)[1]);
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

test('embedded application JavaScript parses', () => {
  assert.ok(scripts.length);
  for (const match of scripts) new vm.Script(match[1]);
});

test('initial edition has valid fields and HTTPS evidence', () => {
  assert.ok(editions.length);
  for (const edition of editions) {
  for (const key of ['period', 'pattern', 'action']) {
    assert.equal(typeof edition[key], 'string');
    assert.ok(edition[key].trim());
  }
  assert.ok(Array.isArray(edition.items));
  assert.ok(edition.items.length > 0 && edition.items.length <= 500);
  const names = new Set();
  for (const item of edition.items) {
    for (const key of ['name', 'date', 'incident', 'vector', 'impact', 'lesson']) {
      assert.equal(typeof item[key], 'string');
      assert.ok(item[key].trim());
    }
    assert.ok(!names.has(item.name), 'duplicate entity in seed: ' + item.name);
    names.add(item.name);
    assert.ok(['breach', 'exploit', 'watch'].includes(item.type));
    assert.ok(Array.isArray(item.tags) && item.tags.every(t => typeof t === 'string'));
    assert.ok(Array.isArray(item.sources) && item.sources.length > 0);
    for (const source of item.sources) {
      assert.ok(Array.isArray(source) && source.length === 2);
      assert.ok(source.every(t => typeof t === 'string' && t.trim()));
      const url = new URL(source[1]);
      assert.equal(url.protocol, 'https:');
      assert.ok(!url.username && !url.password);
    }
  }
  }
});

test('historical Renfe incident is not counted as a new breach', () => {
  const edition = editions.find(e => e.id === '2026-11-27');
  const renfe = edition.items.find(item => item.name === 'Renfe');
  assert.equal(renfe.type, 'watch');
  assert.match(renfe.incident, /24 sep/);
});

test('basic accessible search and import controls exist', () => {
  assert.match(html, /id="search"[^>]+aria-label=/);
  assert.match(html, /id="notice" role="status"/);
  assert.match(html, /id="file" type="file"/);
});

test('archive has unique valid date IDs and is newest first', () => {
  assert.ok(editions.length);
  const ids = editions.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, [...ids].sort().reverse());
  for (const id of ids) {
    assert.match(id, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(id).toISOString().slice(0,10), id);
  }
  assert.match(html, /<select id="week">/);
  assert.match(html, /<script src="data\/editions.js">/);
  new vm.Script(archive);
});
