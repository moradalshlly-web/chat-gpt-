export class VerificationEngine {
  constructor({ registry }) {
    this.registry = registry;
  }

  async fileExists(target) {
    return await this.registry.execute(
      "file_exists",
      target
    );
  }

  async repository() {
    return await this.registry.execute(
      "repository_map"
    );
  }

  async command(command) {
    const result = await this.registry.execute(
      "shell",
      command
    );

    return {
      success: result.code === 0,
      code: result.code,
      stdout: result.stdout || "",
      stderr: result.stderr || ""
    };
  }

  async verifyRepository() {
    const repository = await this.repository();

    if (!repository || repository.success === false) {
      return {
        success: false,
        repository,
        message: "Repository verification failed."
      };
    }

    return {
      success: true,
      repository,
      message: "Repository verification completed."
    };
  }

  async verifyFile(target) {
    const exists = await this.fileExists(target);

    const success =
      typeof exists === "boolean"
        ? exists
        : exists?.success === true;

    return {
      success,
      target,
      message: success
        ? `File verified: ${target}`
        : `File missing: ${target}`
    };
  }

  async verifyCommands(commands = []) {
    if (!Array.isArray(commands)) {
      throw new Error("INVALID_VERIFICATION_COMMANDS");
    }

    const results = [];

    for (const command of commands) {
      const result = await this.command(command);

      results.push({
        command,
        ...result
      });

      if (!result.success) {
        return {
          success: false,
          results
        };
      }
    }

    return {
      success: true,
      results
    };
  }

  async verifyPlan(plan = []) {
    if (!Array.isArray(plan)) {
      throw new Error("INVALID_PLAN");
    }

    const results = [];

    for (const action of plan) {
      if (
        action &&
        String(action.type || "").toUpperCase() === "WRITE"
      ) {
        const result = await this.verifyFile(
          action.target
        );

        results.push(result);

        if (!result.success) {
          return {
            success: false,
            results
          };
        }
      }
    }

    return {
      success: true,
      results
    };
  }
}
