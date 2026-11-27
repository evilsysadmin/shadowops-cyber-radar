'use strict';
(function(root){
function isoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Fecha ISO requerida');
  const d = new Date(value);
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== value) throw Error('Fecha inválida');
  return value;
}
function str(v,max=5000){return typeof v==='string'&&v.trim().length>0&&v.length<=max;}
function canonical(value){
  if(!str(value,2048))throw Error('URL inválida');
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password)throw Error('Fuente HTTPS requerida');
  u.hash='';
  for(const k of [...u.searchParams.keys()])if(/^utm_/i.test(k))u.searchParams.delete(k);
  u.searchParams.sort();
  u.pathname=u.pathname.replace(/\/+$/,'')||'/';
  return u.href;
}
const api={isoDate,canonical};
if(typeof module==='object'&&module.exports)module.exports=api;else root.RadarEditorialContract=api;
})(globalThis);
