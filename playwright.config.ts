import { defineConfig, devices } from '@playwright/test';

const PORT = 8010;

export default defineConfig({
    testDir: './tests/e2e',
    globalSetup: './tests/e2e/helpers/global-setup.ts',
    workers: 1,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        timezoneId: 'Europe/Berlin',
        locale: 'en-GB',
        trace: 'retain-on-failure',
        contextOptions: { reducedMotion: 'reduce' },
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: `php -d variables_order=EGPCS -S 127.0.0.1:${PORT} -t public public/index.php`,
        port: PORT,
        env: { APP_ENV: 'test' },
        reuseExistingServer: false,
    },
});
