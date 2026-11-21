importScripts('csharp-core.js?v=20261121');
onmessage=event=>{try{postMessage({ok:true,result:globalThis.DifforaCSharp.generate(event.data.source,event.data.options)});}catch(error){postMessage({ok:false,error:error.message==='syntax'?'syntax: '+(error.detail||''):error.message});}};
