(function(root){
function compareLines(left,right,ignore=false){
const a=left===''?[]:left.replace(/\r\n?/g,'\n').split('\n'),b=right===''?[]:right.replace(/\r\n?/g,'\n').split('\n');
const norm=s=>ignore?s.replace(/\s+/g,''):s,aa=a.map(norm),bb=b.map(norm);let start=0,end=0;
while(start<a.length&&start<b.length&&aa[start]===bb[start])start++;
while(end<a.length-start&&end<b.length-start&&aa[a.length-1-end]===bb[b.length-1-end])end++;
let n=a.length-start-end,m=b.length-start-end;
if((n+1)*(m+1)>12000000)throw Error('Bu dosyaların farklı bölümü çok büyük. Lütfen daha küçük bölümler halinde karşılaştırın (en fazla 12 milyon satır çifti).');
let dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=aa[start+i]===bb[start+j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
let ops=[];for(let i=0;i<start;i++)ops.push(['=',i,i]);let i=0,j=0;
while(i<n||j<m){if(i<n&&j<m&&aa[start+i]===bb[start+j]){ops.push(['=',start+i++,start+j++]);}else if(i<n&&(j===m||dp[i+1][j]>=dp[i][j+1]))ops.push(['-',start+i++,null]);else ops.push(['+',null,start+j++]);}
for(let k=end;k>0;k--)ops.push(['=',a.length-k,b.length-k]);
let rows=[];for(let k=0;k<ops.length;){if(ops[k][0]==='='){let o=ops[k++];rows.push({same:true,a:a[o[1]],b:b[o[2]],an:o[1]+1,bn:o[2]+1});}else{let del=[],add=[];while(k<ops.length&&ops[k][0]!=='='){let o=ops[k++];if(o[0]==='-')del.push(o[1]);else add.push(o[2]);}for(let x=0;x<Math.max(del.length,add.length);x++)rows.push({same:false,a:a[del[x]],b:b[add[x]],an:del[x]===undefined?null:del[x]+1,bn:add[x]===undefined?null:add[x]+1});}}
return rows;
}root.compareLines=compareLines;if(typeof module!=='undefined')module.exports=compareLines;
})(globalThis);
