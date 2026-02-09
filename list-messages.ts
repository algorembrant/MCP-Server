/**
 * Robust automation script to list Messenger conversations
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, 'dist', 'index.js');

async function listMessages() {
    const transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
    });

    const client = new Client(
        {
            name: 'list-messages-client',
            version: '1.0.0',
        },
        {
            capabilities: {},
        }
    );

    await client.connect(transport);

    console.log('Navigating to Messenger...');
    const navResult = await client.callTool({
        name: 'web_navigate',
        arguments: { url: 'https://www.messenger.com' },
    });
    console.log('Navigation result:', navResult.content[0].text);

    // Wait for page to stabilize
    console.log('Waiting for Messenger load...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('Retrieving Messenger conversations...');
    const result = await client.callTool({
        name: 'messenger_list_conversations',
        arguments: {},
    });

    console.log('RESULT:' + result.content[0].text);

    await transport.close();
}

listMessages().catch((err) => {
    console.error(err);
    process.exit(1);
});
