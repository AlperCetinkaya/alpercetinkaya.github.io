/* Text-only URL and Base64 conversion. No network or persistence. */
(function(root){
'use strict';
class CodecError extends Error{}
const MAX_BYTES=2*1024*1024;
function utf8(text){if(typeof text.isWellFormed==='function'&&!text.isWellFormed())throw new CodecError('unicode');return new TextEncoder().encode(text);}
function convert(text,{format='url',direction='encode',urlMode='component',form=false,urlSafe=false}={}){
 text=String(text);const bytes=utf8(text);if(bytes.length>MAX_BYTES)throw new CodecError('size');
 if(!['url','base64'].includes(format)||!['encode','decode'].includes(direction)||!['component','full'].includes(urlMode))throw new CodecError('options');
 if(format==='url'){
  try{if(direction==='encode'){const value=urlMode==='full'?encodeURI(text):encodeURIComponent(text);return form&&urlMode==='component'?value.replace(/%20/g,'+'):value;}
   const value=form&&urlMode==='component'?text.replace(/\+/g,' '):text;
   return urlMode==='full'?decodeURI(value):decodeURIComponent(value);
  }catch{throw new CodecError('urlError');}
 }
 if(direction==='encode'){
  const chunks=[];for(let i=0;i<bytes.length;i+=32768)chunks.push(String.fromCharCode(...bytes.subarray(i,i+32768)));
  const encoded=btoa(chunks.join(''));return urlSafe?encoded.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''):encoded;
 }
 let value=text.replace(/\s+/g,'');if(!value)return '';
 if(!(urlSafe?/^[A-Za-z0-9_-]*={0,2}$/:/^[A-Za-z0-9+/]*={0,2}$/).test(value))throw new CodecError('base64Error');
 if(value.includes('=')&&value.length%4!==0)throw new CodecError('base64Error');
 const unpadded=value.replace(/=+$/,'');if(unpadded.length%4===1)throw new CodecError('base64Error');
 const standard=unpadded.replace(/-/g,'+').replace(/_/g,'/');const padding='='.repeat((4-standard.length%4)%4);
 if(value.includes('=')&&value.length-unpadded.length!==padding.length)throw new CodecError('base64Error');
 let binary;try{binary=atob(standard+padding);if(btoa(binary).replace(/=+$/,'')!==standard)throw Error();}catch{throw new CodecError('base64Error');}
 try{return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));}catch{throw new CodecError('utf8Error');}
}
const api={convert,CodecError,MAX_BYTES};root.DifforaCodec=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
