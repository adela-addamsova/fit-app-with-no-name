import { expect, type Locator, test } from '@playwright/test';
import { seedWeights } from './helpers/database';
import { daysAgo, longDate, monthYear, shortDate } from './helpers/dates';

/**
 * Waits until the chart animates and two reads in a row give the same picture.
 */
const finishedChartImage = async (canvas: Locator): Promise<string> => {
    let picture = '';
    await expect(async () => {
        const previous = picture;
        picture = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
        expect(picture).toBe(previous);
    }).toPass({ intervals: [300] });

    return picture;
};

/**
 * @returns The picture of an empty canvas of the same size
 */
const blankChartImage = (canvas: Locator): Promise<string> =>
    canvas.evaluate((element: HTMLCanvasElement) => {
        const empty = document.createElement('canvas');
        empty.width = element.width;
        empty.height = element.height;

        return empty.toDataURL();
    });

test('shows the empty state', async ({ page }) => {
    seedWeights();
    await page.goto('/weight');

    await expect(page.locator('.reading .value')).toHaveText('–');
    await expect(page.locator('.hero .meta')).toHaveText('No entries yet');
    await expect(page.locator('.history')).toContainText('No entries yet.');
    await expect(page.locator('.hero .placeholder')).toHaveText('Add at least two entries to see your trend');
    await expect(page.locator('[data-weight-chart]')).toHaveCount(0);
});

test('shows one entry without a chart or trend', async ({ page }) => {
    seedWeights([{ date: daysAgo(2), weight: 68.4 }]);
    await page.goto('/weight');

    await expect(page.locator('.reading .value')).toHaveText('68.4kg');
    await expect(page.locator('.hero .meta')).toHaveText(longDate(daysAgo(2)));
    await expect(page.locator('.hero .placeholder')).toBeVisible();
    await expect(page.locator('[data-chart-range]')).toHaveCount(0);
    await expect(page.locator('.pill')).toHaveCount(0);
});

test('shows the change since the previous entry', async ({ page }) => {
    seedWeights([
        { date: daysAgo(9), weight: 72 },
        { date: daysAgo(4), weight: 71 },
        { date: daysAgo(1), weight: 73.5 },
    ]);
    await page.goto('/weight');

    await expect(page.locator('.reading .value')).toHaveText('73.5kg');
    await expect(page.locator('.pill')).toHaveText(`2.5 kg since ${shortDate(daysAgo(4))}`);
    await expect(page.locator('.pill')).toHaveAttribute('data-trend', 'up');
});

test('shows a falling trend', async ({ page }) => {
    seedWeights([
        { date: daysAgo(4), weight: 71 },
        { date: daysAgo(1), weight: 70 },
    ]);
    await page.goto('/weight');

    await expect(page.locator('.pill')).toHaveAttribute('data-trend', 'down');
});

test('shows no trend arrow when the weight stayed the same', async ({ page }) => {
    seedWeights([
        { date: daysAgo(2), weight: 70 },
        { date: daysAgo(1), weight: 70 },
    ]);
    await page.goto('/weight');

    await expect(page.locator('.pill')).toContainText('0.0 kg');
    await expect(page.locator('.pill svg')).toHaveCount(0);
});

test('groups the history by month, newest first', async ({ page }) => {
    const dates = [daysAgo(70), daysAgo(35), daysAgo(0)];
    seedWeights(dates.map((date, index) => ({ date, weight: 70 + index })));
    await page.goto('/weight');

    await expect(page.locator('.history .month')).toHaveText(dates.toReversed().map(monthYear));
    await expect(page.locator('.history .list .value')).toHaveText(['72.0 kg', '71.0 kg', '70.0 kg']);
});

test('draws the chart', async ({ page }) => {
    seedWeights([
        { date: daysAgo(9), weight: 72 },
        { date: daysAgo(1), weight: 70 },
    ]);
    await page.goto('/weight');

    const canvas = page.locator('[data-weight-chart]');
    await expect(canvas).toBeVisible();

    expect(await finishedChartImage(canvas)).not.toBe(await blankChartImage(canvas));
});

test('draws the chart again after coming back to the page', async ({ page }) => {
    seedWeights([
        { date: daysAgo(9), weight: 72 },
        { date: daysAgo(1), weight: 70 },
    ]);
    await page.goto('/weight');
    const nav = page.getByRole('navigation');

    await nav.getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL('/');
    await nav.getByRole('link', { name: 'Weight' }).click();
    await expect(page).toHaveURL('/weight');

    const canvas = page.locator('[data-weight-chart]');
    expect(await finishedChartImage(canvas)).not.toBe(await blankChartImage(canvas));
});

test('redraws the chart when the theme changes', async ({ page }) => {
    seedWeights([
        { date: daysAgo(9), weight: 72 },
        { date: daysAgo(1), weight: 70 },
    ]);
    await page.goto('/weight');

    const canvas = page.locator('[data-weight-chart]');
    const lightPicture = await finishedChartImage(canvas);

    await page.getByRole('button', { name: 'Dark theme' }).click();

    expect(await finishedChartImage(canvas)).not.toBe(lightPicture);
});

test('shows a different period with each range button', async ({ page }) => {
    seedWeights([
        { date: daysAgo(400), weight: 95 },
        { date: daysAgo(200), weight: 85 },
        { date: daysAgo(60), weight: 75 },
        { date: daysAgo(20), weight: 72 },
        { date: daysAgo(1), weight: 70 },
    ]);
    await page.goto('/weight');

    const canvas = page.locator('[data-weight-chart]');
    const pictures = new Set<string>();

    for (const name of ['1M', '3M', '1Y', 'All']) {
        await page.getByRole('button', { name }).click();
        pictures.add(await finishedChartImage(canvas));
    }

    expect(pictures.size).toBe(4);
});

test('does not break on a range without entries', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));

    seedWeights([
        { date: daysAgo(100), weight: 72 },
        { date: daysAgo(95), weight: 70 },
    ]);
    await page.goto('/weight');

    const month = page.getByRole('button', { name: '1M' });
    const all = page.getByRole('button', { name: 'All' });
    const canvas = page.locator('[data-weight-chart]');
    const wholePicture = await finishedChartImage(canvas);

    await month.click();
    await expect(month).toHaveClass(/active/);
    await finishedChartImage(canvas);

    await all.click();
    expect(await finishedChartImage(canvas)).toBe(wholePicture);
    expect(errors).toEqual([]);
});

test('changes the chart with the range buttons', async ({ page }) => {
    seedWeights([
        { date: daysAgo(200), weight: 90 },
        { date: daysAgo(20), weight: 72 },
        { date: daysAgo(1), weight: 70 },
    ]);
    await page.goto('/weight');

    const canvas = page.locator('[data-weight-chart]');
    const all = page.getByRole('button', { name: 'All' });
    const month = page.getByRole('button', { name: '1M' });

    await expect(all).toHaveClass(/active/);
    const wholePicture = await finishedChartImage(canvas);

    await month.click();
    await expect(month).toHaveClass(/active/);
    await expect(all).not.toHaveClass(/active/);
    expect(await finishedChartImage(canvas)).not.toBe(wholePicture);

    await all.click();
    expect(await finishedChartImage(canvas)).toBe(wholePicture);
});

test('pins the header while scrolling', async ({ page }) => {
    seedWeights(Array.from({ length: 60 }, (_, index) => ({ date: daysAgo(index), weight: 70 })));
    await page.goto('/weight');

    const header = page.locator('[data-sticky-header]');
    await expect(header).not.toHaveClass(/pinned/);

    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(header).toHaveClass(/pinned/);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).not.toHaveClass(/pinned/);
});
