import {test,expect} from '@playwright/test';

test('production blueprint scenarios, workload planning and pattern selection',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Production blueprint',exact:true}).click();
 await expect(page.getByRole('heading',{name:'From playground to production.'})).toBeVisible();
 await expect(page.locator('.scenario-detail')).toContainText('Harbor Tower handbook');
 for (const name of ['Building handbook','Equipment fault','Correct maintenance procedure','After-hours energy','Cooling outage impact','Hot meeting room']) {
  await page.getByRole('button',{name,exact:true}).click();
  await expect(page.locator('.scenario-detail')).toContainText('Example answer to the facilities team');
  await expect(page.locator('.scenario-detail')).toContainText('Why this RAG pattern fits');
 }
 await expect(page.locator('.scenario-detail')).toContainText('WO-812');
 await expect(page.getByTestId('search-load')).toHaveText('32');
 await page.getByLabel('Query variants').fill('3');
 await expect(page.getByTestId('search-load')).toHaveText('96');
 await page.getByLabel('Authorized answer-cache hit rate').fill('0');
 await expect(page.getByTestId('search-load')).toHaveText('120');
 await page.getByRole('button',{name:'Cooling outage impact',exact:true}).click();
 await expect(page.getByRole('button',{name:'Cooling outage impact',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByText('Follow feeds and zone-to-room links, capped at 3 hops / 200 nodes')).toBeVisible();
 await page.getByRole('button',{name:'Hot meeting room',exact:true}).click();
 await expect(page.getByText('Retrieve the approved procedure; stop after 3 tool calls or escalate')).toBeVisible();
 await page.getByRole('button',{name:'Open the Graph RAG scenario',exact:true}).click();
 await expect(page.getByRole('button',{name:'Cooling outage impact',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByText('Why this RAG pattern fits').click();
 await expect(page.locator('.scenario-detail')).toContainText('verified asset identities');
 await page.getByRole('button',{name:'Try it in Security',exact:true}).click();
 await expect(page.getByRole('heading',{name:'A relevant passage can still be unsafe.'})).toBeVisible();
 await page.getByRole('button',{name:'Production blueprint',exact:true}).click();
 await page.screenshot({path:'test-results/enterprise-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/enterprise-mobile.png',fullPage:true});
 await page.getByTestId('enterprise-companion').click();
 await expect(page.getByRole('heading',{name:'Graph RAG',exact:true})).toBeVisible();
});
test('explore retrieval, citations, comparison and knowledge base',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Less theory. More understanding.'})).toBeVisible();
 await page.screenshot({path:'test-results/playground-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Run search'}).click();await expect(page.locator('.result-status')).toContainText('documents kept');
 await page.getByRole('button',{name:'D01',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('one business day');
 await page.getByRole('button',{name:'Close document'}).click();
 await page.getByRole('button',{name:'Compare approaches',exact:true}).click();await expect(page.getByRole('heading',{name:'One question. Six perspectives.'})).toBeVisible();
 await expect(page.locator('.compare-steps article')).toHaveCount(6);
 await page.getByRole('button',{name:'Knowledge base 24'}).click();await expect(page.locator('.document-card')).toHaveCount(24);
});
test('mobile layout and no-match query',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByLabel('Your question').fill('quantum penguins');await page.getByRole('button',{name:'Run search'}).click();
 await expect(page.locator('.no-match')).toContainText('shares a word or concept');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/playground-mobile.png',fullPage:true});
});
