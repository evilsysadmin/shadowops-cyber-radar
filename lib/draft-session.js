'use strict';
(function(root){
 const editor=typeof module==='object'&&module.exports?require('./draft-editor.js'):root.RadarDraftEditor;
 const key='shadowops.radar.draft.v1',limit=4*1024*1024;
 function decode(raw){
  if(typeof raw!=='string'||raw.length>limit)throw Error('Sesión demasiado grande');
  const saved=JSON.parse(raw);
  if(saved?.version!==1)throw Error('Sesión inválida');
  const draft=editor.loadDraft(saved.draft);
  if(!Number.isInteger(saved.selected)||saved.selected<0||saved.selected>=draft.candidates.length)throw Error('Selección inválida');
  return {draft,selected:saved.selected};
 }
 function save(storage,draft,selected){
  try{const raw=JSON.stringify({version:1,draft,selected});decode(raw);storage.setItem(key,raw);return true;}
  catch{try{storage.removeItem(key);}catch{}return false;}
 }
 function restore(storage){
  try{const raw=storage.getItem(key);return raw===null?{status:'empty'}:{status:'restored',...decode(raw)};}
  catch{return {status:'unavailable'};}
 }
 function clear(storage){try{storage.removeItem(key);return true;}catch{return false;}}
 const api={save,restore,clear};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RadarDraftSession=api;
})(globalThis);
