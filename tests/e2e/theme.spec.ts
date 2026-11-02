import { expect, test } from '@playwright/test';
import { seedWeights } from './helpers/database';

test.beforeEach(async ({ page }) => {
    seedWeights();
    await page.goto('/');
});

test('follows the operating system until a theme is chosen', async ({ page }) => {
    const light = page.getByRole('button', { name: 'Light theme' });
    const dark = page.getByRole('button', { name: 'Dark theme' });

    await expect(light).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await expect(light).toHaveAttribute('aria-pressed', 'false');
});

test('changes the colors', async ({ page }) => {
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const lightBackground = await background();

    await page.getByRole('button', { name: 'Dark theme' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(background).not.toBe(lightBackground);
});

test('remembers the choice after a reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Dark theme' }).click();
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');
});

test('keeps the choice between pages', async ({ page }) => {
    await page.getByRole('button', { name: 'Dark theme' }).click();
    await page.getByRole('navigation').getByRole('link', { name: 'Weight' }).click();
    await expect(page).toHaveURL('/weight');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveClass(/active/);
});

test('ignores the operating system once chosen', async ({ page }) => {
    await page.getByRole('button', { name: 'Light theme' }).click();
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'true');
});
