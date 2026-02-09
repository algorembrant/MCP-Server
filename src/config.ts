/**
 * Configuration for MCP Browser Server
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file if it exists
function loadEnv(): Record<string, string> {
    const envPath = join(__dirname, '..', '.env');
    const env: Record<string, string> = {};

    if (existsSync(envPath)) {
        const content = readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key) {
                    env[key.trim()] = valueParts.join('=').trim();
                }
            }
        }
    }

    return env;
}

const env = loadEnv();

export const config = {
    browser: {
        type: (env.BROWSER_TYPE || 'msedge') as 'msedge' | 'chromium' | 'firefox',
        userDataDir: env.EDGE_USER_DATA_DIR || undefined,
        profile: env.EDGE_PROFILE || 'Default',
        headless: false, // Keep visible for debugging
    },
    timeouts: {
        navigation: parseInt(env.NAVIGATION_TIMEOUT || '30000', 10),
        action: parseInt(env.ACTION_TIMEOUT || '10000', 10),
    },
    messenger: {
        url: env.MESSENGER_URL || 'https://www.messenger.com',
    },
} as const;
