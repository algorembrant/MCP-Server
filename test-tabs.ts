/**
 * Test client to verify tab listing
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, 'dist', 'index.js');

async function test() {
    const transport = new StdioClientTransport({
        command: 'node',
        args: [serverPath],
    });

    const client = new Client(
        {
            name: 'test-client',
            version: '1.0.0',
        },
        {
            capabilities: {},
        }
    );

    await client.connect(transport);

    // Call list_tabs
    const result = await client.callTool({
        name: 'web_list_tabs',
        arguments: {},
    });

    console.log(JSON.stringify(result, null, 2));

    await transport.close();
}

test().catch(console.error);
