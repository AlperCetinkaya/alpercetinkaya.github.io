/* Infer C# models from JSON tokens without rounding numeric literals. */
(function(root){
'use strict';
const MAX_BYTES=2*1024*1024,KEYWORDS=new Set(('abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while record required file init global var dynamic async await yield partial').split(' '));
class ModelError extends Error{}
const fail=code=>{throw new ModelError(code);};
function validName(s){return /^[A-Za-z_][A-Za-z0-9_]*$/.test(s)&&!KEYWORDS.has(s);}
function identifier(s){const clean=s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^A-Za-z0-9]+/g,' ').trim();let name=clean.split(/\s+/).map(v=>v.charAt(0).toUpperCase()+v.slice(1)).join('')||'Property';if(/^\d/.test(name))name='Value'+name;return name;}
const literal=s=>JSON.stringify(s).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
function parse(text){
 try{JSON.parse(text);}catch(e){const err=new ModelError('syntax');err.detail=e.message.slice(0,300);throw err;}
 const tokens=text.match(/"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g)||[];let cursor=0,count=0;
 function node(depth){if(depth>64||++count>50000)fail('complexity');const t=tokens[cursor++];if(t==='{'||t==='['){const object=t==='{',values=object?new Map():[];while(tokens[cursor]!== (object?'}':']')){let key;if(object){key=JSON.parse(tokens[cursor++]);cursor++;if(values.has(key))fail('duplicate');}const value=node(depth+1);if(object)values.set(key,value);else values.push(value);if(tokens[cursor]===',')cursor++;}cursor++;return {kind:object?'object':'array',values};}return {kind:t[0]==='"'?'string':t==='null'?'null':t==='true'||t==='false'?'bool':'number',value:t};}return node(0);
}
function numberType(s){
 if(!/[.eE]/.test(s)){const n=BigInt(s);if(n>=-2147483648n&&n<=2147483647n)return 'int';if(n>=-9223372036854775808n&&n<=9223372036854775807n)return 'long';}
 const [mantissa,exp='0']=s.toLowerCase().split('e'),digits=mantissa.replace(/[-.]/g,''),fraction=(mantissa.split('.')[1]||'').length;let coefficient=BigInt(digits),scale=fraction-Number(exp);
 if(coefficient===0n)return 'decimal';
 while(scale>0&&coefficient%10n===0n){coefficient/=10n;scale--;}
 if(scale<0){if(-scale+coefficient.toString().length>29)return 'json';coefficient*=10n**BigInt(-scale);scale=0;}
 return scale<=28&&coefficient<=79228162514264337593543950335n?'decimal':'json';
}
function isDate(s){const m=s.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.(\d{1,7}))?(Z|[+-]\d\d:\d\d)$/);if(!m||+m[1]<1||+m[4]>23||+m[5]>59||+m[6]>59)return false;const d=new Date(0);d.setUTCFullYear(+m[1],+m[2]-1,+m[3]);if(d.getUTCFullYear()!==+m[1]||d.getUTCMonth()+1!==+m[2]||d.getUTCDate()!==+m[3])return false;const instant=Date.parse(s);return Number.isFinite(instant)&&instant>=-62135596800000&&instant<=253402300799999&&(m[8]==='Z'||(+m[8].slice(1,3)<=14&&+m[8].slice(4)<=59&&(+m[8].slice(1,3)!==14||+m[8].slice(4)===0)));}
function merge(a,b){
 if(a.kind==='unknown')return {...b,nullable:a.nullable||b.nullable};if(b.kind==='unknown'){a.nullable ||=b.nullable;return a;}
 const nullable=a.nullable||b.nullable;
 if(a.kind!==b.kind){const nums=['int','long','decimal'];if(nums.includes(a.kind)&&nums.includes(b.kind))return {kind:nums[Math.max(nums.indexOf(a.kind),nums.indexOf(b.kind))],nullable};if([a.kind,b.kind].every(k=>['string','date'].includes(k)))return {kind:'string',nullable};return {kind:'json',nullable};}
 a.nullable=nullable;
 if(a.kind==='array')a.item=merge(a.item,b.item);
 if(a.kind==='object'){
  for(const [key,value]of a.props){if(!b.props.has(key))value.nullable=true;else a.props.set(key,merge(value,b.props.get(key)));}
  for(const [key,value]of b.props)if(!a.props.has(key)){value.nullable=true;a.props.set(key,value);}
 }
 return a;
}
function generate(source,{className='Root',namespace='Diffora.Models',inferDates=false,attributes=true}={}){
 if(typeof source!=='string'||new TextEncoder().encode(source).length>MAX_BYTES)fail('size');if(typeof className!=='string'||className.length>80||!validName(className))fail('className');if(typeof namespace!=='string'||namespace.length>200||(namespace&&!namespace.split('.').every(validName)))fail('namespace');if(!namespace&&className==='System')fail('className');
 const warnings=[],seen=new Set(),counts=new Map();const warn=(code,path)=>{const key=code+':'+path;if(!seen.has(key)&&(counts.get(code)||0)<3){warnings.push({code,path:path.slice(0,200)});seen.add(key);counts.set(code,(counts.get(code)||0)+1);}};
 const tree=parse(source.replace(/^\uFEFF/,''));
 function infer(n){if(n.kind==='null')return {kind:'unknown',nullable:true};if(n.kind==='object')return {kind:'object',nullable:false,props:new Map([...n.values].map(([k,v])=>[k,infer(v)]))};if(n.kind==='array'){let item={kind:'unknown',nullable:false};for(const v of n.values)item=merge(item,infer(v));return {kind:'array',nullable:false,item};}return {kind:n.kind==='number'?numberType(n.value):n.kind==='string'&&inferDates&&isDate(JSON.parse(n.value))?'date':n.kind,nullable:false};}
 let schema=infer(tree),arrayRoot=false;
 if(schema.kind==='array'){arrayRoot=true;if(schema.item.kind!=='object')fail('root');schema=schema.item;}else if(schema.kind!=='object')fail('root');
 const classes=[],used=new Set([className]);let propertyTotal=0;
 const unique=(name,set)=>{let value=name,n=2;while(set.has(value))value=name+n++;set.add(value);return value;};
 const ref=name=>'global::'+(namespace?namespace+'.':'')+name;
 function emit(s,name,path,rootClass=false){
  if(s.kind==='object'){
   if(classes.length>=150||s.props.size>500)fail('complexity');const classId=rootClass?className:unique(identifier(name)+'Model',used),definition={name:classId,properties:[]};classes.push(definition);
   const propertyNames=new Set([classId,'Equals','GetHashCode','GetType','ToString','MemberwiseClone','ReferenceEquals','Finalize']);
   for(const [key,value]of s.props){if(++propertyTotal>3000)fail('complexity');const prop=unique(identifier(key),propertyNames),location=(path+'['+JSON.stringify(key)+']').slice(0,200);if(prop!==key)warn('renamed',location);const type=emit(value,prop,location);const reference=['object','array','string'].includes(value.kind);let init='';if(!value.nullable&&reference)init=value.kind==='string'?' = string.Empty;':value.kind==='array'?' = new();':' = null!;';definition.properties.push({key,prop,type,init});}
   return ref(classId)+(s.nullable?'?':'');
  }
  if(s.kind==='array')return 'global::System.Collections.Generic.List<'+emit(s.item,name+'Item',path+'[]')+'>'+(s.nullable?'?':'');
  const types={int:'int',long:'long',decimal:'decimal',bool:'bool',string:'string',date:'global::System.DateTimeOffset',json:'global::System.Text.Json.JsonElement',unknown:'global::System.Text.Json.JsonElement'};
  if(s.kind==='unknown')warn('unknown',path);if(s.kind==='json')warn('fallback',path);if(s.kind==='date')warn('date',path);if(['int','long','decimal'].includes(s.kind))warn('number',path);
  return types[s.kind]+(s.nullable?'?':'');
 }
 const elementType=emit(schema,className,'$',true),rootType=arrayRoot?'global::System.Collections.Generic.List<'+elementType+'>':elementType;
 let code='#nullable enable\n\n';if(namespace)code+='namespace '+namespace+';\n\n';code+='// Inferred from sample JSON. Review types against your API contract.\n// Root JSON type: '+rootType+'\n\n';
 for(const cls of classes){code+='public sealed class '+cls.name+'\n{\n';for(const p of cls.properties)code+=(attributes?'    [global::System.Text.Json.Serialization.JsonPropertyName('+literal(p.key)+')]\n':'')+'    public '+p.type+' '+p.prop+' { get; set; }'+p.init+'\n\n';code=code.trimEnd()+'\n}\n\n';if(code.length>500000)fail('complexity');}
 return {code:code.trimEnd()+'\n',rootType,warnings,classes:classes.length,className};
}
const api={generate,ModelError,MAX_BYTES};root.DifforaCSharp=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
