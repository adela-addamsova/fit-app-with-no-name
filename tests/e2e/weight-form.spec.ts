import { expect, test } from '@playwright/test';
import { seedWeights } from './helpers/database';
import { daysAgo, longDate } from './helpers/dates';
import { AddWeightDialog } from './pages/add-weight-dialog';

let form: AddWeightDialog;

test.beforeEach(async ({ page }) => {
    seedWeights();
    form = new AddWeightDialog(page);
    await form.open();
});

test.describe('dialog', () => {
    test('opens with the weight field focused', async () => {
        await expect(form.dialog).toBeVisible();
        await expect(form.weight).toBeFocused();
    });

    test('closes with the close button', async () => {
        await form.dialog.locator('[data-dialog-close]').click();
        await expect(form.dialog).toBeHidden();
    });

    test('closes with Esc', async ({ page }) => {
        await page.keyboard.press('Escape');
        await expect(form.dialog).toBeHidden();
    });

    test('closes on a click outside', async ({ page }) => {
        await page.mouse.click(5, 5);
        await expect(form.dialog).toBeHidden();
    });

    test('opens clean after closing with an error', async ({ page }) => {
        await form.weight.fill('0');
        await form.save.click();
        await expect(form.error).toBeVisible();

        await page.keyboard.press('Escape');
        await page.locator('[data-dialog-open="add-weight"]').click();

        await expect(form.weight).toHaveValue('');
        await expect(form.error).toHaveCount(0);
        await expect(form.weight).not.toHaveAttribute('aria-invalid');
    });

    test('opens clean after closing with a server error', async ({ page }) => {
        await form.disableClientValidation();
        await form.weight.fill('1000');
        await form.save.click();
        await expect(form.error).toBeVisible();

        await form.dialog.locator('[data-dialog-close]').click();
        await page.locator('[data-dialog-open="add-weight"]').click();

        await expect(form.weight).toHaveValue('');
        await expect(form.error).toHaveCount(0);
    });

    test('stays closed after going away and back', async ({ page }) => {
        await page.keyboard.press('Escape');
        await page.getByRole('navigation').getByRole('link', { name: 'Overview' }).click();
        await expect(page).toHaveURL('/');

        await page.goBack();
        await expect(page).toHaveURL('/weight');
        await expect(form.dialog).toBeHidden();
    });
});

test.describe('saving', () => {
    test('adds the entry and closes the dialog', async ({ page }) => {
        await form.weight.fill('71.2');
        await form.save.click();

        await expect(form.dialog).toBeHidden();
        await expect(page.locator('.reading .value')).toHaveText('71.2kg');
        await expect(page.locator('.hero .meta')).toHaveText(longDate(daysAgo(0)));
        await expect(page.locator('.history .list li')).toHaveCount(1);
    });

    test('saves with Enter', async ({ page }) => {
        await form.weight.fill('65');
        await page.keyboard.press('Enter');

        await expect(form.dialog).toBeHidden();
        await expect(page.locator('.reading .value')).toHaveText('65.0kg');
    });

    test('accepts both ends of the range', async ({ page }) => {
        await form.weight.fill('1');
        await form.save.click();
        await expect(page.locator('.reading .value')).toHaveText('1.0kg');

        await page.locator('[data-dialog-open="add-weight"]').click();
        await form.weight.fill('999.9');
        await form.save.click();
        await expect(form.dialog).toBeHidden();
        await expect(page.locator('.reading .value')).toHaveText('999.9kg');
    });

    test('replaces the entry of the same day', async ({ page }) => {
        await form.weight.fill('70');
        await form.save.click();
        await expect(page.locator('.reading .value')).toHaveText('70.0kg');

        await page.locator('[data-dialog-open="add-weight"]').click();
        await form.weight.fill('71.5');
        await form.save.click();

        await expect(page.locator('.reading .value')).toHaveText('71.5kg');
        await expect(page.locator('.history .list li')).toHaveCount(1);
        await expect(page.locator('.pill')).toHaveCount(0);
    });

    test('replaces the entry of a past day', async ({ page }) => {
        seedWeights([
            { date: daysAgo(5), weight: 70 },
            { date: daysAgo(1), weight: 75 },
        ]);
        await form.open();

        await form.weight.fill('71');
        await form.setDate(daysAgo(5));
        await form.save.click();

        await expect(form.dialog).toBeHidden();
        await expect(page.locator('.history .list .value')).toHaveText(['75.0 kg', '71.0 kg']);
    });

    test('keeps the newest day as the current weight when adding an older one', async ({ page }) => {
        seedWeights([{ date: daysAgo(1), weight: 75 }]);
        await form.open();

        await form.weight.fill('70');
        await form.setDate(daysAgo(5));
        await form.save.click();

        await expect(form.dialog).toBeHidden();
        await expect(page.locator('.reading .value')).toHaveText('75.0kg');
        await expect(page.locator('.pill')).toHaveAttribute('data-trend', 'up');
    });

    test('shows the entry on the overview', async ({ page }) => {
        await form.weight.fill('80');
        await form.save.click();
        await expect(form.dialog).toBeHidden();

        await page.getByRole('navigation').getByRole('link', { name: 'Overview' }).click();
        await expect(page.locator('.card.summary .value')).toHaveText('80.0kg');
    });
});

test.describe('browser validation', () => {
    test('requires a weight', async ({ page }) => {
        await form.save.click();

        await expect(form.error).toHaveText('Enter your weight.');
        await expect(form.dialog).toBeVisible();
        await expect(form.weight).toBeFocused();
        await expect(page.locator('.history .list li')).toHaveCount(0);
    });

    for (const value of ['0', '1000', '0.5', '07', '70.25', '1.', '.5', '1.2.3']) {
        test(`rejects ${value}`, async () => {
            await form.weight.fill(value);
            await form.save.click();

            await expect(form.error).toHaveText('Enter a weight between 1 and 999.9 kg.');
            await expect(form.dialog).toBeVisible();
        });
    }

    test('does not submit an invalid form', async ({ page }) => {
        let submitted = false;
        page.on('request', (request) => {
            submitted ||= request.method() === 'POST';
        });

        await form.weight.fill('0');
        await form.save.click();

        await expect(form.error).toBeVisible();
        expect(submitted).toBe(false);
    });

    test('links the error to the input for screen readers', async () => {
        await form.save.click();

        await expect(form.error).toHaveRole('alert');
        await expect(form.weight).toHaveAttribute('aria-invalid', 'true');
        await expect(form.weight).toHaveAccessibleDescription('Enter your weight.');
    });

    test('hides the error when typing', async () => {
        await form.save.click();
        await expect(form.error).toBeVisible();

        await form.weight.pressSequentially('7');

        await expect(form.error).toHaveCount(0);
        await expect(form.weight).not.toHaveAttribute('aria-invalid');
        await expect(form.weight).not.toHaveAttribute('aria-describedby');
    });

    test('does not move the layout when the error appears', async () => {
        const before = await form.dialog.boundingBox();

        await form.save.click();
        await expect(form.error).toBeVisible();

        expect(await form.dialog.boundingBox()).toEqual(before);
    });
});

test.describe('typing a weight', () => {
    test('allows only digits and dots', async () => {
        await form.weight.pressSequentially('7a8-b.5e');
        await expect(form.weight).toHaveValue('78.5');
    });

    test('turns a comma into a dot', async () => {
        await form.weight.pressSequentially('78,5');
        await expect(form.weight).toHaveValue('78.5');
    });

    test('keeps the cursor when typing in the middle of the value', async ({ page }) => {
        await form.weight.fill('785');
        await form.weight.press('ArrowLeft');
        await form.weight.press('ArrowLeft');
        await page.keyboard.type('6');

        await expect(form.weight).toHaveValue('7685');
    });
});

test.describe('server validation', () => {
    test.beforeEach(() => form.disableClientValidation());

    for (const value of ['0', '1000']) {
        test(`rejects ${value} and reopens the dialog`, async ({ page }) => {
            await form.weight.fill(value);
            await form.save.click();

            await expect(form.error).toHaveText('Enter a weight between 1 and 999.9 kg.');
            await expect(form.dialog).toBeVisible();
            await expect(page.locator('.history .list li')).toHaveCount(0);
        });
    }

    test('rounds a second decimal', async ({ page }) => {
        await form.weight.fill('70.25');
        await form.save.click();

        await expect(page.locator('.reading .value')).toHaveText('70.3kg');
    });

    test('rejects a blank weight', async () => {
        await form.save.click();

        await expect(form.error).toBeVisible();
        await expect(form.dialog).toBeVisible();
    });

    test('rejects a date in the future', async ({ page }) => {
        await form.weight.fill('70');
        await form.setDate(daysAgo(-1));
        await form.save.click();

        await expect(form.error).toBeVisible();
        await expect(form.dialog).toBeVisible();
        await expect(page.locator('.history .list li')).toHaveCount(0);
    });

    test('keeps what was entered after a rejection', async () => {
        await form.weight.fill('1000');
        await form.setDate(daysAgo(3));
        await form.save.click();

        await expect(form.error).toBeVisible();
        await expect(form.weight).toHaveValue('1000.0');
        await expect(form.date).toHaveValue(daysAgo(3));
    });
});

test.describe('CSRF protection', () => {
    const entry = { 'form[weight]': '70', 'form[measuredAt]': daysAgo(0) };

    test('rejects a request without a token', async ({ page, request }) => {
        const response = await request.post('/weight', { form: entry });

        expect(await response.text()).toContain('CSRF token is invalid');

        await page.goto('/weight');
        await expect(page.locator('.history .list li')).toHaveCount(0);
    });

    test('rejects a request from another site', async ({ page, request }) => {
        const response = await request.post('/weight', {
            form: entry,
            headers: { Origin: 'https://example.com' },
        });

        expect(await response.text()).toContain('CSRF token is invalid');

        await page.goto('/weight');
        await expect(page.locator('.history .list li')).toHaveCount(0);
    });
});
