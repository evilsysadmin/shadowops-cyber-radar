'use strict';
(function (root) {
  const types = new Set(['breach', 'exploit', 'watch']);
  const nonblank = (value, max = 5000) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  function secureSource(source) {
    if (!Array.isArray(source) || source.length !== 2 || !nonblank(source[0], 200) || !nonblank(source[1], 2048)) return false;
    try {
      const url = new URL(source[1]);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch { return false; }
  }
  function validateEdition(edition) {
    if (!edition || typeof edition !== 'object' || Array.isArray(edition) ||
        !['period', 'pattern', 'action'].every(k => nonblank(edition[k])) ||
        !Array.isArray(edition.items) || edition.items.length > 500) throw Error('Formato de edición no válido');
    for (const item of edition.items) {
      if (!item || typeof item !== 'object' || Array.isArray(item) ||
          !['name','date','incident','vector','impact','lesson'].every(k => nonblank(item[k])) ||
          !types.has(item.type) || !Array.isArray(item.tags) || item.tags.length > 40 ||
          !item.tags.every(t => nonblank(t, 120)) || !Array.isArray(item.sources) ||
          !item.sources.length || item.sources.length > 20 || !item.sources.every(secureSource))
        throw Error('Ficha no válida');
    }
    return edition;
  }
  if (typeof module === 'object' && module.exports) module.exports = { validateEdition };
  else root.RadarValidation = Object.freeze({ validateEdition });
})(globalThis);
