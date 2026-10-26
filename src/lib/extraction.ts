import * as pdfjs from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { Field, BoundingBox } from '../types';
pdfjs.GlobalWorkerOptions.workerSrc = worker;
export interface TextBox { text:string; box:BoundingBox; page:number; confidence?:number }
const clip = (n:number) => Math.max(0,Math.min(1,n));
export function inferFields(items:TextBox[], source:'pdf-text'|'ocr'):Field[] {
  const fields:Field[]=[];
  const patterns = [
    {key:'invoiceNumber',label:'Invoice number',labelRe:/invoice\s*(?:number|no\.?|#|id)\s*[:#-]?\s*(.*)/i,valueRe:/(?:[A-Z]{1,10}[-/]?)?\d[\w/-]*/i},
    {key:'invoiceDate',label:'Invoice date',labelRe:/(?:invoice\s*)?date\s*:?\s*(.*)/i,valueRe:/\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/},
    {key:'total',label:'Total amount',labelRe:/(?:grand\s+total|total\s+due|amount\s+due|balance\s+due|^total\b)\s*(?:\([A-Z]{3}\))?\s*:?\s*(.*)/i,valueRe:/(?:[$€£₹]|USD|INR|EUR|GBP)?\s*\d[\d,]*(?:\.\d{1,2})?/i},
  ];
  for(const pattern of patterns) {
    for(let i=0;i<items.length;i++) {
      const item=items[i];if(/subtotal/i.test(item.text))continue;
      const match=item.text.match(pattern.labelRe);if(!match)continue;
      let value=match[1]?.match(pattern.valueRe)?.[0]?.trim();let target=item;
      if(!value) {
        const candidates=items.filter((x,j)=>j!==i&&x.page===item.page&&((Math.abs(x.box.y-item.box.y)<Math.max(item.box.h,0.025)&&x.box.x>=item.box.x+item.box.w-0.02)||(x.box.y>item.box.y&&x.box.y-item.box.y<0.06&&Math.abs(x.box.x-item.box.x)<0.12)));
        const candidate=candidates.find(x=>pattern.valueRe.test(x.text));
        if(candidate){value=candidate.text.match(pattern.valueRe)?.[0]?.trim();target=candidate;}
      }
      if(!value)continue;
      if(pattern.key==='total')value=value.replace(/(?:USD|INR|EUR|GBP|[$€£₹])/gi,'').trim();
      if(pattern.key==='invoiceDate') {const iso=value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);if(iso)value=`${iso[1]}-${iso[2].padStart(2,'0')}-${iso[3].padStart(2,'0')}`;}
      fields.push({key:pattern.key,label:pattern.label,value,status:'pending',page:target.page,box:target.box,source,confidence:source==='ocr'?Math.round(target.confidence||0):undefined});break;
    }
  }
  return fields;
}
export async function extractPdf(url:string):Promise<{fields:Field[];pages:number;hasText:boolean}> {
  const task=pdfjs.getDocument({url});
  const pdf=await task.promise;
  try {
    if(pdf.numPages>100)throw Error('This PDF has more than 100 pages. Split it into smaller files first.');
    const items:TextBox[]=[];
    for(let n=1;n<=pdf.numPages;n++) {
      const page=await pdf.getPage(n), view=page.getViewport({scale:1}), content=await page.getTextContent();
      for(const raw of content.items) {
        if(!('str' in raw)||!raw.str.trim())continue;
        const t=pdfjs.Util.transform(view.transform,raw.transform), height=Math.max(Math.hypot(t[2],t[3]),8);
        const x=clip(t[4]/view.width), y=clip((t[5]-height)/view.height);
        items.push({text:raw.str, page:n, box:{x,y,w:Math.min(1-x,Math.max(raw.width/view.width,0.01)),h:Math.min(1-y,Math.max(height/view.height,0.01))}});
      }
    }
    return {fields:inferFields(items,'pdf-text'),pages:pdf.numPages,hasText:items.length>0};
  } finally {await task.destroy();}
}
export async function extractOcr(url:string, page:number, progress:(value:number)=>void):Promise<Field[]> {
  const {createWorker}=await import('tesseract.js');
  // Tesseract processes the image here. Only public engine/language files are fetched.
  const worker=await createWorker('eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr',workerBlobURL:false,logger:m=>{if(m.status==='recognizing text')progress(Math.round(m.progress*100));}});
  try {
    const result=await worker.recognize(url,{}, {blocks:true});
    const image=new Image();image.src=url;await image.decode();
    const items:TextBox[]=[];
    for(const block of result.data.blocks||[])for(const paragraph of block.paragraphs)for(const line of paragraph.lines) {
      const b=line.bbox;items.push({text:line.text,page,confidence:line.confidence,box:{x:clip(b.x0/image.width),y:clip(b.y0/image.height),w:clip((b.x1-b.x0)/image.width),h:clip((b.y1-b.y0)/image.height)}});
    }
    return inferFields(items,'ocr');
  } finally {await worker.terminate();}
}
