import type { ChatIaToolDefinition, ChatIaToolHandler } from "./chatIaToolTypes";

const registry = new Map<string, ChatIaToolHandler>();

export function register(tool: ChatIaToolHandler): void {
  if (!tool.name.trim()) {
    throw new Error("Nome tool Chat IA mancante.");
  }
  registry.set(tool.name, tool);
}

export function getToolByName(name: string): ChatIaToolHandler | null {
  return registry.get(name) ?? null;
}

export function getChatIaToolHandler(name: string): ChatIaToolHandler | null {
  return getToolByName(name);
}

export function getAllToolDefinitions(): ChatIaToolDefinition[] {
  return Array.from(registry.values()).map((tool) => ({
    name: tool.name,
    description: tool.descriptionForOpenAi,
    parameters: tool.parameters,
    outputKindHint: tool.outputKindHint,
  }));
}

export function listChatIaTools(): ChatIaToolDefinition[] {
  return getAllToolDefinitions();
}

export function getAllToolDefinitionsForOpenAI() {
  return getAllToolDefinitions().map((tool) => ({
    type: "function" as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}
