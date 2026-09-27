export class ActionValidator {
  constructor({ agent }) {
    this.agent = agent;

    this.allowedTypes = new Set([
      "READ",
      "SEARCH",
      "WRITE",
      "SHELL",
      "CHECK_FILE"
    ]);
  }

  validateAction(action) {
    if (!action || typeof action !== "object") {
      return {
        valid: false,
        error: "INVALID_ACTION"
      };
    }

    const type = String(action.type || "").toUpperCase();

    if (!this.allowedTypes.has(type)) {
      return {
        valid: false,
        error: `UNKNOWN_ACTION: ${type || "EMPTY"}`
      };
    }

    if (["READ", "CHECK_FILE"].includes(type) && !action.target) {
      return {
        valid: false,
        error: `${type}_TARGET_REQUIRED`
      };
    }

    if (type === "SEARCH" && !action.query) {
      return {
        valid: false,
        error: "SEARCH_QUERY_REQUIRED"
      };
    }

    if (type === "WRITE") {
      if (!this.agent.config.allowFileWrite) {
        return {
          valid: false,
          error: "FILE_WRITE_BLOCKED"
        };
      }

      if (!action.target) {
        return {
          valid: false,
          error: "WRITE_TARGET_REQUIRED"
        };
      }

      if (typeof action.content !== "string") {
        return {
          valid: false,
          error: "WRITE_CONTENT_REQUIRED"
        };
      }
    }

    if (type === "SHELL") {
      if (!this.agent.config.allowShell) {
        return {
          valid: false,
          error: "SHELL_BLOCKED"
        };
      }

      if (!action.command) {
        return {
          valid: false,
          error: "SHELL_COMMAND_REQUIRED"
        };
      }
    }

    return {
      valid: true,
      type
    };
  }

  validatePlan(plan) {
    if (!Array.isArray(plan)) {
      return {
        valid: false,
        error: "INVALID_PLAN",
        results: []
      };
    }

    const results = [];

    for (let index = 0; index < plan.length; index++) {
      const result = this.validateAction(plan[index]);

      results.push({
        index,
        ...result
      });

      if (!result.valid) {
        return {
          valid: false,
          error: result.error,
          results
        };
      }
    }

    return {
      valid: true,
      results
    };
  }
}
