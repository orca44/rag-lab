import {test,expect} from '@playwright/test';
import {evaluationCases} from '../../lib/labs';
import {documents} from '../../lib/rag';
import {datasetVersion} from '../../lib/examples';
import {readFile} from 'node:fs/promises';

test.beforeEach(async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Learning labs',exact:true}).click();});

test('evaluation labels, unsupported cases, citations and progress persistence',async({page})=>{
 await expect(page.getByRole('heading',{name:'A source count is not a quality score.'})).toBeVisible();
 await expect(page.locator('.lab-score')).toHaveCount(7);
 await page.getByRole('button',{name:'D01 · After-hours HVAC requests',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('one business day');await page.keyboard.press('Escape');
 await page.getByLabel('Relevance of D01').click();await expect(page.getByLabel('Relevance of D01')).toHaveAttribute('data-grade','0');
 await page.getByLabel('Evaluation question').selectOption('refund');
 await expect(page.locator('.lab-alert')).toContainText('do not apply');await expect(page.locator('.bar-na')).toHaveCount(14);
 await page.getByRole('group',{name:'Verdict for case 2'}).getByRole('button',{name:'Unsupported'}).click();await expect(page.locator('.lab-exercises [role=status]')).toContainText('Correct.');await expect(page.getByText('Unsupported: the citation never mentions cancellations or refunds.')).toBeVisible();
 await page.getByRole('button',{name:'Mark lesson complete',exact:true}).click();await expect(page.getByRole('progressbar',{name:'Learning progress'})).toHaveAttribute('value','1');
 await page.reload();await page.getByRole('button',{name:'Learning labs',exact:true}).click();await expect(page.getByRole('progressbar',{name:'Learning progress'})).toHaveAttribute('value','1');
 await page.screenshot({path:'test-results/labs-evaluation-desktop.png',fullPage:true});
});

test('ingestion boundaries and budget react to input',async({page})=>{
 await page.getByRole('button',{name:'Ingestion',exact:true}).click();
 await expect(page.locator('.lab-answer')).toContainText('was omitted');
 await page.getByLabel('Prompt budget (estimated tokens)').fill('250');await expect(page.locator('.lab-answer')).toContainText('is in the prompt');
 await page.getByLabel('Overlap (words)').fill('0');
 await page.getByLabel('Prompt budget (estimated tokens)').fill('60');
 await expect(page.locator('.lab-code')).not.toContainText('[C1]');
 await page.getByLabel('Prompt budget (estimated tokens)').fill('500');await expect(page.locator('.lab-code')).toContainText('[C1]');
 await page.getByLabel('Document version').selectOption('v1');await expect(page.getByText('A superseded version still enters context', {exact:false})).toBeVisible();
 await page.getByText('Edit or load source text').click();await page.getByLabel('Source text').fill('');await expect(page.locator('.lab-chunk-list article')).toHaveCount(0);
 await page.getByLabel('Load a public .txt or .md file').setInputFiles({name:'sample.txt',mimeType:'text/plain',buffer:Buffer.from('A public document loaded locally.')});
 await expect(page.getByLabel('Source text')).toHaveValue('A public document loaded locally.');
});

test('security controls and graph tools expose failures',async({page})=>{
 await page.getByRole('button',{name:'Security',exact:true}).click();
 await expect(page.locator('.security-gates .passed')).toHaveCount(1);
 await page.getByLabel('Enforce tenant scope').uncheck();await expect(page.locator('.security-gates .passed')).toHaveCount(2);
 await page.getByLabel('Requesting tenant').selectOption('South');await expect(page.getByText('Cache MISS:',{exact:false})).toBeVisible();
 await page.getByLabel('Scope cache by tenant and corpus revision').uncheck();await expect(page.getByText('Cache HIT:',{exact:false})).toBeVisible();
 await page.getByLabel('Proposed citation').selectOption('S99');await expect(page.getByText('Rejected: reference is absent from the allowed evidence.')).toBeVisible();
 await page.getByRole('button',{name:'Graph & tools',exact:true}).click();
 await page.getByLabel('Tool call budget').fill('1');await expect(page.getByText('Tool budget exhausted',{exact:false})).toBeVisible();
 await page.getByLabel('Tool call budget').fill('3');await page.getByLabel('Simulate failure on the second call').check();await expect(page.getByText('Tool failed; escalate',{exact:false})).toBeVisible();
});

test('measurements, queue, valid model imports and invalid inputs',async({page})=>{
 await page.getByRole('button',{name:'Operations',exact:true}).click();await page.getByRole('button',{name:'Measure browser retrieval'}).click();
 await expect(page.locator('.timing-bars > div')).toHaveCount(7);
 await page.getByLabel('Arrivals per second').fill('20');await page.getByLabel('Service time (milliseconds)').fill('100');await expect(page.getByText('1950 ms',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Model comparison',exact:true}).click();
 await page.getByRole('button',{name:'Score the local methods'}).click();await expect(page.locator('.labs table tbody tr')).toHaveCount(7);
 await page.reload();await page.getByRole('button',{name:'Learning labs',exact:true}).click();await page.getByRole('button',{name:'Model comparison',exact:true}).click();
 const file=page.getByLabel('Import measured runs (.json, up to 256 KB)');
 await file.setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('[{}]')});await expect(page.locator('.labs').getByRole('alert')).toContainText('Each run needs');
 const run={name:'Test fixture run',kind:'embeddings',model:'test-model',environment:'synthetic browser-test fixture, not measured',measuredAt:'2026-09-26T12:00:00Z',dataset:datasetVersion,topK:3,results:evaluationCases.map(c=>({caseId:c.id,ids:Object.keys(c.grades),latencyMs:10,inputTokens:20,outputTokens:5,costUsd:.001,answer:'Test answer'}))};
 await file.setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([run]))});
 await expect(page.getByRole('cell',{name:'100.0%',exact:true})).toHaveCount(2);await expect(page.getByRole('cell',{name:'$0.015000',exact:true})).toBeVisible();
 await page.getByText('Test fixture run: answers and retrieved IDs').click();await page.getByText('refund · no retrieved IDs',{exact:true}).click();await expect(page.locator('.run-answers details[open] .lab-code')).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download evaluation kit'}).click();const exported=await download;expect(exported.suggestedFilename()).toBe('rag-lab-evaluation-kit.json');
 const kit=JSON.parse(await readFile((await exported.path())!,'utf8'));
 expect(kit.dataset).toBe(datasetVersion);expect(kit.documents).toHaveLength(documents.length);
 expect(kit.cases.map((c:{id:string})=>c.id)).toEqual(evaluationCases.map(c=>c.id));
 expect(kit.schema.results.map((r:{caseId:string})=>r.caseId)).toEqual(evaluationCases.map(c=>c.id));
});

test('all lessons fit a narrow screen and remain keyboard operable',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const name of ['Evaluation','Ingestion','Security','Graph & tools','Operations','Model comparison']){
  await page.getByRole('button',{name,exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name).toBeTruthy();
  await page.screenshot({path:`test-results/labs-${name.replace(/[^a-z]/gi,'').toLowerCase()}-mobile.png`,fullPage:true});
 }
 await page.getByRole('button',{name:'Ingestion',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Watch a document become context.'})).toBeVisible();
});
