import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const server = new McpServer({
  name: "Advisory Board",
  version: "1.0.0",
});

server.tool("get_advice", 
  {
    question: z.string().describe("Your business question")
  }, 
  async ({ question }) => {
    return {
      content: [{
        type: "text",
        text: `Advisory Board says: Here's advice for "${question}" - Tim Cook suggests operational excellence, Warren Buffett recommends long-term thinking, Maya Angelou emphasizes authentic leadership.`
      }]
    };
  }
);

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === "/sse") {
      const transport = new SSEServerTransport("/message", request);
      await server.connect(transport);
      return transport.response;
    }

    return new Response("MCP Server Ready");
  }
};
