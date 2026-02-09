/**
 * Automation script to navigate to Messenger and GitHub and list tabs
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, 'dist', 'index.js');

async function automate() {
    const transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
    });

    const client = new Client(
        {
            name: 'automation-client',
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

    console.log('Opening GitHub in a new tab...');
    await client.callTool({
        name: 'web_new_tab',
        arguments: { url: 'https://github.com' },
    });

    console.log('Listing tabs...');
    const result = await client.callTool({
        name: 'web_list_tabs',
        arguments: {},
    });

    console.log('RESULT:' + result.content[0].text);

    await transport.close();
}

automate().catch((err) => {
    console.error(err);
    process.exit(1);
});
