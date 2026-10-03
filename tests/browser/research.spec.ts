import {test,expect} from '@playwright/test';
import {references} from '../../lib/research';

test('research provenance is accessible from results, assumptions and every approach',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.simulation-notice')).toContainText('no LLM');
 await page.getByRole('button',{name:'Run search'}).click();
 await expect(page.locator('.result-content .evidence-limit')).toContainText('does not check answerability');
 await page.getByRole('button',{name:'D01',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('Sample document.');
 await page.keyboard.press('Escape');
 for(const name of ['Naive RAG','Hybrid RAG','Reranking RAG','Multi-query RAG','Graph RAG','Agentic RAG']){
  await page.locator('.approach-card').filter({hasText:name}).click();
  await expect(page.locator('.pattern-details .pattern-evidence')).toContainText('Method details');
  await expect(page.locator('.pattern-details .pattern-evidence a')).toHaveCount(0);
 }
 await page.getByRole('button',{name:'Sources & limits',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Data and modeling assumptions'})).toBeVisible();
 for(const id of ['A1','A2','A3','A4','A5']) await expect(page.locator(`#assumption-${id}`)).toBeAttached();
 for(const ref of Object.values(references)){
  await expect(page.locator('.research-sources').getByRole('link',{name:ref.title+' ↗',exact:true})).toHaveAttribute('href',ref.url);
 }
 // References live only on Sources & limits, and all are arXiv papers.
 expect(Object.values(references).every(r=>r.url.startsWith('https://arxiv.org/abs/'))).toBeTruthy();
 for(const view of ['Playground','Learning labs','Compare approaches','Knowledge base 24','Production blueprint']){
  await page.getByRole('button',{name:view,exact:true}).click();
  await page.locator('details').evaluateAll(els=>els.forEach(e=>(e as HTMLDetailsElement).open=true));
  await expect(page.locator('main a[target="_blank"]')).toHaveCount(0);
 }
 await page.getByRole('button',{name:'Sources & limits',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Capabilities and limitations',exact:true})).toBeVisible();
 await page.screenshot({path:'test-results/research-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.locator('#assumption-A3').scrollIntoViewIfNeeded();
 await page.screenshot({path:'test-results/research-mobile.png'});
});

test('capacity figures disclose their budget and remain arithmetically consistent',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Production blueprint',exact:true}).click();
 await page.getByLabel('Incoming questions / second').fill('100');
 await page.getByLabel('Query variants').fill('3');
 await page.getByLabel('Authorized answer-cache hit rate').fill('50');
 const values=page.locator('.capacity-metrics strong');
 await expect(values).toHaveText(['300','2,500','150,000','200']);
 await expect(page.locator('.capacity-metrics')).toContainText('passages to rerank');
 await page.getByText('Assumptions, formulas and sizing limits',{exact:true}).click();
 await expect(page.getByText('Workload inputs are illustrative planning assumptions', {exact:false})).toBeVisible();
 await expect(page.getByText('Separate large-portfolio storage example', {exact:false})).toContainText('368.64 GB');
});
