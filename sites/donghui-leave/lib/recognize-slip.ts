export async function recognizeSlip(file:File,onProgress:(message:string)=>void){
 const {createWorker}=await import('tesseract.js');let worker:Awaited<ReturnType<typeof createWorker>>|undefined;let pdf:any;
 try{
  onProgress('載入中文辨識工具…');worker=await createWorker('chi_tra+eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr',langPath:'/ocr',logger:m=>{if(m.status==='recognizing text')onProgress('辨識文字 '+Math.round(m.progress*100)+'%');}});
  if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
   const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/ocr/pdf.worker.min.mjs';pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;if(pdf.numPages>3)throw Error('每次請上傳 3 頁以內的假單 PDF');let text='';
   for(let n=1;n<=pdf.numPages;n++){onProgress(`辨識第 ${n} / ${pdf.numPages} 頁`);const page=await pdf.getPage(n);const base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2,2400/Math.max(base.width,base.height))});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvas,viewport}).promise;const result=await worker.recognize(canvas);text+=result.data.text+'\n';canvas.width=0;canvas.height=0;}return text.trim();
  }
  const bitmap=await createImageBitmap(file);const scale=Math.min(1,3000/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.ceil(bitmap.width*scale);canvas.height=Math.ceil(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const result=await worker.recognize(canvas);canvas.width=0;canvas.height=0;return result.data.text.trim();
 }finally{await worker?.terminate();await pdf?.destroy();}
}

