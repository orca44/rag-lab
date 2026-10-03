import {test,expect} from '@playwright/test';
import {scenarios} from '../../lib/building-scenarios';
import {examples} from '../../lib/examples';
import {patterns} from '../../lib/rag';

test('facilities evidence connects both ways and each companion resets the company query',async({page})=>{
 await page.goto('/');
 for(const scenario of scenarios){
  await page.getByLabel('Your question').fill('unrelated prior question');
  await page.getByLabel('Knowledge source').selectOption('Energy & controls');
  await page.getByRole('combobox',{name:'Top K',exact:true}).selectOption('1');
  await page.getByRole('button',{name:'Production blueprint',exact:true}).click();
  await page.getByRole('button',{name:'Browse facilities evidence in Knowledge base',exact:true}).click();
  await expect(page.getByRole('button',{name:'Facilities case studies (6)',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.facility-card')).toHaveCount(6);
  const card=page.locator('.facility-card').filter({has:page.getByRole('heading',{name:scenario.name,exact:true})});
  await card.getByText('Read case-study evidence',{exact:true}).click();
  await expect(card).toContainText(scenario.evidence);
  await expect(card).toContainText(scenario.answer);
  await card.getByRole('button').click();
  await expect(page.getByRole('button',{name:scenario.name,exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.scenario-detail')).toContainText(scenario.evidence);
  await page.getByTestId('enterprise-companion').click();
  await expect(page.getByLabel('Your question')).toHaveValue(examples.find(e=>e.id===scenario.companionId)!.question);
  await expect(page.getByLabel('Knowledge source')).toHaveValue('All documents');
  await expect(page.getByRole('combobox',{name:'Top K',exact:true})).toHaveValue('3');
  await expect(page.locator('.pattern-title h2')).toHaveText(patterns.find(p=>p.id===scenario.pattern)!.name);
 }
 await page.getByRole('button',{name:'Knowledge base 24',exact:true}).click();
 await page.getByRole('button',{name:'Building documents (24)',exact:true}).click();
 await expect(page.locator('.document-card')).toHaveCount(24);
 await page.getByRole('button',{name:'Facilities case studies (6)',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await page.locator('.facility-card').first().getByText('Read case-study evidence',{exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/facilities-library-mobile.png',fullPage:true});
});

test('shared retrieval settings and independent evaluation are explicit',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Your question').fill('F-18');
 await page.getByLabel('Knowledge source').selectOption('HVAC & plant');
 await page.getByRole('combobox',{name:'Top K',exact:true}).selectOption('5');
 await page.getByRole('button',{name:'Compare approaches',exact:true}).click();
 await expect(page.getByLabel('Your question')).toHaveValue('F-18');
 await expect(page.getByRole('combobox',{name:'Knowledge source',exact:true})).toHaveValue('HVAC & plant');
 await expect(page.getByRole('combobox',{name:'Top K',exact:true})).toHaveValue('5');
 await page.getByRole('button',{name:'Learning labs',exact:true}).click();
 await expect(page.locator('.workspace-scope')).toContainText('its own Top K and editable grades');
 await expect(page.getByLabel('Evaluation Top K')).toHaveValue('3');
 for(const [id,grade] of Object.entries(examples.find(e=>e.id==='notice')!.grades))for(let i=grade;i<3;i++)await page.getByLabel(`Relevance of ${id}`,{exact:true}).click();
 await expect(page.locator('.lab-alert')).toHaveCount(1);
 await expect(page.locator('.lab-alert').first()).toContainText('Missing grades alone do not establish');
 await page.getByRole('button',{name:'Sources & limits',exact:true}).click();
 await expect(page.locator('.data-row')).toHaveCount(3);
 await page.getByRole('button',{name:'Playground',exact:true}).click();
 await page.locator('.example-chips button').first().click();
 await expect(page.getByLabel('Knowledge source')).toHaveValue('All documents');
 await expect(page.getByRole('combobox',{name:'Top K',exact:true})).toHaveValue('3');
});
