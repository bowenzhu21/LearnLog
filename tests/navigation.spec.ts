import { test, expect } from '@playwright/test';

test('Navigation: View all and log detail', async ({ page }) => {
  await page.goto('/');
  await page.click('a[data-testid="recent-logs-view-all"]');
  await expect(page).toHaveURL(/\/logs$/);

  // Click first log card
  const firstLog = page.locator('ul li').first();
  await firstLog.click();

  // Expect URL to be /logs/[id] and title visible
  await expect(page).toHaveURL(/\/logs\//);
  await expect(page.locator('h1, h2')).toBeVisible();
});
