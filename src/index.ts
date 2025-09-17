import { FastMCP } from "fastmcp";
import { z } from "zod";

const server = new FastMCP({
  name: "advisory-board",
  version: "1.0.0"
});

// Simple advisor data
const ADVISORS = {
  tim_cook: {
    name: "Tim Cook",
    role: "Strategic Leadership Advisor",
    style: "Measured, thoughtful, focuses on long-term value and operational excellence",
    expertise: "Strategic planning, operational efficiency, brand building"
  },
  warren_buffett: {
    name: "Warren Buffett", 
    role: "Investment & Business Philosophy Advisor",
    style: "Folksy wisdom, asks probing questions about business fundamentals",
    expertise: "Value investing, business analysis, capital allocation"
  },
  maya_angelou: {
    name: "Maya Angelou",
    role: "Purpose & Human Leadership Advisor", 
    style: "Warm, wise, focuses on human impact and authentic leadership",
    expertise: "Leadership authenticity, inclusive culture, communication"
  },
  jamie_dimon: {
    name: "Jamie Dimon",
    role: "Risk Management & Crisis Leadership Advisor",
    style: "Direct, no-nonsense, stress-tests everything for worst-case scenarios",
    expertise: "Risk management, crisis navigation, financial strategy"
  },
  charlie_munger: {
    name: "Charlie Munger",
    role: "Mental Models & Rational Thinking Advisor",
    style: "Intellectually rigorous, uses inversion thinking and multiple disciplines",
    expertise: "Decision-making frameworks, avoiding biases, systematic thinking"
  },
  art_gensler: {
    name: "Art Gensler",
    role: "Innovation & Design Thinking Advisor",
    style: "Creative, optimistic, reframes problems as design challenges",
    expertise: "Human-centered design, innovation, sustainable planning"
  }
};

// Generate advisor response based on their style
function generateResponse(advisor: any, topic: string, background: string): string {
  const responses = {
    tim_cook: `Looking at "${topic}", I'd focus on three key areas: First, how does this align with our core mission and values? Second, what are the long-term operational implications? Third, will this delight our customers and create lasting value? 

My advice: Take a systematic approach - analyze the customer impact, build operational capabilities gradually, and measure success with clear KPIs. Don't rush; execute with excellence.

Key questions: What would our customers say about this decision? Do we have the operational foundation to succeed?`,

    warren_buffett: `This sounds like a classic capital allocation decision. Before moving forward, I'd want to understand the economics deeply - what's the competitive advantage here, and are we buying at a reasonable price?

My advice: Apply the 10-year test - would you be comfortable with this decision if you had to live with it for a decade? Focus on businesses with strong moats and predictable cash flows. If you can't understand it simply, don't do it.

Key questions: What could permanently damage this business? Are we paying a fair price for future cash flows?`,

    maya_angelou: `Every business decision is ultimately about people. When I think about "${topic}", I ask: How will this help your team grow? How will it serve your community? What story does this tell about who you are?

My advice: Lead with courage and authenticity. Make sure this decision lifts others up, not just generates profit. Your people will remember how this made them feel long after the numbers are forgotten.

Key questions: What story are you telling with this choice? How can this decision help others flourish?`,

    jamie_dimon: `Let me stress-test this for you. What happens if everything goes wrong? Do you have the balance sheet strength to survive a downturn? Have you considered all the regulatory and competitive risks?

My advice: Build multiple scenarios - best case, worst case, and most likely. Make sure you can survive the worst case. Have contingency plans ready. Don't bet the company on any single decision.

Key questions: What keeps you up at night about this? How would you survive if your assumptions are wrong?`,

    charlie_munger: `Let's invert this problem - what would cause this to fail completely? I'd apply multiple mental models: economic, psychological, competitive. Most failures come from cognitive biases and poor incentive structures.

My advice: Create a checklist of potential failure modes. Ask yourself how you might be fooling yourself. Look at this through the lens of history, psychology, and economics. The biggest risk is usually what you're not thinking about.

Key questions: How might you be deceiving yourself? What disciplines outside business inform this decision?`,

    art_gensler: `I'd reframe "${topic}" as a design challenge. Who are we really serving here? What would the most innovative, human-centered solution look like? How might we prototype and test before committing fully?

My advice: Start with deep user research. Create multiple solution concepts. Test and iterate quickly. The best solutions often come from understanding people's unarticulated needs.

Key questions: What would users love about this? How might we design this to create lasting positive impact?`
  };

  return responses[advisor.name.toLowerCase().replace(' ', '_') as keyof typeof responses] || 
    `Based on my experience, I would approach "${topic}" by considering the key stakeholders and long-term implications. My advice is to gather more data and consider multiple perspectives before deciding.`;
}

// Main advisory board meeting tool
server.addTool({
  name: "hold_board_meeting",
  description: "Hold a virtual meeting with your advisory board on any business topic",
  parameters: z.object({
    topic: z.string().describe("The main topic or decision you want to discuss"),
    background: z.string().describe("Background context for the advisors"),
    advisors: z.array(z.enum(['tim_cook', 'warren_buffett', 'maya_angelou', 'jamie_dimon', 'charlie_munger', 'art_gensler']))
      .describe("Which advisors to include (pick 2-4 for best results)")
  }),
  execute: async ({ topic, background, advisors }) => {
    const meeting_summary = `
# VIRTUAL BOARD MEETING
**Topic:** ${topic}
**Date:** ${new Date().toLocaleDateString()}

**Background:** ${background}

---

## ADVISOR RESPONSES:

${advisors.map(advisorKey => {
  const advisor = ADVISORS[advisorKey as keyof typeof ADVISORS];
  const response = generateResponse(advisor, topic, background);
  return `### ${advisor.name} - ${advisor.role}

${response}

---`;
}).join('\n')}

## SUMMARY
Your virtual advisory board has provided diverse perspectives on "${topic}". Each advisor has offered specific advice based on their expertise and decision-making style. Consider the common themes and conflicting viewpoints as you make your decision.
`;

    return meeting_summary;
  }
});

// Quick advisor lookup
server.addTool({
  name: "get_advisor_info", 
  description: "Get information about any advisor",
  parameters: z.object({
    advisor: z.enum(['tim_cook', 'warren_buffett', 'maya_angelou', 'jamie_dimon', 'charlie_munger', 'art_gensler'])
  }),
  execute: async ({ advisor }) => {
    const info = ADVISORS[advisor];
    return `**${info.name}** - ${info.role}

**Communication Style:** ${info.style}
**Key Expertise:** ${info.expertise}`;
  }
});

// List available advisors
server.addTool({
  name: "list_advisors",
  description: "See all available advisors for your board meetings", 
  parameters: z.object({}),
  execute: async () => {
    return Object.entries(ADVISORS).map(([key, advisor]) => 
      `**${advisor.name}** (${key}): ${advisor.expertise}`
    ).join('\n\n');
  }
});

// Export for Cloudflare Workers
export default {
  async fetch(request: Request): Promise<Response> {
    return server.handleRequest(request);
  }
};
