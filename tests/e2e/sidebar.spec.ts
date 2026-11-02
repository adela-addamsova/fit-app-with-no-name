import { expect, type Page, test } from '@playwright/test';
import { seedWeights } from './helpers/database';

const MIN_WIDTH = 192;
const MAX_WIDTH = 352;

const sidebarWidth = async (page: Page): Promise<number> => {
    const box = await page.getByRole('navigation').boundingBox();
    const width = box?.width ?? 0;

    return Math.round(width);
};

const dragTo = async (page: Page, x: number): Promise<void> => {
    const resizer = await page.locator('[data-sidebar-resizer]').boundingBox();
    if (!resizer) {
        throw new Error('The sidebar resizer is not visible');
    }

    const y = resizer.y + resizer.height / 2;
    await page.mouse.move(resizer.x + resizer.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(x, y, { steps: 5 });
    await page.mouse.up();
};

test.beforeEach(async ({ page }) => {
    seedWeights();
    await page.goto('/');
});

test('resizes by dragging', async ({ page }) => {
    await dragTo(page, 300);

    expect(await sidebarWidth(page)).toBe(300);
});

test('keeps the width within the limits', async ({ page }) => {
    await dragTo(page, 20);
    expect(await sidebarWidth(page)).toBe(MIN_WIDTH);

    await dragTo(page, 900);
    expect(await sidebarWidth(page)).toBe(MAX_WIDTH);
});

test('remembers the width after a reload', async ({ page }) => {
    await dragTo(page, 300);
    await page.reload();

    expect(await sidebarWidth(page)).toBe(300);
});

test('goes back to the default with a double click', async ({ page }) => {
    const defaultWidth = await sidebarWidth(page);

    await dragTo(page, 300);
    await page.locator('[data-sidebar-resizer]').dblclick();
    expect(await sidebarWidth(page)).toBe(defaultWidth);

    await page.reload();
    expect(await sidebarWidth(page)).toBe(defaultWidth);
});
