/**
 * General Web Interaction MCP Tools
 * Provides tools for interacting with any website
 */

import { z } from 'zod';
import { browserManager } from '../browser.js';

// Tool schemas
export const navigateSchema = z.object({
    url: z.string().url().describe('The URL to navigate to'),
});

export const screenshotSchema = z.object({
    fullPage: z.boolean().optional().default(false).describe('Whether to capture the full page'),
});

export const clickSchema = z.object({
    selector: z.string().describe('CSS selector of the element to click'),
});

export const typeSchema = z.object({
    selector: z.string().describe('CSS selector of the input field'),
    text: z.string().describe('Text to type'),
});

export const extractTextSchema = z.object({
    selector: z.string().optional().describe('CSS selector to extract text from (default: body)'),
});

export const executeJsSchema = z.object({
    script: z.string().describe('JavaScript code to execute on the page'),
});

export const waitForSchema = z.object({
    selector: z.string().describe('CSS selector to wait for'),
    timeout: z.number().optional().default(5000).describe('Timeout in milliseconds'),
});

/**
 * Navigate to a URL
 */
export async function navigate(url: string): Promise<{ success: boolean; title?: string; error?: string }> {
    try {
        const page = await browserManager.getPage();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const title = await page.title();
        return { success: true, title };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Take a screenshot of the current page
 */
export async function screenshot(fullPage: boolean = false): Promise<{
    success: boolean;
    base64?: string;
    error?: string
}> {
    try {
        const page = await browserManager.getPage();
        const buffer = await page.screenshot({ fullPage });
        const base64 = buffer.toString('base64');
        return { success: true, base64 };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Click on an element
 */
export async function click(selector: string): Promise<{ success: boolean; error?: string }> {
    try {
        const page = await browserManager.getPage();
        await page.click(selector);
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Type text into an input field
 */
export async function type(selector: string, text: string): Promise<{ success: boolean; error?: string }> {
    try {
        const page = await browserManager.getPage();
        await page.fill(selector, text);
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Extract text content from the page or specific element
 */
export async function extractText(selector?: string): Promise<{
    success: boolean;
    text?: string;
    error?: string
}> {
    try {
        const page = await browserManager.getPage();
        const element = selector ? await page.$(selector) : await page.$('body');

        if (!element) {
            return { success: false, error: `Element not found: ${selector || 'body'}` };
        }

        const text = await element.textContent();
        return { success: true, text: text?.trim() || '' };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Execute JavaScript on the page
 */
export async function executeJs(script: string): Promise<{
    success: boolean;
    result?: unknown;
    error?: string
}> {
    try {
        const page = await browserManager.getPage();
        const result = await page.evaluate(script);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Wait for an element to appear
 */
export async function waitFor(selector: string, timeout: number = 5000): Promise<{
    success: boolean;
    error?: string
}> {
    try {
        const page = await browserManager.getPage();
        await page.waitForSelector(selector, { timeout });
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Get the current page URL
 */
export async function getCurrentUrl(): Promise<{ url: string; error?: string }> {
    try {
        const page = await browserManager.getPage();
        return { url: page.url() };
    } catch (error) {
        return { url: '', error: String(error) };
    }
}

/**
 * List all open tabs in the current browser context
 */
export async function listTabs(): Promise<{
    tabs: { title: string; url: string; index: number }[];
    error?: string
}> {
    try {
        const page = await browserManager.getPage();
        const context = page.context();
        const pages = context.pages();

        const tabs = await Promise.all(pages.map(async (p, i) => ({
            title: await p.title(),
            url: p.url(),
            index: i
        })));

        return { tabs };
    } catch (error) {
        return { tabs: [], error: String(error) };
    }
}

/**
 * Switch to a specific tab by index
 */
export async function switchTab(index: number): Promise<{ success: boolean; error?: string }> {
    try {
        const page = await browserManager.getPage();
        const context = page.context();
        const pages = context.pages();

        if (index < 0 || index >= pages.length) {
            return { success: false, error: `Invalid tab index: ${index}` };
        }

        // In Playwright, we conceptually just "use" the other page object
        // For MCP, we'll tell the BrowserManager to update its active page
        await browserManager.setActivePage(pages[index]);

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Get page accessibility snapshot for AI understanding
 */
export async function getAccessibilitySnapshot(): Promise<{
    success: boolean;
    snapshot?: unknown;
    error?: string
}> {
    try {
        const page = await browserManager.getPage();
        // Use locator-based approach for accessibility info
        const bodyHandle = await page.$('body');
        if (!bodyHandle) {
            return { success: false, error: 'Could not get page body' };
        }

        // Get a simplified accessibility tree by extracting key elements
        const snapshot = await page.evaluate(() => {
            const getAccessibleTree = (element: Element, depth = 0): object | null => {
                if (depth > 5) return null;

                const role = element.getAttribute('role') || element.tagName.toLowerCase();
                const label = element.getAttribute('aria-label') ||
                    element.getAttribute('title') ||
                    (element as HTMLElement).innerText?.slice(0, 100);

                const children: object[] = [];
                for (const child of element.children) {
                    const childTree = getAccessibleTree(child as Element, depth + 1);
                    if (childTree) children.push(childTree);
                }

                return {
                    role,
                    name: label || undefined,
                    children: children.length > 0 ? children : undefined,
                };
            };

            return getAccessibleTree(document.body);
        });

        return { success: true, snapshot };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
