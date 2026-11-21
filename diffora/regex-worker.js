importScripts('regex-core.js?v=20261121');
onmessage=event=>{try{postMessage({ok:true,result:globalThis.DifforaRegex.execute(event.data)});}catch(error){postMessage({ok:false,error:error.message});}};
