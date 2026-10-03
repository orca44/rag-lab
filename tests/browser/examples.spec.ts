import {test,expect} from '@playwright/test';
import {examples} from '../../lib/examples';
import {documents} from '../../lib/rag';

test('worked comparisons explain actual evidence for every scenario',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:'Compare approaches',exact:true}).click();
 for(const example of examples){
  await page.getByRole('combobox',{name:'Example scenario',exact:true}).selectOption(example.id);
  await expect(page.getByLabel('Your question')).toHaveValue(example.question);
  await page.getByText('Reference answer and evidence',{exact:true}).click();
  await expect(page.locator('.example-detail details')).toContainText(example.answer);
  await expect(page.locator('.comparison-summary')).toContainText('distinct sources');
  await expect(page.locator('.source-matrix tbody tr')).toHaveCount(6);
 }
 await page.getByRole('combobox',{name:'Example scenario',exact:true}).selectOption('f18');
 await expect(page.locator('.comparison-summary')).toContainText('Agentic selected Hybrid RAG');
 await page.getByRole('button',{name:'Reranking RAG, Alarm F-18 on AHU-7, rank 1',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('loaded filter');
 await page.keyboard.press('Escape');
 await page.locator('.comparison-map').screenshot({path:'test-results/comparison-expanded-desktop.png'});
 expect(errors).toEqual([]);
});

test('comparison controls, source visibility and empty results stay consistent',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Compare approaches',exact:true}).click();
 await page.getByLabel('Show all').check();
 await expect(page.locator('.matrix-source-title')).toHaveCount(documents.length);
 await page.getByRole('combobox',{name:'Knowledge source',exact:true}).selectOption('Energy & controls');
 await expect(page.locator('.matrix-source-title')).toHaveCount(documents.filter(d=>d.category==='Energy & controls').length);
 await page.getByRole('combobox',{name:'Top K',exact:true}).selectOption('1');
 await page.getByRole('combobox',{name:'Example scenario',exact:true}).selectOption('extended');
 await expect(page.getByRole('combobox',{name:'Knowledge source',exact:true})).toHaveValue('All documents');
 await expect(page.getByRole('combobox',{name:'Top K',exact:true})).toHaveValue('3');
 await page.getByRole('combobox',{name:'Top K',exact:true}).selectOption('1');
 for(const row of await page.locator('.source-matrix tbody tr').all())await expect(row.locator('.matrix-cell')).toHaveCount(1);
 await page.getByLabel('Show all').uncheck();
 await page.getByLabel('Your question').fill('quantum penguins');
 await expect(page.locator('.comparison-empty')).toBeVisible();
 await expect(page.locator('.example-custom')).toBeVisible();
 await expect(page.getByText('Reference answer and evidence',{exact:true})).toHaveCount(0);
});

test('expanded examples, graph and ingestion work at narrow widths',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('button',{name:'Compare approaches',exact:true}).click();
 await page.getByRole('combobox',{name:'Example scenario',exact:true}).selectOption('commsroom');
 await page.getByText('Reference answer and evidence',{exact:true}).click();
 await expect(page.locator('.example-detail')).toContainText('network equipment may shut down');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.locator('.comparison-map').screenshot({path:'test-results/comparison-expanded-mobile.png'});
 await page.getByRole('button',{name:`Knowledge base ${documents.length}`,exact:true}).click();
 await page.getByLabel('Graph starting document').selectOption('D07');
 await page.locator('.graph-inspector').getByRole('button',{name:'D21 Comms room 305 cooling'}).click();
 await expect(page.locator('.graph-inspector')).toContainText('fan coil');
 for(const d of documents){await page.getByLabel('Graph starting document').selectOption(d.id);await expect(page.locator('.graph-node')).toHaveCount(d.links.length+1);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Learning labs',exact:true}).click();
 await page.getByRole('button',{name:'Ingestion',exact:true}).click();
 await page.getByLabel('Ingestion example').selectOption('errors');
 await expect(page.getByLabel('Source text')).toContainText('F-18');
 await expect(page.getByLabel('Context question')).toHaveValue('What should I check for alarm F-18 on AHU-7?');
 await page.getByLabel('Ingestion example').selectOption('versions');
 await expect(page.getByLabel('Source text')).toContainText('ARCHIVED');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
