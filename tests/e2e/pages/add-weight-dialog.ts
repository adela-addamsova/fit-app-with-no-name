import type { Locator, Page } from '@playwright/test';

/**
 * The weight page's add dialog.
 */
export class AddWeightDialog {
    readonly dialog: Locator;
    readonly weight: Locator;
    readonly save: Locator;
    readonly error: Locator;
    readonly date: Locator;
    readonly monthTitle: Locator;
    readonly previousMonth: Locator;
    readonly nextMonth: Locator;

    constructor(private readonly page: Page) {
        this.dialog = page.locator('#add-weight');
        this.weight = this.dialog.getByLabel('Weight (kg)');
        this.save = this.dialog.getByRole('button', { name: 'Save' });
        this.error = this.dialog.locator('[data-field] > .error, [data-field] > ul');
        this.date = this.dialog.locator('[data-date-input]');
        this.monthTitle = this.dialog.locator('[data-date-title]');
        this.previousMonth = this.dialog.locator('[data-date-nav="-1"]');
        this.nextMonth = this.dialog.locator('[data-date-nav="1"]');
    }

    async open(): Promise<void> {
        await this.page.goto('/weight');
        await this.page.locator('[data-dialog-open="add-weight"]').click();
    }

    /**
     * Sets the date directly, without clicking through the calendar's months.
     */
    async setDate(ymd: string): Promise<void> {
        await this.date.evaluate((input: HTMLInputElement, value: string) => {
            input.value = value;
        }, ymd);
    }

    /**
     * Turns the browser checks off, so a submit reaches the server's validation.
     */
    async disableClientValidation(): Promise<void> {
        await this.dialog.locator('form').evaluate((form) => form.removeAttribute('data-validate'));
    }
}
