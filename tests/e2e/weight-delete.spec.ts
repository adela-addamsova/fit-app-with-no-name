import { expect, test } from '@playwright/test';
import { seedWeights } from './helpers/database';
import { daysAgo, shortDate } from './helpers/dates';
import { DeleteDialog } from './pages/delete-dialog';

const older = { date: daysAgo(5), weight: 72 };
const newer = { date: daysAgo(1), weight: 70 };
const olderLabel = `Weight 72.0 kg from ${shortDate(older.date)}`;
const newerLabel = `Weight 70.0 kg from ${shortDate(newer.date)}`;

let deleteDialog: DeleteDialog;

test.beforeEach(async ({ page }) => {
    seedWeights([older, newer]);
    deleteDialog = new DeleteDialog(page, 'weight');
    await page.goto('/weight');
});

test('shows a delete button for each entry', async ({ page }) => {
    await expect(page.getByRole('button', { name: `Delete ${olderLabel}` })).toBeVisible();
    await expect(page.getByRole('button', { name: `Delete ${newerLabel}` })).toBeVisible();
});

test('asks before deleting and names the entry', async ({ page }) => {
    await deleteDialog.openFor(olderLabel);

    await expect(deleteDialog.dialog).toBeVisible();
    await expect(deleteDialog.title).toHaveText('Delete entry?');
    await expect(deleteDialog.label).toHaveText(olderLabel);
    await expect(page.locator('.history .list li')).toHaveCount(2);
});

test('deletes the entry after confirming', async ({ page }) => {
    await deleteDialog.openFor(olderLabel);
    await deleteDialog.confirm.click();

    await expect(deleteDialog.dialog).toBeHidden();
    await expect(page.locator('.history .list .value')).toHaveText(['70.0 kg']);
    await expect(page.locator('.pill')).toHaveCount(0);
});

test('updates the current weight when the newest entry is deleted', async ({ page }) => {
    await deleteDialog.openFor(newerLabel);
    await deleteDialog.confirm.click();

    await expect(page.locator('.reading .value')).toHaveText('72.0kg');
});

test('shows the empty state after deleting every entry', async ({ page }) => {
    await deleteDialog.openFor(olderLabel);
    await deleteDialog.confirm.click();
    await expect(page.locator('.history .list li')).toHaveCount(1);

    await deleteDialog.openFor(newerLabel);
    await deleteDialog.confirm.click();

    await expect(page.locator('.history')).toContainText('No entries yet.');
    await expect(page.locator('.reading .value')).toHaveText('–');
});

test('keeps the entry on Cancel', async ({ page }) => {
    await deleteDialog.openFor(olderLabel);
    await deleteDialog.cancel.click();

    await expect(deleteDialog.dialog).toBeHidden();
    await expect(page.locator('.history .list li')).toHaveCount(2);
});

test('keeps the entry on Esc', async ({ page }) => {
    await deleteDialog.openFor(olderLabel);
    await page.keyboard.press('Escape');

    await expect(deleteDialog.dialog).toBeHidden();
    await expect(page.locator('.history .list li')).toHaveCount(2);
});

test('rejects a request without a CSRF token', async ({ page, request }) => {
    const response = await request.post('/weight', { form: { delete_id: '1' } });

    // 401 while there is no login, 403 once there is
    // TODO: delete 401 when login is done 
    expect([401, 403]).toContain(response.status());

    await page.reload();
    await expect(page.locator('.history .list li')).toHaveCount(2);
});
