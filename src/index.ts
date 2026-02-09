#!/usr/bin/env node

/**
 * MCP Browser Automation Server
 * 
 * Provides browser automation capabilities for AI agents to interact with
 * websites like Messenger through Microsoft Edge.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { browserManager } from './browser.js';
import * as messenger from './tools/messenger.js';
import * as web from './tools/web.js';

// Create MCP server
const server = new Server(
    {
        name: 'mcp-browser-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define available tools
const TOOLS = [
    // Messenger tools
    {
        name: 'messenger_list_conversations',
        description: 'List recent Messenger conversations',
        inputSchema: {
            type: 'object' as const,
            properties: {},
            required: [],
        },
    },
    {
        name: 'messenger_search_conversation',
        description: 'Search for a Messenger conversation by name',
        inputSchema: {
            type: 'object' as const,
            properties: {
                query: { type: 'string', description: 'Search query for finding a conversation' },
            },
            required: ['query'],
        },
    },
    {
        name: 'messenger_send_message',
        description: 'Send a message to a Messenger conversation',
        inputSchema: {
            type: 'object' as const,
            properties: {
                conversationName: { type: 'string', description: 'Name of the conversation/contact' },
                message: { type: 'string', description: 'Message text to send' },
            },
            required: ['conversationName', 'message'],
        },
    },
    {
        name: 'messenger_read_messages',
        description: 'Read messages from the current Messenger conversation',
        inputSchema: {
            type: 'object' as const,
            properties: {
                count: { type: 'number', description: 'Number of messages to read (default: 20)' },
            },
            required: [],
        },
    },
    {
        name: 'messenger_send_file',
        description: 'Send a file to a Messenger conversation',
        inputSchema: {
            type: 'object' as const,
            properties: {
                conversationName: { type: 'string', description: 'Name of the conversation/contact' },
                filePath: { type: 'string', description: 'Absolute path to the file' },
            },
            required: ['conversationName', 'filePath'],
        },
    },
    {
        name: 'messenger_get_info',
        description: 'Get information about the current Messenger conversation',
        inputSchema: {
            type: 'object' as const,
            properties: {},
            required: [],
        },
    },
    // Web tools
    {
        name: 'web_navigate',
        description: 'Navigate to a URL in the browser',
        inputSchema: {
            type: 'object' as const,
            properties: {
                url: { type: 'string', description: 'The URL to navigate to' },
            },
            required: ['url'],
        },
    },
    {
        name: 'web_screenshot',
        description: 'Take a screenshot of the current page',
        inputSchema: {
            type: 'object' as const,
            properties: {
                fullPage: { type: 'boolean', description: 'Whether to capture the full page' },
            },
            required: [],
        },
    },
    {
        name: 'web_click',
        description: 'Click on an element by CSS selector',
        inputSchema: {
            type: 'object' as const,
            properties: {
                selector: { type: 'string', description: 'CSS selector of the element to click' },
            },
            required: ['selector'],
        },
    },
    {
        name: 'web_type',
        description: 'Type text into an input field',
        inputSchema: {
            type: 'object' as const,
            properties: {
                selector: { type: 'string', description: 'CSS selector of the input field' },
                text: { type: 'string', description: 'Text to type' },
            },
            required: ['selector', 'text'],
        },
    },
    {
        name: 'web_extract_text',
        description: 'Extract text content from the page or specific element',
        inputSchema: {
            type: 'object' as const,
            properties: {
                selector: { type: 'string', description: 'CSS selector (default: body)' },
            },
            required: [],
        },
    },
    {
        name: 'web_execute_js',
        description: 'Execute JavaScript on the current page',
        inputSchema: {
            type: 'object' as const,
            properties: {
                script: { type: 'string', description: 'JavaScript code to execute' },
            },
            required: ['script'],
        },
    },
    {
        name: 'web_wait_for',
        description: 'Wait for an element to appear on the page',
        inputSchema: {
            type: 'object' as const,
            properties: {
                selector: { type: 'string', description: 'CSS selector to wait for' },
                timeout: { type: 'number', description: 'Timeout in milliseconds (default: 5000)' },
            },
            required: ['selector'],
        },
    },
    {
        name: 'web_get_url',
        description: 'Get the current page URL',
        inputSchema: {
            type: 'object' as const,
            properties: {},
            required: [],
        },
    },
    {
        name: 'web_accessibility_snapshot',
        description: 'Get accessibility snapshot of the page for AI understanding',
        inputSchema: {
            type: 'object' as const,
            properties: {},
            required: [],
        },
    },
    {
        name: 'browser_close',
        description: 'Close the browser',
        inputSchema: {
            type: 'object' as const,
            properties: {},
            required: [],
        },
    },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result: unknown;

        switch (name) {
            // Messenger tools
            case 'messenger_list_conversations':
                result = await messenger.listConversations();
                break;
            case 'messenger_search_conversation':
                result = await messenger.searchConversation((args as { query: string }).query);
                break;
            case 'messenger_send_message':
                result = await messenger.sendMessage(
                    (args as { conversationName: string; message: string }).conversationName,
                    (args as { conversationName: string; message: string }).message
                );
                break;
            case 'messenger_read_messages':
                result = await messenger.readMessages((args as { count?: number }).count);
                break;
            case 'messenger_send_file':
                result = await messenger.sendFile(
                    (args as { conversationName: string; filePath: string }).conversationName,
                    (args as { conversationName: string; filePath: string }).filePath
                );
                break;
            case 'messenger_get_info':
                result = await messenger.getConversationInfo();
                break;
            // Web tools
            case 'web_navigate':
                result = await web.navigate((args as { url: string }).url);
                break;
            case 'web_screenshot':
                result = await web.screenshot((args as { fullPage?: boolean }).fullPage);
                break;
            case 'web_click':
                result = await web.click((args as { selector: string }).selector);
                break;
            case 'web_type':
                result = await web.type(
                    (args as { selector: string; text: string }).selector,
                    (args as { selector: string; text: string }).text
                );
                break;
            case 'web_extract_text':
                result = await web.extractText((args as { selector?: string }).selector);
                break;
            case 'web_execute_js':
                result = await web.executeJs((args as { script: string }).script);
                break;
            case 'web_wait_for':
                result = await web.waitFor(
                    (args as { selector: string; timeout?: number }).selector,
                    (args as { selector: string; timeout?: number }).timeout
                );
                break;
            case 'web_get_url':
                result = await web.getCurrentUrl();
                break;
            case 'web_accessibility_snapshot':
                result = await web.getAccessibilitySnapshot();
                break;
            case 'browser_close':
                await browserManager.close();
                result = { success: true };
                break;
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        if (error instanceof McpError) throw error;
        throw new McpError(
            ErrorCode.InternalError,
            `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Browser Server running on stdio');
}

main().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});
