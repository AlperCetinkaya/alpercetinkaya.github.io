(function(root){
'use strict';
class RegexRunner{
 constructor(createWorker,timeout=2000){this.createWorker=createWorker;this.timeout=timeout;this.pending=null;}
 cancel(){if(this.pending)this.pending('cancelled');}
 run(payload){this.cancel();return new Promise((resolve,reject)=>{
  let worker,timer,finished=false;
  const finish=(error,result)=>{if(finished)return;finished=true;clearTimeout(timer);if(worker)worker.terminate();this.pending=null;error?reject(new Error(error)):resolve(result);};
  this.pending=finish;
  try{worker=this.createWorker();worker.onmessage=e=>e.data.ok?finish(null,e.data.result):finish(e.data.error||'workerError');worker.onerror=e=>{e.preventDefault?.();finish('workerError');};timer=setTimeout(()=>finish('timeout'),this.timeout);worker.postMessage(payload);}catch{finish('workerError');}
 });}
}
root.DifforaRegexRunner=RegexRunner;if(typeof module!=='undefined')module.exports=RegexRunner;
})(globalThis);
