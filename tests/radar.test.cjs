const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const seedMatch = html.match(/<script id="seed" type="application\/json">([\s\S]*?)<\/script>/);
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

test('embedded application JavaScript parses', () => {
  assert.ok(scripts.length);
  for (const match of scripts) new vm.Script(match[1]);
});

test('initial edition has valid fields and HTTPS evidence', () => {
  assert.ok(seedMatch);
  const edition = JSON.parse(seedMatch[1]);
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
});

test('historical Renfe incident is not counted as a new breach', () => {
  const edition = JSON.parse(seedMatch[1]);
  const renfe = edition.items.find(item => item.name === 'Renfe');
  assert.equal(renfe.type, 'watch');
  assert.match(renfe.incident, /24 sep/);
});

test('basic accessible search and import controls exist', () => {
  assert.match(html, /id="search"[^>]+aria-label=/);
  assert.match(html, /id="notice" role="status"/);
  assert.match(html, /id="file" type="file"/);
});
