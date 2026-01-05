import { query, type Options, type McpServerConfig } from "@anthropic-ai/claude-agent-sdk";

export const MCP_CONFIG: McpServerConfig = {
  type: "stdio",
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-fetch"],
};

export const ALLOWED_TOOLS = [
  "mcp__mcp__fetch"
];

export const SYSTEM_PROMPT = `You are an ArXiv research assistant. You help users find, fetch, and summarize academic papers from ArXiv. When users request papers on a topic, you search ArXiv, fetch the paper abstracts and content, and provide clear, concise summaries highlighting the key contributions, methodology, and results. You can compare multiple papers, identify trends in research areas, and help users understand complex academic content in accessible language.`;

export function getOptions(standalone = false): Options {
  return {
    systemPrompt: SYSTEM_PROMPT,
    model: "haiku",
    allowedTools: ALLOWED_TOOLS,
    maxTurns: 50,
    ...(standalone && { mcpServers: { mcp: MCP_CONFIG } }),
  };
}

export async function* streamAgent(prompt: string) {
  for await (const msg of query({ prompt, options: getOptions(true) })) {
    if (msg.type === "assistant") {
      for (const b of (msg as any).message?.content || []) {
        if (b.type === "text") yield { type: "text", text: b.text };
        if (b.type === "tool_use") yield { type: "tool", name: b.name };
      }
    }
    if ((msg as any).message?.usage) {
      const u = (msg as any).message.usage;
      yield { type: "usage", input: u.input_tokens || 0, output: u.output_tokens || 0 };
    }
    if ("result" in msg) yield { type: "result", text: msg.result };
  }
  yield { type: "done" };
}
