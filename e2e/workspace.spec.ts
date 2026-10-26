import {test,expect} from '@playwright/test';
import path from 'node:path';
for(const width of [1440,390])test(`invoice review workflow at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});const suffix=Date.now()+String(width);
 await page.goto('/');await page.getByRole('button',{name:'New here? Create an account'}).click();
 await page.getByLabel('Username',{exact:true}).fill('reviewer'+suffix);await page.getByLabel('Password',{exact:true}).fill('Temporary-test-password-123');await page.getByRole('button',{name:'Create workspace'}).click();
 await expect(page.getByRole('heading',{name:'Make every field count.'})).toBeVisible();
 await page.screenshot({path:`/tmp/invoicelens-empty-${width}.png`,fullPage:true});
 await page.locator('input[type=file]').setInputFiles(path.resolve('e2e/sample-invoice.pdf'));
 await expect(page.getByRole('heading',{name:'sample-invoice.pdf'})).toBeVisible();await expect(page.getByText('Page 1 / 2',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Extract PDF text',exact:true}).click();
 await expect(page.getByLabel('Value for Invoice number',{exact:true})).toHaveValue('TEST-2026-001');await expect(page.getByLabel('Value for Invoice date',{exact:true})).toHaveValue('2026-10-26');await expect(page.getByLabel('Value for Total amount',{exact:true})).toHaveValue('1250.00');
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await expect(page.getByRole('button',{name:'125%',exact:true})).toBeVisible();await page.getByRole('button',{name:'125%',exact:true}).click();await page.getByRole('button',{name:'Approve value'}).first().click();await page.getByRole('button',{name:'Save changes',exact:true}).click();await expect(page.getByText('Review saved to the server.',{exact:true})).toBeVisible();
 await page.screenshot({path:`/tmp/invoicelens-review-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.reload();await page.getByRole('button',{name:/sample-invoice.pdf/}).click();await expect(page.getByLabel('Value for Invoice number',{exact:true})).toHaveValue('TEST-2026-001');await expect(page.getByRole('button',{name:'✓ Approved',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.getByText('Page 2 / 2',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Highlight Invoice number',exact:true})).toHaveCount(0);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON',exact:true}).click();expect((await download).suggestedFilename()).toContain('review.json');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible();
});
test('local image OCR reads real text, no mocked extraction',async({page})=>{
 test.setTimeout(120000);await page.goto('/');await page.getByRole('button',{name:'New here? Create an account'}).click();await page.getByLabel('Username',{exact:true}).fill('ocr'+Date.now());await page.getByLabel('Password',{exact:true}).fill('Temporary-test-password-123');await page.getByRole('button',{name:'Create workspace'}).click();
 await page.locator('input[type=file]').setInputFiles(path.resolve('e2e/ocr-invoice.png'));await expect(page.getByRole('heading',{name:'ocr-invoice.png'})).toBeVisible();await page.getByRole('button',{name:'Read image (OCR)',exact:true}).click();await expect(page.getByLabel('Value for Invoice number',{exact:true})).toHaveValue('OCR-90210',{timeout:100000});await expect(page.getByLabel('Value for Total amount',{exact:true})).toHaveValue('584.50');await page.screenshot({path:'/tmp/invoicelens-ocr.png',fullPage:true});
});
test('manual fields, drawing, invalid upload and deletion',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'New here? Create an account'}).click();await page.getByLabel('Username',{exact:true}).fill('manual'+Date.now());await page.getByLabel('Password',{exact:true}).fill('Temporary-test-password-123');await page.getByRole('button',{name:'Create workspace'}).click();
 await page.locator('input[type=file]').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await expect(page.getByRole('alert')).toContainText('invalid file');
 await page.locator('input[type=file]').setInputFiles(path.resolve('e2e/ocr-invoice.png'));await page.getByRole('button',{name:'Draw box',exact:true}).click();const paper=page.locator('.paper');const rect=await paper.boundingBox();if(!rect)throw Error('No document');await page.mouse.move(rect.x+50,rect.y+70);await page.mouse.down();await page.mouse.move(rect.x+200,rect.y+110,{steps:10});await page.mouse.up();await page.getByLabel('Field label',{exact:true}).fill('Vendor');await page.getByLabel('Extracted value',{exact:true}).fill('Fictional vendor');await page.getByRole('button',{name:'Apply Box',exact:true}).click();await expect(page.getByLabel('Value for Vendor')).toHaveValue('Fictional vendor');await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.reload();await page.getByRole('button',{name:/ocr-invoice.png/}).click();await expect(page.getByLabel('Value for Vendor')).toHaveValue('Fictional vendor');page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete document',exact:true}).click();await expect(page.getByRole('heading',{name:'Make every field count.'})).toBeVisible();
});
