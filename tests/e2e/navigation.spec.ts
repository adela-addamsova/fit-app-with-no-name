import { expect, test } from '@playwright/test';
import { seedWeights } from './helpers/database';

test.beforeEach(() => seedWeights());

test('shows the page name in the title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Overview · Fit App With No Name');

    await page.goto('/weight');
    await expect(page).toHaveTitle('Weight · Fit App With No Name');
});

test('moves between pages and marks the current one', async ({ page }) => {
    const nav = page.getByRole('navigation');
    const overview = nav.getByRole('link', { name: 'Overview' });
    const weight = nav.getByRole('link', { name: 'Weight' });

    await page.goto('/');
    await expect(overview).toHaveClass(/active/);
    await expect(weight).not.toHaveClass(/active/);

    await weight.click();
    await expect(page).toHaveURL('/weight');
    await expect(page.getByRole('heading', { name: 'Weight', level: 1 })).toBeVisible();
    await expect(weight).toHaveClass(/active/);
    await expect(overview).not.toHaveClass(/active/);
});

test('goes to the overview from the brand', async ({ page }) => {
    await page.goto('/weight');
    await page.getByRole('navigation').getByRole('link', { name: 'Fit App With No Name' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible();
});

test('shows unfinished sections as disabled', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');

    for (const name of ['Workouts', 'Food', 'Settings']) {
        await expect(nav.getByRole('link', { name })).toHaveCount(0);
        await expect(nav.locator('.link.disabled', { hasText: name })).toHaveAttribute('title', 'Coming soon');
    }
});
