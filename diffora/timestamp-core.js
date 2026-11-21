/* Deterministic Unix timestamp and IANA wall-clock conversions. */
(function(root){
'use strict';
class TimestampError extends Error{}
const fail=key=>{throw new TimestampError(key);};
const formatter=zone=>{try{return new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});}catch{fail('zoneError');}};
function parts(ms,zone){const values={};for(const p of formatter(zone).formatToParts(new Date(ms)))if(p.type!=='literal')values[p.type]=Number(p.value);return values;}
function utc(p){const d=new Date(0);d.setUTCFullYear(p.year,p.month-1,p.day);d.setUTCHours(p.hour||0,p.minute||0,p.second||0,p.ms||0);return d.getTime();}
const pad=(v,n=2)=>String(v).padStart(n,'0');
function describe(ms,zone='UTC'){
 if(!Number.isSafeInteger(ms)||ms< -62135596800000||ms>253402300799999)fail('rangeError');
 const p=parts(ms,zone);if(p.year<1||p.year>9999)fail('rangeError');
 const milli=((ms%1000)+1000)%1000,offset=Math.round((utc(p)-(ms-milli))/60000),sign=offset<0?'-':'+';
 return {milliseconds:ms,seconds:ms/1000,iso:new Date(ms).toISOString(),local:`${pad(p.year,4)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}.${pad(milli,3)}`,offset:`UTC${sign}${pad(Math.floor(Math.abs(offset)/60))}:${pad(Math.abs(offset)%60)}`,zone};
}
function fromTimestamp(text,unit='auto',zone='UTC'){
 text=String(text).trim();if(!/^[+-]?\d+(?:\.\d{1,3})?$/.test(text)||text.length>24)fail('numberError');
 const n=Number(text);if(!Number.isFinite(n))fail('numberError');
 if(unit==='auto')unit=Math.abs(n)<1e11?'seconds':'milliseconds';
 if(!['seconds','milliseconds'].includes(unit))fail('numberError');
 if(unit==='milliseconds'&&!Number.isInteger(n))fail('integerError');
 const ms=unit==='seconds'?Math.round(n*1000):n;
 return {...describe(ms,zone),unit};
}
function fromDate(text,zone='UTC'){
 const m=String(text).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);if(!m)fail('dateError');
 const p={year:+m[1],month:+m[2],day:+m[3],hour:+m[4],minute:+m[5],second:+(m[6]||0),ms:+(m[7]||'').padEnd(3,'0')},wall=utc(p),d=new Date(wall);
 if(p.year<1||p.year>9999||d.getUTCFullYear()!==p.year||d.getUTCMonth()+1!==p.month||d.getUTCDate()!==p.day||p.hour>23||p.minute>59||p.second>59)fail('dateError');
 formatter(zone);
 // Collect offsets on either side of a possible daylight-saving transition.
 const offsets=new Set();for(let h=-36;h<=36;h+=6){const probe=wall+h*3600000;offsets.add(utc(parts(probe,zone))-probe+p.ms);}
 const matches=[];for(const offset of offsets){const candidate=wall-offset,q=parts(candidate,zone);if(['year','month','day','hour','minute','second'].every(k=>p[k]===q[k]))matches.push(candidate);}
 if(!matches.length)fail('missingTime');if(matches.length>1)fail('ambiguousTime');return describe(matches[0],zone);
}
const api={TimestampError,fromTimestamp,fromDate,describe};root.DifforaTimestamp=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
