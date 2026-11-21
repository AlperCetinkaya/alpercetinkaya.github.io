/* Executed in a disposable worker, never on the UI thread. */
(function(root){
'use strict';
const MAX_INPUT=200*1024,MAX_OUTPUT=2000000,MAX_MATCHES=20000,MAX_PREVIEW=500;
class RegexError extends Error{}
function substitution(template,m,text){
 const pieces=[];let cursor=0,total=0;const add=value=>{total+=value.length;if(total>MAX_OUTPUT)throw new RegexError('outputSize');pieces.push(value);};
 for(const token of template.matchAll(/\$(\$|&|`|'|\d{1,2}|<[^>]*>)/g)){
  add(template.slice(cursor,token.index));const key=token[1];let value=token[0];
  if(key==='$')value='$';else if(key==='&')value=m[0];else if(key==='`')value=text.slice(0,m.index);else if(key==="'")value=text.slice(m.index+m[0].length);else if(key[0]==='<')value=m.groups===undefined?token[0]:m.groups[key.slice(1,-1)]??'';
  else{const n=Number(key);if(n>0&&n<m.length)value=m[n]??'';else if(key.length===2&&Number(key[0])>0&&Number(key[0])<m.length)value=(m[Number(key[0])]??'')+key[1];}
  add(value);cursor=token.index+token[0].length;
 }
 add(template.slice(cursor));return pieces.join('');
}
function execute({pattern='',flags='g',text='',replacement='',replace=false}={}){
 if(typeof pattern!=='string'||typeof flags!=='string'||typeof text!=='string'||typeof replacement!=='string')throw new RegexError('options');
 if(new TextEncoder().encode(text).length>MAX_INPUT||pattern.length>10000||replacement.length>10000)throw new RegexError('size');
 if(!/^[gimsu]*$/.test(flags)||new Set(flags).size!==flags.length)throw new RegexError('flags');
 let regex;try{regex=new RegExp(pattern,flags);}catch(e){throw new RegexError('syntax: '+e.message);}
 let m,count=0,last=0,length=0;const matches=[],pieces=[];
 const append=value=>{length+=value.length;if(length>MAX_OUTPUT)throw new RegexError('outputSize');pieces.push(value);};
 while((m=regex.exec(text))!==null){
  if(++count>MAX_MATCHES)throw new RegexError('matchLimit');
  if(matches.length<MAX_PREVIEW)matches.push({index:m.index,end:m.index+m[0].length,value:m[0].slice(0,500),length:m[0].length,groups:Array.from(m.slice(1,21),v=>v===undefined?null:v.slice(0,200)),named:m.groups?Object.fromEntries(Object.entries(m.groups).slice(0,20).map(([k,v])=>[k,v===undefined?null:v.slice(0,200)])):null,groupCount:m.length-1});
  if(replace){append(text.slice(last,m.index));append(substitution(replacement,m,text));last=m.index+m[0].length;}
  if(!regex.global)break;
  if(m[0]===''){const i=regex.lastIndex,cp=text.codePointAt(i);regex.lastIndex=i+(regex.unicode&&cp>0xffff?2:1);}
 }
 if(replace)append(text.slice(last));
 return {count,matches,limited:count>MAX_PREVIEW,output:replace?pieces.join(''):null};
}
const api={execute,RegexError,MAX_INPUT,MAX_OUTPUT,MAX_MATCHES,MAX_PREVIEW};root.DifforaRegex=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
