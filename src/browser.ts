/**
 * Browser Manager - Handles Playwright browser lifecycle
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { config } from './config.js';

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async initialize(): Promise<void> {
        // Launch Microsoft Edge (which is Chromium-based)
        this.browser = await chromium.launch({
            channel: config.browser.type === 'msedge' ? 'msedge' : undefined,
            headless: config.browser.headless,
        });

        // Create a persistent context if user data dir is specified
        if (config.browser.userDataDir) {
            this.context = await chromium.launchPersistentContext(
                config.browser.userDataDir,
                {
                    channel: config.browser.type === 'msedge' ? 'msedge' : undefined,
                    headless: config.browser.headless,
                }
            );
            this.page = this.context.pages()[0] || await this.context.newPage();
        } else {
            this.context = await this.browser.newContext();
            this.page = await this.context.newPage();
        }

        // Set default timeouts
        this.page.setDefaultTimeout(config.timeouts.action);
        this.page.setDefaultNavigationTimeout(config.timeouts.navigation);
    }

    async getPage(): Promise<Page> {
        if (!this.page) {
            await this.initialize();
        }
        return this.page!;
    }

    async close(): Promise<void> {
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async setActivePage(page: Page): Promise<void> {
        this.page = page;
        this.page.setDefaultTimeout(config.timeouts.action);
        this.page.setDefaultNavigationTimeout(config.timeouts.navigation);
    }

    isInitialized(): boolean {
        return this.page !== null;
    }
}

// Singleton instance
export const browserManager = new BrowserManager();
