export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(name, tool) {
    if (!name || !tool) {
      throw new Error("INVALID_TOOL");
    }

    this.tools.set(name, tool);
  }

  get(name) {
    return this.tools.get(name);
  }

  has(name) {
    return this.tools.has(name);
  }

  list() {
    return [...this.tools.keys()];
  }

  async execute(name, ...args) {
    const tool = this.get(name);

    if (!tool) {
      throw new Error(`TOOL_NOT_FOUND: ${name}`);
    }

    if (typeof tool !== "function") {
      throw new Error(`INVALID_TOOL_HANDLER: ${name}`);
    }

    return await tool(...args);
  }
}
