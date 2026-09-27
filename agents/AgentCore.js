export class AgentCore {
  constructor() {
    this.name = "MoroAI 1";
    this.version = "0.3.0";

    this.config = {
      costPolicy: "ZERO_COST_FIRST",
      allowPaidProviders: false,
      allowAutoDeploy: false,
      allowMainBranchWrite: false,
      requireVerification: true,

      // Safety / execution policy
      allowFileWrite: true,
      allowShell: true,
      requirePlanBeforeWrite: true,
      requireVerificationAfterWrite: true,

      // Agent limits
      maxAgentSteps: 5,
      maxSearchResults: 100
    };
  }

  status() {
    return {
      agent: this.name,
      version: this.version,
      config: this.config
    };
  }
}
