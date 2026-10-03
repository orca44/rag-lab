import {test,expect} from '@playwright/test';

test('dark mode follows the system and the toggle overrides it across reloads',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto('/');
 const background=()=>page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
 await expect.poll(background).toBe('rgb(17, 20, 18)');
 await page.getByRole('button',{name:'Switch to light mode'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect.poll(background).toBe('rgb(248, 249, 246)');
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect.poll(background).toBe('rgb(248, 249, 246)');
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await expect.poll(background).toBe('rgb(17, 20, 18)');
 await page.setViewportSize({width:390,height:844});
 await expect(page.getByRole('button',{name:'Switch to light mode'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
