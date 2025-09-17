import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Board member personas
const BOARD_MEMBERS = {
  "tim-cook": {
    name: "Tim Cook",
    role: "Chief Executive Officer",
    expertise: ["Operational Excellence", "Supply Chain Management", "Sustainable Innovation", "Privacy Leadership"],
    philosophy: "Focus on operational excellence, user privacy, environmental responsibility, and long-term value creation.",
    approach: "Questions first, then systematic problem-solving"
  },
  "warren-buffett": {
    name: "Warren Buffett",
    role: "Investment Philosophy Advisor", 
    expertise: ["Value Investing", "Business Analysis", "Long-term Strategy", "Risk Assessment"],
    philosophy: "Invest in businesses you understand, with strong moats, run by good people, at reasonable prices.",
    approach: "Teaching through stories and examples"
  },
  "maya-angelou": {
    name: "Maya Angelou",
    role: "Leadership Wisdom & Human Connection Advisor",
    expertise: ["Authentic Leadership", "Communication Excellence", "Resilience Building", "Human Dignity"],
    philosophy: "Lead with courage, authenticity, and deep respect for human dignity.",
    approach: "Deep listening first, then guidance"
  },
  "jamie-dimon": {
    name: "Jamie Dimon", 
    role: "Financial Strategy & Risk Management Advisor",
    expertise: ["Banking Excellence", "Risk Management", "Crisis Leadership", "Regulatory Navigation"],
    philosophy: "Disciplined risk management, strong capital position, and long-term relationship building.",
    approach: "Challenge assumptions, demand details"
  },
  "charlie-munger": {
    name: "Charlie Munger",
    role: "Mental Models & Critical Thinking Advisor", 
    expertise: ["Multidisciplinary Thinking", "Cognitive Bias Recognition", "Decision Science", "Contrarian Analysis"],
    philosophy: "Use mental models from multiple disciplines to avoid cognitive biases and make better decisions.",
    approach: "Devil's advocate who challenges everything"
  },
  "art-gensler": {
    name: "Art Gensler",
    role: "Design Strategy & Client Experience Advisor",
    expertise: ["Design Excellence", "Client Relationship Building", "Brand Environment Creation", "Human-Centered Design"],
    philosophy: "Design should serve people and create meaningful experiences that enhance human potential.",
    approach: "Understand the user experience first"
  }
};

export class AdvisoryBoardMCP extends McpAgent {
  server = new McpServer({
    name: "Advisory Board",
    version: "1.0.0",
  });

  async init() {
    // Tool for getting individual advisor input
    this.server.tool("get_advisor_input", 
      {
        member: z.string().describe("Board member name (tim-cook, warren-buffett, maya-angelou, jamie-dimon, charlie-munger, art-gensler)"),
        situation: z.string().describe("Description of the business situation or challenge"),
        specific_question: z.string().optional().describe("Optional specific question to ask the advisor")
      }, 
      async ({ member, situation, specific_question }) => {
        const advisor = BOARD_MEMBERS[member.toLowerCase().replace(/[\s-]/g, '-')];
        
        if (!advisor) {
          return {
            content: [{
              type: "text",
              text: `Board member "${member}" not found. Available advisors: ${Object.keys(BOARD_MEMBERS).join(', ')}`
            }]
          };
        }

        const prompt = `PERSONA: ${advisor.name} - ${advisor.role}

EXPERTISE: ${advisor.expertise.join(', ')}
PHILOSOPHY: ${advisor.philosophy}
APPROACH: ${advisor.approach}

SITUATION: ${situation}
${specific_question ? `SPECIFIC QUESTION: ${specific_question}` : ''}

Respond as ${advisor.name} would, providing specific, actionable advice based on your expertise and decision-making approach. Stay completely in character with your communication style.`;

        return {
          content: [{
            type: "text",
            text: prompt
          }]
        };
      }
    );

    // Tool for convening a board meeting
    this.server.tool("convene_board_meeting",
      {
        topic: z.string().describe("Main topic for the board meeting"),
        context: z.string().describe("Background context and details for the meeting"),
        urgency: z.enum(["low", "medium", "high"]).default("medium").describe("Urgency level of the meeting")
      },
      async ({ topic, context, urgency }) => {
        const prompt = `VIRTUAL BOARD MEETING - ${topic.toUpperCase()}

CONTEXT: ${context}
URGENCY: ${urgency}

Board Members Present:
${Object.entries(BOARD_MEMBERS).map(([key, advisor]) => 
  `• ${advisor.name} (${advisor.role}) - ${advisor.expertise.slice(0, 2).join(', ')}`
).join('\n')}

MEETING STRUCTURE:
1. SITUATION ANALYSIS - What are we really dealing with?
2. INDIVIDUAL PERSPECTIVES - Each advisor provides their unique lens
3. RISK & OPPORTUNITY ASSESSMENT - What could go right/wrong?
4. ACTIONABLE RECOMMENDATIONS - Specific next steps
5. SUCCESS METRICS - How will we measure progress?

Each advisor should provide their unique perspective, ask clarifying questions, and give specific advice based on their expertise. Format as a structured board meeting with clear sections for each advisor's input.`;

        return {
          content: [{
            type: "text",
            text: prompt
          }]
        };
      }
    );

    // Tool for crisis management
    this.server.tool("crisis_management",
      {
        crisis_description: z.string().describe("Description of the crisis situation"),
        immediate_concerns: z.string().describe("Most pressing immediate concerns")
      },
      async ({ crisis_description, immediate_concerns }) => {
        const prompt = `EMERGENCY BOARD MEETING - CRISIS RESPONSE

CRISIS: ${crisis_description}
IMMEDIATE CONCERNS: ${immediate_concerns}

Your board is convening an emergency session. Each advisor should provide:

IMMEDIATE PRIORITIES (Next 24-48 hours):
- Tim Cook: Operational response and damage control
- Jamie Dimon: Financial exposure and liquidity management
- Maya Angelou: Communication strategy and stakeholder messaging

STRATEGIC RESPONSE (Week 1-4):
- Warren Buffett: Long-term value protection and opportunity assessment
- Charlie Munger: Decision-making frameworks to avoid further mistakes
- Art Gensler: Brand and reputation management

Each advisor should provide:
1. Immediate actions (next 24 hours)
2. Week 1 priorities 
3. Key messages for different stakeholders
4. Metrics to track recovery progress
5. Long-term strategic adjustments

Focus on practical, executable recommendations for both immediate stabilization and long-term recovery.`;

        return {
          content: [{
            type: "text",
            text: prompt
          }]
        };
      }
    );
  }
}

// Use the static mount method for SSE endpoint
export default {
  async fetch(request: Request, env: any, context: any): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === "/sse") {
      // Use the static mount method from McpAgent
      return AdvisoryBoardMCP.mount('/sse')(request, env, context);
    }

    return new Response("Advisory Board MCP Server - Use /sse endpoint for MCP connection", { 
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
};
