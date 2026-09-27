export class ExecutionEngine {
  constructor({ agent, registry }) {
    this.agent = agent;
    this.registry = registry;
  }

  async executeAction(action) {
    if (!action || !action.type) {
      throw new Error("INVALID_ACTION");
    }

    switch (action.type) {
      case "REPOSITORY_MAP":
        return {
          type: action.type,
          success: true,
          result: await this.registry.execute(
            "repository_map"
          )
        };

      case "FILE_EXISTS":
        return {
          type: action.type,
          success: true,
          result: await this.registry.execute(
            "file_exists",
            action.target
          )
        };

      case "READ":
        return {
          type: action.type,
          success: true,
          result: await this.registry.execute(
            "read_file",
            action.target
          )
        };

      case "SEARCH":
        return {
          type: action.type,
          success: true,
          result: await this.registry.execute(
            "search_code",
            action.query
          )
        };

      case "ANALYZE_TASK":
        return {
          type: action.type,
          success: true,
          result: {
            analyzed: true,
            prompt: action.prompt,
            intents: action.intents || [],
            files: action.files || []
          }
        };

      case "DEPENDENCY_SCAN": {
        const results = [];

        for (const file of action.files || []) {
          try {
            const content =
              await this.registry.execute(
                "read_file",
                file
              );

            const imports = [
              ...(content.match(
                /from\s+["']([^"']+)["']/g
              ) || []),
              ...(content.match(
                /import\s+["']([^"']+)["']/g
              ) || [])
            ];

            results.push({
              file,
              imports
            });
          } catch (error) {
            results.push({
              file,
              error: error.message
            });
          }
        }

        return {
          type: action.type,
          success: true,
          result: results
        };
      }

      case "VERIFY_CODE": {
        const results = [];

        for (const file of action.files || []) {
          if (!/\.(js|mjs|cjs)$/.test(file)) {
            results.push({
              file,
              checked: false,
              reason: "Syntax check currently supports JavaScript files."
            });
            continue;
          }

          const command =
            `node --check "${file}"`;

          const result =
            await this.registry.execute(
              "shell",
              command
            );

          results.push({
            file,
            checked: true,
            success: result.code === 0,
            stdout: result.stdout,
            stderr: result.stderr
          });
        }

        return {
          type: action.type,
          success: results.every(
            item =>
              item.success !== false
          ),
          result: results
        };
      }

      case "PLAN_SUMMARY":
        return {
          type: action.type,
          success: true,
          result: {
            version: action.version,
            intents: action.intents || [],
            files: action.files || [],
            risk: action.risk || "READ_ONLY"
          }
        };

      default:
        throw new Error(
          `UNSUPPORTED_ACTION: ${action.type}`
        );
    }
  }

  async executePlan(actions = []) {
    const results = [];

    for (const action of actions) {
      try {
        const result =
          await this.executeAction(action);

        results.push(result);

        if (!result.success) {
          return {
            success: false,
            results,
            failedAction: action.type,
            failedActionData: structuredClone(action)
          };
        }
      } catch (error) {
        const failedActionData =
          structuredClone(action);

        results.push({
          type: action.type,
          success: false,
          error: error.message,
          action: failedActionData
        });

        return {
          success: false,
          results,
          failedAction: action.type,
          failedActionData,
          error: error.message
        };
      }
    }

    return {
      success: true,
      results
    };
  }
}
