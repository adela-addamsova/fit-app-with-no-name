import { expect, test } from '@playwright/test';
import { seedWeights } from './helpers/database';
import { calendarDay, daysAgo, longDate, monthYear } from './helpers/dates';
import { AddWeightDialog } from './pages/add-weight-dialog';

const today = daysAgo(0);
const lastMonth = daysAgo(32);

let form: AddWeightDialog;

test.beforeEach(async ({ page }) => {
    seedWeights();
    form = new AddWeightDialog(page);
    await form.open();
});

test('starts on today', async () => {
    const day = form.dialog.getByRole('button', { name: calendarDay(today), exact: true });

    await expect(form.monthTitle).toHaveText(monthYear(today));
    await expect(form.date).toHaveValue(today);
    await expect(day).toHaveAttribute('aria-pressed', 'true');
    await expect(day).toHaveClass(/today/);
    await expect(day).toHaveClass(/selected/);
});

test('does not allow the next month', async () => {
    await expect(form.nextMonth).toBeDisabled();
});

test('does not allow tomorrow', async ({ page }) => {
    const thisMonth = today.slice(0, 7);
    await page.clock.setFixedTime(`${thisMonth}-01T12:00:00Z`);
    await form.open();

    await expect(form.dialog.getByRole('button', { name: calendarDay(`${thisMonth}-02`), exact: true })).toBeDisabled();
});

test('moves between months', async () => {
    await form.previousMonth.click();
    await expect(form.monthTitle).not.toHaveText(monthYear(today));
    await expect(form.nextMonth).toBeEnabled();

    await form.nextMonth.click();
    await expect(form.monthTitle).toHaveText(monthYear(today));
    await expect(form.nextMonth).toBeDisabled();
});

test('starts a week on Monday', async () => {
    await expect(form.dialog.locator('.weekdays span').first()).toHaveText('Mo');

    const firstDay = await form.dialog.locator('[data-date-grid] button').first().getAttribute('data-date');
    const weekday = new Date(`${firstDay}T12:00:00Z`).getUTCDay();

    await expect(form.dialog.locator('[data-date-grid] > span')).toHaveCount((weekday + 6) % 7);
});

test('saves the picked day', async ({ page }) => {
    while ((await form.monthTitle.textContent()) !== monthYear(lastMonth)) {
        await form.previousMonth.click();
    }

    await form.dialog.getByRole('button', { name: calendarDay(lastMonth), exact: true }).click();
    await expect(form.date).toHaveValue(lastMonth);

    await form.weight.fill('70');
    await form.save.click();

    await expect(form.dialog).toBeHidden();
    await expect(page.locator('.hero .meta')).toHaveText(longDate(lastMonth));
});
