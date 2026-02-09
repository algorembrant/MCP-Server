/**
 * Script to take a screenshot and list tabs
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join, dirname } from 'path';
import { fileURLToPath, URL } from 'url';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, 'dist', 'index.js');

async function debug() {
    const transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
    });

    const client = new Client(
        {
            name: 'debug-client',
            version: '1.0.0',
        },
        {
            capabilities: {},
        }
    );

    await client.connect(transport);

    console.log('Navigating to Messenger...');
    await client.callTool({
        name: 'web_navigate',
        arguments: { url: 'https://www.messenger.com' },
    });

    console.log('Taking screenshot...');
    const result = await client.callTool({
        name: 'web_screenshot',
        arguments: { fullPage: true },
    });

    if (result.content && result.content[0].text) {
        const data = JSON.parse(result.content[0].text);
        if (data.base64) {
            const screenshotPath = join(__dirname, 'messenger_login_check.png');
            writeFileSync(screenshotPath, Buffer.from(data.base64, 'base64'));
            console.log('Screenshot saved to:', screenshotPath);
        }
    }

    await transport.close();
}

debug().catch(console.error);
