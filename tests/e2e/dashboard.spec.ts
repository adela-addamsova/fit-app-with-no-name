import { expect, test } from '@playwright/test';
import { seedWeights } from './helpers/database';
import { daysAgo, shortDate } from './helpers/dates';

const card = '.card.summary';

test('invites to add the first weight', async ({ page }) => {
    seedWeights();
    await page.goto('/');

    await expect(page.locator(card)).toContainText('No entries yet. Add your first weight.');
});

test('shows a single weight without a trend', async ({ page }) => {
    seedWeights([{ date: daysAgo(3), weight: 70.2 }]);
    await page.goto('/');

    await expect(page.locator(`${card} .value`)).toHaveText('70.2kg');
    await expect(page.locator(card)).toContainText(shortDate(daysAgo(3)));
    await expect(page.locator(`${card} .pill`)).toHaveCount(0);
});

test('compares the two latest weights', async ({ page }) => {
    seedWeights([
        { date: daysAgo(10), weight: 90 },
        { date: daysAgo(5), weight: 72 },
        { date: daysAgo(1), weight: 70.5 },
    ]);
    await page.goto('/');

    await expect(page.locator(`${card} .value`)).toHaveText('70.5kg');
    await expect(page.locator(`${card} .pill`)).toHaveText('1.5 kg');
    await expect(page.locator(`${card} .pill`)).toHaveAttribute('data-trend', 'down');
});

test('opens the weight page from the card', async ({ page }) => {
    seedWeights();
    await page.goto('/');
    await page.locator(card).click();

    await expect(page).toHaveURL('/weight');
});
