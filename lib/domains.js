'use strict';
(function(root){
  // Only explicit editorial tags count. Advice and free text are not evidence.
  const groups=Object.freeze({
    identity:{label:'IAM / identidad',tags:['iam','identidad','identity','mfa','oauth','sso','credenciales']},
    delivery:{label:'CI/CD y supply chain',tags:['ci/cd','github','gitlab','supply chain','cadena de suministro','build pipeline']},
    cloud:{label:'Cloud / Kubernetes',tags:['cloud','kubernetes','k8s','eks','aks','gke','contenedores']},
    network:{label:'Red y exposición',tags:['sd-wan','vpn','network','red','firewall','exposición pública']},
    application:{label:'Aplicaciones web',tags:['web','access bypass','appsec','xss','sqli']},
    data:{label:'Datos y criptografía',tags:['datos personales','sha-1','criptografía','data breach']},
    industrial:{label:'OT / industrial',tags:['ot','ics','scada','refrigeración']}
  });
  function normalize(tag){return tag.normalize('NFKD').replace(/\p{M}/gu,'').trim().toLowerCase();}
  function domainsFor(item){
    const tags=new Set((item.tags||[]).filter(t=>typeof t==='string').map(normalize));
    return Object.keys(groups).filter(key=>groups[key].tags.some(tag=>tags.has(normalize(tag))));
  }
  function matchesDomain(item,key){const domains=domainsFor(item);return key==='all'||(key==='unclassified'?!domains.length:domains.includes(key));}
  function domainCounts(items){const counts={all:items.length,unclassified:0};for(const key of Object.keys(groups))counts[key]=0;for(const item of items){const domains=domainsFor(item);if(!domains.length)counts.unclassified++;for(const key of domains)counts[key]++;}return counts;}
  const api={groups,domainsFor,matchesDomain,domainCounts};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RadarDomains=api;
})(globalThis);
