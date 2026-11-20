/* Rendering limits affect previews only, never copied or downloaded content. */
(function(root){
'use strict';
const limits={maxCharacters:32768,maxLines:200,maxLineCharacters:1000};
function preview(text,options={}){
 const {maxCharacters,maxLines,maxLineCharacters}={...limits,...options};const lines=[];let start=0,used=0,limited=false;
 while(start<=text.length&&lines.length<maxLines&&used<maxCharacters){
  let end=text.indexOf('\n',start);if(end<0)end=text.length;
  const stop=Math.min(end,start+maxLineCharacters,start+maxCharacters-used),value=text.slice(start,stop);const clipped=stop<end;
  lines.push({number:lines.length+1,text:value+(clipped?' …':''),clipped});used+=value.length;limited=limited||clipped;start=end+1;
 }
 return {lines,limited:limited||start<=text.length};
}
function countLines(text){let count=1,index=-1;while((index=text.indexOf('\n',index+1))!==-1)count++;return count;}
const api={preview,countLines,limits};root.DifforaPreview=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
