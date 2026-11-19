(function(root){
// A bounded Myers search handles large documents with sparse changes.
function sparseDiff(a,b,start,n,m){
const limit=12000000,trace=[];let cells=0,work=0;
const fail=()=>{throw Error('Bu karşılaştırma işlem sınırını aşıyor. Lütfen dosyaları daha küçük bölümler halinde karşılaştırın.');};
const at=(frontier,k,d)=>k < -d||k>d?-1:frontier[k+d];
for(let d=0;d<=n+m;d++){
 cells+=2*d+1;if(cells>limit)fail();
 const current=new Int32Array(2*d+1);current.fill(-1);
 const previous=trace[d-1];
 for(let k=-d;k<=d;k+=2){
  if(++work>limit)fail();
  let x=d===0?0:(k===-d||(k!==d&&at(previous,k-1,d-1)<at(previous,k+1,d-1))?at(previous,k+1,d-1):at(previous,k-1,d-1)+1);
  let y=x-k;
  while(x<n&&y<m&&a[start+x]===b[start+y]){if(++work>limit)fail();x++;y++;}
  current[k+d]=x;
  if(x>=n&&y>=m){
   const reversed=[];let bx=n,by=m;
   for(let depth=d;depth>0;depth--){
    const frontier=trace[depth-1],diagonal=bx-by;
    const pk=diagonal===-depth||(diagonal!==depth&&at(frontier,diagonal-1,depth-1)<at(frontier,diagonal+1,depth-1))?diagonal+1:diagonal-1;
    const px=at(frontier,pk,depth-1),py=px-pk;
    while(bx>px&&by>py)reversed.push(['=',start+--bx,start+--by]);
    if(bx===px)reversed.push(['+',null,start+--by]);else reversed.push(['-',start+--bx,null]);
   }
   while(bx>0&&by>0)reversed.push(['=',start+--bx,start+--by]);
   return reversed.reverse();
  }
 }
 trace.push(current);
}
fail();
}
function compareLines(left,right,ignore=false){
const a=left===''?[]:left.replace(/\r\n?/g,'\n').split('\n'),b=right===''?[]:right.replace(/\r\n?/g,'\n').split('\n');
const norm=s=>ignore?s.replace(/\s+/g,''):s,aa=a.map(norm),bb=b.map(norm);let start=0,end=0;
while(start<a.length&&start<b.length&&aa[start]===bb[start])start++;
while(end<a.length-start&&end<b.length-start&&aa[a.length-1-end]===bb[b.length-1-end])end++;
let n=a.length-start-end,m=b.length-start-end;
let ops=[];for(let i=0;i<start;i++)ops.push(['=',i,i]);
if((n+1)*(m+1)>12000000){
for(const op of sparseDiff(aa,bb,start,n,m))ops.push(op);
}else{
let dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=aa[start+i]===bb[start+j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
let i=0,j=0;
while(i<n||j<m){if(i<n&&j<m&&aa[start+i]===bb[start+j]){ops.push(['=',start+i++,start+j++]);}else if(i<n&&(j===m||dp[i+1][j]>=dp[i][j+1]))ops.push(['-',start+i++,null]);else ops.push(['+',null,start+j++]);}
}
for(let k=end;k>0;k--)ops.push(['=',a.length-k,b.length-k]);
let rows=[];for(let k=0;k<ops.length;){if(ops[k][0]==='='){let o=ops[k++];rows.push({same:true,a:a[o[1]],b:b[o[2]],an:o[1]+1,bn:o[2]+1});}else{let del=[],add=[];while(k<ops.length&&ops[k][0]!=='='){let o=ops[k++];if(o[0]==='-')del.push(o[1]);else add.push(o[2]);}for(let x=0;x<Math.max(del.length,add.length);x++)rows.push({same:false,a:a[del[x]],b:b[add[x]],an:del[x]===undefined?null:del[x]+1,bn:add[x]===undefined?null:add[x]+1});}}
return rows;
}root.compareLines=compareLines;if(typeof module!=='undefined')module.exports=compareLines;
})(globalThis);

