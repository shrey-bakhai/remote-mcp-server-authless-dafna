import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ADVISORS = {
  tim_cook: "Tim Cook would focus on operational excellence and long-term value. He'd ask: 'Does this align with our core mission? Will this delight customers 10 years from now?' His advice: Take a systematic approach, build operational capabilities gradually, and measure success with clear KPIs.",
  
  warren_buffett: "Warren Buffett would treat this as a capital allocation decision. He'd ask: 'Would you be comfortable with this for 10 years? What's the economic moat?' His advice: Focus on businesses with predictable cash flows and strong competitive advantages. If you can't understand it simply, don't do it.",
  
  maya_angelou: "Maya Angelou would focus on the human impact. She'd ask: 'What story does this tell about who you are? How will this help people grow?' Her advice: Lead with courage and authenticity. Make decisions that lift others up, not just generate profit.",
  
  jamie_dimon: "Jamie Dimon would stress-test for worst-case scenarios. He'd ask: 'What happens if everything goes wrong? Do you have the balance sheet to survive a downturn?' His advice: Build multiple scenarios and make sure you can survive the worst case.",
  
  charlie_munger: "Charlie Munger would invert the problem. He'd ask: 'What would cause this to fail completely? How might you be fooling yourself?' His advice: Use multiple mental models and create a checklist of potential failure modes.",
  
  art_gensler: "Art Gensler would reframe this as a design challenge. He'd ask: 'Who are we really serving? What would the most innovative solution look like?' His advice: Start with user research, create prototypes, and test before committing."
};

const server = new McpServer({
  name: "advisory-board",
  version: "1.0.0"
});

server.tool(
  "hold_board_meeting",
  "Get advice from your virtual advisory board on any business topic",
  {
    topic: z.string().describe("What business challenge do you need advice on?"),
    background: z.string().describe("Give context about your situation"), 
    advisors: z.array(z.enum(['tim_cook', 'warren_buffett', 'maya_angelou', 'jamie_dimon', 'charlie_munger', 'art_gensler']))
      .describe("Pick 2-4 advisors for the best meeting")
  },
  async ({ topic, background, advisors }) => {
    const responses = advisors.map(advisor => {
      const advice = ADVISORS[advisor as keyof typeof ADVISORS];
      return `**${advisor.replace('_', ' ').toUpperCase()}**: ${advice}`;
    }).join('\n\n');

    const summary = `# VIRTUAL BOARD MEETING

**Topic**: ${topic}
**Background**: ${background}

## ADVISOR RESPONSES:

${responses}

---
*Your virtual advisory board has spoken! Consider the different perspectives as you make your decision.*`;

    return {
      content: [{ type: "text", text: summary }]
    };
  }
);

server.tool(
  "list_advisors",
  "See who's on your advisory board",
  {},
  async () => {
    return {
      content: [{
        type: "text", 
        text: `Your Virtual Advisory Board:

• **Tim Cook** - Strategic leadership & operational excellence
• **Warren Buffett** - Investment philosophy & business fundamentals  
• **Maya Angelou** - Purpose-driven leadership & human impact
• **Jamie Dimon** - Risk management & crisis leadership
• **Charlie Munger** - Mental models & rational thinking
• **Art Gensler** - Innovation & design thinking

Use "hold_board_meeting" to get their advice on any business challenge!`
      }]
    };
  }
);

// For Cloudflare Workers
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.url.includes('/sse')) {
      // Handle MCP over Server-Sent Events
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      
      // Send MCP server info
      const serverInfo = {
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: "advisory-board",
            version: "1.0.0"
          }
        }
      };
      
      await writer.write(encoder.encode(`data: ${JSON.stringify(serverInfo)}\n\n`));
      
      // Handle incoming messages (simplified)
      if (request.method === 'POST') {
        const body = await request.text();
        const message = JSON.parse(body);
        
        if (message.method === 'tools/list') {
          const response = {
            jsonrpc: "2.0",
            id: message.id,
            result: {
              tools: [
                {
                  name: "hold_board_meeting",
                  description: "Get advice from your virtual advisory board on any business topic",
                  inputSchema: {
                    type: "object",
                    properties: {
                      topic: { type: "string", description: "What business challenge do you need advice on?" },
                      background: { type: "string", description: "Give context about your situation" },
                      advisors: {
                        type: "array",
                        items: { type: "string", enum: ['tim_cook', 'warren_buffett', 'maya_angelou', 'jamie_dimon', 'charlie_munger', 'art_gensler'] },
                        description: "Pick 2-4 advisors for the best meeting"
                      }
                    },
                    required: ["topic", "background", "advisors"]
                  }
                },
                {
                  name: "list_advisors",
                  description: "See who's on your advisory board",
                  inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                  }
                }
              ]
            }
          };
          await writer.write(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
        }
      }
      
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    return new Response('MCP Advisory Board Server Running', { status: 200 });
  }
};

// For local testing 
if (import.meta.main) {
  const transport = new StdioServerTransport();
  server.connect(transport);
}
