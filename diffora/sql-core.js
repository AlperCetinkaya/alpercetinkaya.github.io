(function(root){
'use strict';
const MAX_BYTES=512*1024;class SqlError extends Error{}
const engine=root.DifforaSqlEngine||(typeof module!=='undefined'?require('./vendor/sql-engine.js'):null);
function format(source,{language='postgresql',indent='2',keywordCase='upper'}={}){
 if(typeof source!=='string'||new TextEncoder().encode(source).length>MAX_BYTES)throw new SqlError('size');
 if(!source.trim())throw new SqlError('empty');if(source.includes('\0'))throw new SqlError('binary');
 if(!['postgresql','transactsql'].includes(language)||!['2','4','tab'].includes(String(indent))||!['preserve','upper','lower'].includes(keywordCase))throw new SqlError('options');
 let output;try{output=engine.formatSql(source.replace(/^\uFEFF/,''),{language,tabWidth:indent==='tab'?2:Number(indent),useTabs:indent==='tab',keywordCase,dataTypeCase:'preserve',functionCase:'preserve',identifierCase:'preserve',linesBetweenQueries:1});}catch(error){throw new SqlError('formatError: '+String(error.message).slice(0,400));}
 if(output.length>2*1024*1024)throw new SqlError('outputSize');
 return {output:output.trimEnd()+'\n',language,lines:(output.match(/\n/g)||[]).length+1};
}
const api={format,SqlError,MAX_BYTES};root.DifforaSql=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
