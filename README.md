# MCP Browser Automation Server

An MCP (Model Context Protocol) server that enables AI agents to interact with websites through browser automation, with specialized support for Facebook Messenger.

## Features

### Messenger Tools
- `messenger_list_conversations` - List recent conversations
- `messenger_search_conversation` - Search for conversations
- `messenger_send_message` - Send text messages
- `messenger_read_messages` - Read conversation messages
- `messenger_send_file` - Send file attachments
- `messenger_get_info` - Get conversation info

### Web Tools
- `web_navigate` - Navigate to URLs
- `web_screenshot` - Capture screenshots
- `web_click` - Click elements
- `web_type` - Type into inputs
- `web_extract_text` - Extract page text
- `web_execute_js` - Run JavaScript
- `web_wait_for` - Wait for elements
- `web_get_url` - Get current URL
- `web_accessibility_snapshot` - Get accessibility tree
- `browser_close` - Close browser

## Installation

```bash
npm install
npm run build
```

## Configuration

1. Copy `.env.example` to `.env`
2. (Optional) Set `EDGE_USER_DATA_DIR` to use your existing Edge profile with saved logins

To find your Edge profile path:
1. Open Edge and go to `edge://version`
2. Copy the "Profile Path" value

## Usage

### With Antigravity AI

Add to your MCP server configuration:

```json
{
  "mcpServers": {
    "browser": {
      "command": "node",
      "args": ["c:/Users/User/Desktop/VSCode/MCP-Server/dist/index.js"]
    }
  }
}
```

### Testing with MCP Inspector

```bash
npm run inspector
```

## First Time Setup

1. Run the server - Microsoft Edge will open
2. Log in to Messenger manually in the browser window
3. The server will now be able to interact with your Messenger

## Notes

- Browser runs in visible mode for debugging/monitoring
- Uses Microsoft Edge (Chromium-based) by default
- Messenger selectors may need updates if Facebook changes their UI