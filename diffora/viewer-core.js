/* Browser-local parsing and formatting. JSON tokens retain numeric precision. */
(function(root){
'use strict';
class ViewerError extends Error{constructor(message,line=null,column=null){super(message);this.line=line;this.column=column;}}
function position(text,offset){const before=text.slice(0,Math.max(0,offset));const lines=before.split('\n');return {line:lines.length,column:lines.at(-1).length+1};}
function jsonData(source,indent){
 try{JSON.parse(source);}catch(error){let m=error.message.match(/position\s+(\d+)/i),lc=error.message.match(/line\s+(\d+)\s+column\s+(\d+)/i);const p=lc?{line:+lc[1],column:+lc[2]}:position(source,m?+m[1]:source.length);throw new ViewerError(error.message,p.line,p.column);}
 const tokens=source.match(/"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g)||[];
 let cursor=0;
 function parse(label,depth){if(depth>512)throw new ViewerError('deep');const token=tokens[cursor++];if(token==='{'||token==='['){const object=token==='{',children=[];while(tokens[cursor]!== (object?'}':']')){let key=object?JSON.parse(tokens[cursor++]):String(children.length);if(object)cursor++;children.push(parse(key,depth+1));if(tokens[cursor]===',')cursor++;}cursor++;return {kind:object?'object':'array',label,children};}return {kind:token[0]==='"'?'string':token==='null'?'null':token==='true'||token==='false'?'boolean':'number',label,value:token};}
 const tree=parse('$',0);let level=0,formatted='';
 for(let i=0;i<tokens.length;i++){const token=tokens[i],next=tokens[i+1],prev=tokens[i-1];if(token==='{'||token==='['){formatted+=token;if(next!==(token==='{'?'}':']'))formatted+='\n'+' '.repeat(++level*indent);}else if(token==='}'||token===']'){if(prev!==(token==='}'?'{':'['))formatted+='\n'+' '.repeat(--level*indent);formatted+=token;}else if(token===',')formatted+=',\n'+' '.repeat(level*indent);else if(token===':')formatted+=': ';else formatted+=token;}
 let inner=null;if(tree.kind==='string'){const decoded=JSON.parse(tree.value);try{JSON.parse(decoded);inner=decoded;}catch{}if(decoded.trim().startsWith('<'))inner=decoded;}
 return {format:'json',tree,pretty:formatted,compact:tokens.join(''),inner};
}
function xmlData(source,indent){
 if(/<!DOCTYPE\s/i.test(source.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>/g,'')))throw new ViewerError('doctype');
 const document=new DOMParser().parseFromString(source,'application/xml');const rootElement=document.documentElement;
 const errors=[...document.getElementsByTagName('parsererror')].filter(n=>n.namespaceURI==='http://www.mozilla.org/newlayout/xml/parsererror.xml'||n.namespaceURI==='http://www.w3.org/1999/xhtml');
 if(!rootElement||errors.length){const text=errors[0]?.textContent||'Invalid XML';const m=text.match(/line\s+(\d+).*?column\s+(\d+)/i);throw new ViewerError(text.replace(/Below is a rendering[\s\S]*/i,'').trim(),m?+m[1]:null,m?+m[2]:null);}
 const serializer=new XMLSerializer(),serialize=n=>serializer.serializeToString(n);
 function tree(n,depth){if(depth>512)throw new ViewerError('deep');if(n.nodeType===1)return {kind:'element',label:n.nodeName,children:[...n.attributes].map(a=>({kind:'attribute',label:'@'+a.name,value:a.value})).concat([...n.childNodes].filter(c=>c.nodeType!==3||c.nodeValue.trim()).map(c=>tree(c,depth+1)))};return {kind:n.nodeType===4?'cdata':n.nodeType===8?'comment':'text',label:n.nodeType===7?n.nodeName:'#'+(n.nodeType===4?'cdata':n.nodeType===8?'comment':'text'),value:n.nodeValue||''};}
 function output(n,depth,pretty,preserve=false){if(depth>512)throw new ViewerError('deep');if(n.nodeType!==1)return serialize(n);const setting=n.getAttribute('xml:space');if(setting==='preserve')preserve=true;else if(setting==='default')preserve=false;const children=[...n.childNodes];const mixed=children.some(c=>c.nodeType===4||(c.nodeType===3&&c.nodeValue.trim()));if(preserve||mixed||!children.length)return serialize(n);const significant=children.filter(c=>c.nodeType!==3||c.nodeValue.trim());if(!significant.length)return serialize(n);let open=serialize(n.cloneNode(false)).replace(/\s*\/>$/,'>');const close='</'+n.nodeName+'>';if(!pretty)return open+significant.map(c=>output(c,depth+1,false,preserve)).join('')+close;return open+'\n'+significant.map(c=>' '.repeat((depth+1)*indent)+output(c,depth+1,true,preserve)).join('\n')+'\n'+' '.repeat(depth*indent)+close;}
 const declaration=source.match(/^\s*(<\?xml\s[\s\S]*?\?>)/)?.[1]||'';
 const nodes=[...document.childNodes];const pretty=(declaration?declaration+'\n':'')+nodes.map(n=>output(n,0,true)).join('\n');const compact=declaration+nodes.map(n=>output(n,0,false)).join('');
 return {format:'xml',tree:tree(rootElement,0),pretty,compact,inner:null};
}
function inspect(source,format='auto',indent=2){source=String(source).replace(/^\uFEFF/,'');if(!source.trim())throw new ViewerError('empty');if(new TextEncoder().encode(source).length>2*1024*1024)throw new ViewerError('size');if(![2,4].includes(indent))indent=2;if(format==='auto')format=source.trimStart().startsWith('<')?'xml':'json';if(!['json','xml'].includes(format))throw new ViewerError('format');return format==='json'?jsonData(source,indent):xmlData(source,indent);}
const api={inspect,ViewerError,position};root.DifforaViewer=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
