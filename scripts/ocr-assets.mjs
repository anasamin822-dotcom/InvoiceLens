import {mkdirSync,copyFileSync,readdirSync} from 'node:fs';
mkdirSync('public/ocr',{recursive:true});
copyFileSync('node_modules/tesseract.js/dist/worker.min.js','public/ocr/worker.min.js');
for(const name of readdirSync('node_modules/tesseract.js-core')) if(name.startsWith('tesseract-core')&&(name.endsWith('.js')||name.endsWith('.wasm')))copyFileSync(`node_modules/tesseract.js-core/${name}`,`public/ocr/${name}`);
copyFileSync('node_modules/tesseract.js-core/LICENSE','public/ocr/LICENSE-tesseract-core.txt');
copyFileSync('node_modules/tesseract.js/LICENSE.md','public/ocr/LICENSE-tesseract.txt');
