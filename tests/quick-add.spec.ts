import { test, expect } from '@playwright/test';

test('Quick Add creates a new log and updates Recent', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="title"]', 'Playwright Test Log');
  await page.fill('textarea[name="reflection"]', 'This is a test reflection.');
  await page.fill('input[name="tags"]', 'test, playwright');
  await page.fill('input[name="timeSpent"]', '15');
  await page.click('button[data-testid="quickadd-submit"]');

  // Expect toast
  await expect(page.locator('div[role="status"]')).toHaveText(/Saved!/);

  // Expect new item in Recent
  await expect(page.locator('section:has(h2:has-text("Recent reflections")) li')).toContainText('Playwright Test Log');
});
