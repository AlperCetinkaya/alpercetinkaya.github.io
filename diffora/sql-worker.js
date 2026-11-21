importScripts('vendor/sql-engine.js?v=20261121','sql-core.js?v=20261121');
onmessage=event=>{try{postMessage({ok:true,result:globalThis.DifforaSql.format(event.data.source,event.data.options)});}catch(error){postMessage({ok:false,error:error.message});}};
