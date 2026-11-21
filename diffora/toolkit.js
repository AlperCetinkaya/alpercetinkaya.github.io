/* Shared static routes; each tool keeps its in-memory inputs when navigating. */
(function(){
'use strict';
const by=id=>document.getElementById(id),base=new URL('.',document.baseURI);
const tools=[{id:'compare',link:'tab-compare',panel:'compare-panel'},{id:'viewer',link:'tab-viewer',panel:'viewer-panel'},{id:'codec',link:'tab-codec',panel:'codec-panel'},{id:'timestamp',link:'tab-timestamp',panel:'timestamp-panel'},{id:'regex',link:'tab-regex',panel:'regex-panel'},{id:'csharp',link:'tab-csharp',panel:'csharp-panel'},{id:'sql',link:'tab-sql',panel:'sql-panel'}];
let active='compare';
const url=id=>new URL(id+'/',base);
function refresh(){const title=active==='compare'?({tr:'Karşılaştırma',en:'Comparison',de:'Vergleich'}[typeof language==='string'?language:'tr']||'Comparison'):active==='viewer'?'JSON / XML Viewer':active==='codec'?'URL / Base64':active==='regex'?'Regex Tester':active==='csharp'?'JSON → C# Model':active==='sql'?'SQL Formatter':({tr:'Timestamp Dönüştürücü',en:'Timestamp Converter',de:'Timestamp-Konverter'}[typeof language==='string'?language:'tr']||'Timestamp Converter');document.title='Diffora · '+title+' — Developer Toolkit';}
function select(id){active=id;for(const tool of tools){const selected=tool.id===id;by(tool.panel).hidden=!selected;if(selected)by(tool.link).setAttribute('aria-current','page');else by(tool.link).removeAttribute('aria-current');}refresh();}
function route(){const hash=location.hash.slice(1),path=location.pathname.match(/\/(compare|viewer|codec|timestamp|regex|csharp|sql)(?:\/|\/index\.html)?$/)?.[1],id=tools.some(t=>t.id===hash)?hash:path||'compare';select(id);const target=url(id);if(location.pathname!==target.pathname||location.hash)history.replaceState(null,'',target.pathname+location.search);}
document.querySelector('header .brand').href=base.href;
for(const tool of tools){const link=by(tool.link);link.href=url(tool.id).href;link.onclick=e=>{if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();if(location.pathname!==url(tool.id).pathname)history.pushState(null,'',url(tool.id).pathname+location.search);select(tool.id);};}
window.addEventListener('popstate',route);window.addEventListener('hashchange',route);by('language').addEventListener('change',refresh);window.DifforaToolkit={refresh};route();
})();
