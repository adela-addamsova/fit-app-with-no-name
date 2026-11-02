import type { FullConfig } from '@playwright/test';
import { runConsole, seedWeights } from './database';

const CANARY_WEIGHT = 123.5;

/**
 * Stops the run if the server reads another database than the test.
 */
const checkServerUsesTestDatabase = async (baseURL: string): Promise<void> => {
    seedWeights([{ date: '2000-01-01', weight: CANARY_WEIGHT }]);

    const response = await fetch(`${baseURL}/weight`);
    const page = await response.text();

    if (!page.includes(`${CANARY_WEIGHT} kg`)) {
        throw new Error('The test server is not using the test database.');
    }
};

/**
 * Creates the test database and brings it to the latest migration.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
    runConsole('doctrine:database:create', '--if-not-exists');
    runConsole('doctrine:migrations:migrate', '--no-interaction', '--allow-no-migration');

    await checkServerUsesTestDatabase(config.projects[0].use.baseURL as string);
}
