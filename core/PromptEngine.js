export class PromptEngine {
  constructor(agent, registry, planner) {
    this.agent = agent;
    this.registry = registry;
    this.planner = planner;
  }

  async execute(prompt) {
    const text = String(prompt || "").trim();

    if (!text) {
      return {
        success: false,
        error: "EMPTY_PROMPT"
      };
    }

    const plan = await this.registry.execute(
      "create_plan",
      text
    );

    const repository = await this.registry.execute(
      "repository_map"
    );

    return {
      success: true,
      prompt: text,
      plan,
      repository
    };
  }
}
