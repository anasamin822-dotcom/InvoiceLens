import {describe,it,expect,vi} from 'vitest';
vi.mock('pdfjs-dist',()=>({GlobalWorkerOptions:{}}));
import {inferFields} from '../src/lib/extraction';
const item=(text:string,x=.1,y=.1,page=1)=>({text,page,box:{x,y,w:.3,h:.025}});
describe('real text field inference',()=>{
 it('extracts labelled values and preserves source page/box',()=>{const fields=inferFields([item('Invoice Number: TEST-431'),item('Invoice Date: 2026/10/26',.1,.2),item('Total Due: USD 1,250.00',.1,.7,2)],'pdf-text');expect(fields.map(f=>f.value)).toEqual(['TEST-431','2026-10-26','1,250.00']);expect(fields[2].page).toBe(2);});
 it('never invents fields without matching document text',()=>{expect(inferFields([item('Welcome to our company')],'pdf-text')).toEqual([]);});
 it('does not choose subtotal as total',()=>{expect(inferFields([item('Subtotal: 450.00'),item('Total Due: 500.00',.1,.7)],'pdf-text').find(f=>f.key==='total')?.value).toBe('500.00');});
 it('finds neighbouring values with actual coordinates',()=>{const fields=inferFields([item('Invoice Number',.1,.1),item('AB-509',.5,.1)],'pdf-text');expect(fields[0].value).toBe('AB-509');expect(fields[0].box.x).toBe(.5);});
 it('labels OCR confidence as engine confidence, not field certainty',()=>{const fields=inferFields([{...item('Invoice No: OCR-204'),confidence:81.4}],'ocr');expect(fields[0].confidence).toBe(81);expect(fields[0].status).toBe('pending');});
});
