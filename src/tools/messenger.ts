/**
 * Messenger-specific MCP Tools
 * Provides tools for interacting with Facebook Messenger
 */

import { z } from 'zod';
import { browserManager } from '../browser.js';
import { config } from '../config.js';

// Tool schemas
export const sendMessageSchema = z.object({
    conversationName: z.string().describe('Name of the conversation/contact to send message to'),
    message: z.string().describe('The message text to send'),
});

export const readMessagesSchema = z.object({
    count: z.number().optional().default(20).describe('Number of messages to read (default: 20)'),
});

export const searchConversationSchema = z.object({
    query: z.string().describe('Search query for finding a conversation'),
});

export const sendFileSchema = z.object({
    conversationName: z.string().describe('Name of the conversation/contact'),
    filePath: z.string().describe('Absolute path to the file to send'),
});

// Messenger selectors (may need updates as Messenger changes)
const SELECTORS = {
    searchInput: '[aria-label="Search Messenger"]',
    conversationList: '[role="navigation"] [role="row"]',
    messageInput: '[aria-label="Message"]',
    sendButton: '[aria-label="Press enter to send"]',
    messageList: '[role="main"] [role="row"]',
    fileInput: 'input[type="file"]',
    attachButton: '[aria-label="Attach a file"]',
};

/**
 * Navigate to Messenger and ensure we're logged in
 */
export async function ensureMessengerOpen(): Promise<{ success: boolean; error?: string }> {
    try {
        const page = await browserManager.getPage();
        const currentUrl = page.url();

        if (!currentUrl.includes('messenger.com')) {
            await page.goto(config.messenger.url);
            await page.waitForLoadState('networkidle');
        }

        // Check if we're on the login page
        const isLoginPage = await page.$('input[name="email"]');
        if (isLoginPage) {
            return {
                success: false,
                error: 'Please log in to Messenger manually in the browser window, then try again.'
            };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * List recent conversations
 */
export async function listConversations(): Promise<{ conversations: string[]; error?: string }> {
    try {
        const messengerStatus = await ensureMessengerOpen();
        if (!messengerStatus.success) {
            return { conversations: [], error: messengerStatus.error };
        }

        const page = await browserManager.getPage();

        // Get conversation names from the sidebar
        const conversations = await page.$$eval(
            SELECTORS.conversationList,
            (rows) => rows.slice(0, 20).map((row) => {
                const nameEl = row.querySelector('[dir="auto"]');
                return nameEl?.textContent?.trim() || '';
            }).filter(Boolean)
        );

        return { conversations };
    } catch (error) {
        return { conversations: [], error: String(error) };
    }
}

/**
 * Search for a conversation
 */
export async function searchConversation(query: string): Promise<{ results: string[]; error?: string }> {
    try {
        const messengerStatus = await ensureMessengerOpen();
        if (!messengerStatus.success) {
            return { results: [], error: messengerStatus.error };
        }

        const page = await browserManager.getPage();

        // Click search and type query
        const searchInput = await page.$(SELECTORS.searchInput);
        if (!searchInput) {
            return { results: [], error: 'Could not find search input' };
        }

        await searchInput.click();
        await searchInput.fill(query);
        await page.waitForTimeout(1000); // Wait for search results

        // Get search results
        const results = await page.$$eval(
            '[role="listbox"] [role="option"]',
            (options) => options.map((opt) => opt.textContent?.trim() || '').filter(Boolean)
        );

        // Clear search
        await searchInput.fill('');
        await page.keyboard.press('Escape');

        return { results };
    } catch (error) {
        return { results: [], error: String(error) };
    }
}

/**
 * Open a specific conversation
 */
async function openConversation(conversationName: string): Promise<{ success: boolean; error?: string }> {
    try {
        const page = await browserManager.getPage();

        // Search for the conversation
        const searchInput = await page.$(SELECTORS.searchInput);
        if (!searchInput) {
            return { success: false, error: 'Could not find search input' };
        }

        await searchInput.click();
        await searchInput.fill(conversationName);
        await page.waitForTimeout(1000);

        // Click the first result
        const firstResult = await page.$('[role="listbox"] [role="option"]');
        if (!firstResult) {
            return { success: false, error: `Could not find conversation: ${conversationName}` };
        }

        await firstResult.click();
        await page.waitForTimeout(500);

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
    conversationName: string,
    message: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const messengerStatus = await ensureMessengerOpen();
        if (!messengerStatus.success) {
            return { success: false, error: messengerStatus.error };
        }

        const openResult = await openConversation(conversationName);
        if (!openResult.success) {
            return openResult;
        }

        const page = await browserManager.getPage();

        // Find message input and send
        const messageInput = await page.$(SELECTORS.messageInput);
        if (!messageInput) {
            return { success: false, error: 'Could not find message input' };
        }

        await messageInput.click();
        await messageInput.fill(message);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Read messages from current conversation
 */
export async function readMessages(count: number = 20): Promise<{ messages: string[]; error?: string }> {
    try {
        const messengerStatus = await ensureMessengerOpen();
        if (!messengerStatus.success) {
            return { messages: [], error: messengerStatus.error };
        }

        const page = await browserManager.getPage();

        // Get messages from the current conversation
        const messages = await page.$$eval(
            SELECTORS.messageList,
            (rows, limit) => rows.slice(-limit).map((row) => {
                const text = row.textContent?.trim() || '';
                return text;
            }).filter(Boolean),
            count
        );

        return { messages };
    } catch (error) {
        return { messages: [], error: String(error) };
    }
}

/**
 * Send a file to a conversation
 */
export async function sendFile(
    conversationName: string,
    filePath: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const messengerStatus = await ensureMessengerOpen();
        if (!messengerStatus.success) {
            return { success: false, error: messengerStatus.error };
        }

        const openResult = await openConversation(conversationName);
        if (!openResult.success) {
            return openResult;
        }

        const page = await browserManager.getPage();

        // Click attach button and upload file
        const attachButton = await page.$(SELECTORS.attachButton);
        if (attachButton) {
            await attachButton.click();
        }

        // Set file input
        const fileInput = await page.$(SELECTORS.fileInput);
        if (!fileInput) {
            return { success: false, error: 'Could not find file input' };
        }

        await fileInput.setInputFiles(filePath);
        await page.waitForTimeout(1000);

        // Send the file
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Get information about the current conversation
 */
export async function getConversationInfo(): Promise<{
    name?: string;
    participants?: string[];
    error?: string;
}> {
    try {
        const messengerStatus = await ensureMessengerOpen();
        if (!messengerStatus.success) {
            return { error: messengerStatus.error };
        }

        const page = await browserManager.getPage();

        // Get conversation name from header
        const nameEl = await page.$('[role="main"] h1, [role="main"] [dir="auto"]');
        const name = await nameEl?.textContent() || undefined;

        return { name, participants: name ? [name] : [] };
    } catch (error) {
        return { error: String(error) };
    }
}
