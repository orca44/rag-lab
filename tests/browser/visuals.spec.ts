import {test,expect} from '@playwright/test';
import {examples} from '../../lib/examples';
import {patterns, retrieve} from '../../lib/rag';

test('each approach explains its steps',async({page})=>{
 await page.goto('/');
 await expect(page.getByLabel('Your question')).toBeEnabled();
 for(const p of patterns){
  await page.locator('.approach-card').filter({hasText:p.name}).click();
  await expect(page.locator('.pattern-title h2')).toHaveText(p.name);
  await expect(page.locator('.approach-steps li')).toHaveCount(4);
  await expect(page.locator('.approach-steps')).toContainText(p.stepNotes[1]);
  await expect(page.locator('.example-chips button')).not.toHaveCount(0);
 }
 await page.locator('.approach-card').filter({hasText:'Hybrid RAG'}).click();
 await page.getByLabel('Your question').fill('What should I check for alarm F-17 on AHU-7?');
 await page.getByRole('button',{name:'Run search'}).click();
 await expect(page.locator('.hit-list li').first()).toContainText('Alarm F-17 on AHU-7');
 await page.screenshot({path:'test-results/visual-hybrid-desktop.png',fullPage:true,animations:'disabled'});
});

test('score selection, source coverage and directed graph remain linked to evidence',async({page})=>{
 const first=retrieve('naive',examples[0].question,1).hits[0].doc;
 await page.goto('/');
 await page.getByLabel('Top K').selectOption('1');
 await page.getByRole('button',{name:'Run search'}).click();
 await expect(page.locator('.hit-list li')).toHaveCount(1);
 await expect(page.locator('.hit-list li')).toContainText(first.id);
 await page.locator('.hit-title').click();
 await expect(page.getByRole('dialog')).toContainText(first.text);
 await page.keyboard.press('Escape');
 await page.locator('.approach-card').filter({hasText:'Agentic RAG'}).click();
 await page.getByRole('button',{name:'Run search'}).click();
 await expect(page.locator('.result-steps')).toContainText('Retry with hybrid retrieval');
 await expect(page.locator('.hit-list li')).toHaveCount(1);
 await page.locator('.approach-card').filter({hasText:'Naive RAG'}).click();
 await page.getByRole('button',{name:'Compare approaches',exact:true}).click();
 await expect(page.locator('.source-matrix tbody tr')).toHaveCount(6);
 await expect(page.locator('.source-matrix tbody tr').first().locator('.matrix-cell')).toHaveCount(1);
 await page.getByRole('button',{name:`Naive RAG, ${first.title}, rank 1`,exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await page.screenshot({path:'test-results/visual-comparison-desktop.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Knowledge base 24'}).click();
 const beacon=page.getByRole('button',{name:'Select Chiller CH-1 (D08)',exact:true});
 await beacon.focus();await page.keyboard.press('Enter');
 await expect(beacon).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.graph-edge.selected')).toHaveCount(2);
 await page.locator('.graph-inspector').getByRole('button',{name:'D07 AHU-7 overview'}).click();
 await expect(page.locator('.graph-inspector h4')).toHaveText('AHU-7 overview');
 await page.screenshot({path:'test-results/visual-graph-desktop.png',fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/visual-graph-mobile.png',fullPage:true,animations:'disabled'});
});

test('reduced motion, mobile layouts and live capacity chart',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.locator('.approach-card').filter({hasText:'Multi-query RAG'}).click();
 await page.getByLabel('Your question').fill('Why is electricity use so high overnight?');
 await page.getByRole('button',{name:'Run search'}).click();
 await expect(page.locator('.query-fan code')).toHaveCount(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/visual-multi-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Production blueprint',exact:true}).click();
 await expect(page.locator('.capacity-chart svg')).toHaveAttribute('aria-label',/from 40 to 32 per second/);
 await page.getByLabel('Query variants').fill('3');
 await page.getByLabel('Authorized answer-cache hit rate').fill('80');
 await expect(page.locator('.capacity-chart svg')).toHaveAttribute('aria-label',/from 120 to 24 per second/);
 await expect(page.getByTestId('search-load')).toHaveText('24');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
