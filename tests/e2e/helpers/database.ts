import { execFileSync } from 'node:child_process';

type WeightEntry = { date: string; weight: number };

/**
 * Runs a Symfony console command in the test environment, which always uses the *_test database.
 */
export const runConsole = (...args: string[]): void => {
    const consoleArguments = ['bin/console', ...args];
    const environment = { ...process.env, APP_ENV: 'test' };

    execFileSync('php', consoleArguments, { env: environment });
};

/**
 * Replaces all weight entries with the ones given by test.
 */
export const seedWeights = (entries: WeightEntry[] = []): void => {
    let sql = 'TRUNCATE TABLE weight_entry;';

    for (const entry of entries) {
        sql += ` INSERT INTO weight_entry (weight, measured_at) VALUES (${entry.weight}, '${entry.date}');`;
    }

    runConsole('dbal:run-sql', sql);
};
