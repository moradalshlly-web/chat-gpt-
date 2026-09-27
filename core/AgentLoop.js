export class AgentLoop {
  constructor({
    agent,
    registry,
    planner,
    execution,
    verification
  }) {
    this.agent = agent;
    this.registry = registry;
    this.planner = planner;
    this.execution = execution;
    this.verification = verification;
    this.codingBrain = null;

    this.maxSteps =
      agent.config.maxAgentSteps || 5;

    this.state = this.createInitialState();
  }

  createInitialState() {
    return {
      status: "idle",
      task: null,
      plan: [],
      actions: [],
      repository: null,
      observations: [],
      execution: null,
      verification: null,
      brain: null,
      result: null
    };
  }

  attachCodingBrain(codingBrain) {
    this.codingBrain = codingBrain;
  }

  async inspect() {
    const repository =
      await this.registry.execute("repository_map");

    this.state.repository = repository;

    this.state.observations.push({
      step: "INSPECT",
      message:
        `Repository contains ${repository.totalFiles} files and ${repository.totalDirectories} directories.`
    });

    return repository;
  }

  async createPlan(task) {
    const plan =
      await this.planner.createPlan(task);

    this.state.plan = plan;

    /*
     * MoroAI converts the human-readable plan
     * into executable actions.
     *
     * This is important because ExecutionEngine
     * accepts actions, not planning metadata.
     */
    const actions = [];

    for (const step of plan) {
      if (Array.isArray(step.actions)) {
        actions.push(...step.actions);
      }
    }

    this.state.actions = actions;

    this.state.observations.push({
      step: "PLAN",
      message:
        `Plan created with ${actions.length} executable action(s).`
    });

    return plan;
  }

  async execute() {
    this.state.status = "executing";

    this.state.observations.push({
      step: "EXECUTE",
      message: "Execution phase started."
    });

    if (!this.state.actions.length) {
      this.state.execution = {
        success: true,
        results: [],
        message:
          "No executable actions were generated."
      };

      this.state.observations.push({
        step: "EXECUTE",
        message:
          "No executable actions were required."
      });

      return this.state.execution;
    }

    /*
     * Execute only validated executable actions.
     */
    const execution =
      await this.execution.executePlan(
        this.state.actions
      );

    this.state.execution = execution;

    if (execution.success) {
      this.state.observations.push({
        step: "EXECUTE",
        message:
          "Execution completed successfully."
      });
    } else {
      this.state.observations.push({
        step: "EXECUTE_ERROR",
        message:
          "Execution stopped because an action failed."
      });
    }

    return execution;
  }

  async verify() {
    this.state.status = "verifying";

    this.state.observations.push({
      step: "VERIFY",
      message:
        "Verification phase started."
    });

    const repository =
      await this.verification.verifyRepository();

    const plan =
      await this.verification.verifyPlan(
        this.state.actions
      );

    const success =
      repository.success &&
      plan.success;

    this.state.verification = {
      success,
      repository,
      plan
    };

    this.state.observations.push({
      step: "VERIFY",
      message: success
        ? "Verification completed successfully."
        : "Verification detected a problem."
    });

    return this.state.verification;
  }

  async attemptRepair(error, files = []) {
    if (!this.codingBrain) {
      return {
        success: false,
        stage: "CODING_BRAIN_UNAVAILABLE",
        message: "CodingBrain is not attached."
      };
    }

    try {
      const preparation =
        await this.codingBrain.prepareRepair(
          error,
          files
        );

      this.state.observations.push({
        step: "REPAIR_ANALYSIS",
        message:
          preparation?.ready
            ? "Repair analysis prepared successfully."
            : "Repair analysis could not prepare a safe repair."
      });

      if (!preparation?.ready) {
        return {
          success: false,
          stage: "NOT_READY",
          preparation
        };
      }

      const repairPlan =
        preparation?.strategy ||
        preparation?.repairPlan ||
        null;

      /*
       * A repair may only become automatic when the
       * preparation contains a COMPLETE explicit patch.
       *
       * Required:
       *   file
       *   oldText
       *   newText
       */
      const candidatePatch =
        preparation?.patch ||
        repairPlan?.patch ||
        null;

      const patchReady =
        candidatePatch &&
        typeof candidatePatch.file === "string" &&
        typeof candidatePatch.oldText === "string" &&
        typeof candidatePatch.newText === "string" &&
        candidatePatch.oldText.length > 0;

      this.state.observations.push({
        step: "REPAIR_READY",
        message:
          patchReady
            ? "A complete repair patch is ready for safe application."
            : "Repair preparation completed. Awaiting an explicit patch specification."
      });

      if (patchReady) {
        return {
          success: true,
          stage: "PATCH_READY",
          preparation,
          repairPlan,
          patch: candidatePatch,
          automaticPatch: true
        };
      }

      return {
        success: true,
        stage: "READY_FOR_PATCH",
        preparation,
        repairPlan,
        automaticPatch: false
      };
    } catch (repairError) {
      this.state.observations.push({
        step: "REPAIR_ERROR",
        message:
          `Repair analysis failed: ${repairError.message}`
      });

      return {
        success: false,
        stage: "REPAIR_FAILED",
        error: repairError.message
      };
    }
  }

  async run(prompt) {
    const task =
      String(prompt || "").trim();

    if (!task) {
      throw new Error("EMPTY_TASK");
    }

    this.state = {
      ...this.createInitialState(),
      status: "analyzing",
      task
    };

    /*
     * STEP 1 — UNDERSTAND
     */
    this.state.observations.push({
      step: "UNDERSTAND",
      message:
        "Task received and normalized."
    });

    /*
     * STEP 2 — INSPECT
     */
    this.state.status = "inspecting";

    await this.inspect();

    /*
     * STEP 2.5 — CODING BRAIN
     *
     * CodingBrain analyzes the task after repository
     * inspection and before planning.
     */
    if (this.codingBrain) {
      this.state.status = "thinking";

      const brain =
        await this.codingBrain.think(task);

      this.state.brain = brain;

      this.state.observations.push({
        step: "CODING_BRAIN",
        message:
          `CodingBrain classified task as ${brain.analysis.intent}.`
      });
    }

    /*
     * STEP 3 — PLAN
     */
    this.state.status = "planning";

    await this.createPlan(task);

    /*
     * STEP 4 — EXECUTION GATE
     */
    if (
      this.agent.config.requirePlanBeforeWrite
    ) {
      this.state.observations.push({
        step: "EXECUTION_GATE",
        message:
          "Plan approved internally for controlled execution."
      });
    }

    /*
     * STEP 5 — EXECUTE
     */
    await this.execute();

    /*
     * STEP 5.5 — SAFE AUTO-REPAIR LOOP
     *
     * Failure
     *   -> Diagnose
     *   -> Prepare repair
     *   -> Require explicit patch
     *   -> Apply with backup
     *   -> Verify
     *   -> Retry once
     *
     * PatchEngine handles rollback if verification fails.
     */
    if (!this.state.execution?.success && this.codingBrain) {
      const failed =
        this.state.execution;

      const failedAction =
        failed.failedActionData || {};

      const repairFiles = [];

      if (typeof failedAction.target === "string") {
        repairFiles.push(failedAction.target);
      }

      if (Array.isArray(failedAction.files)) {
        repairFiles.push(...failedAction.files);
      }

      const repairError =
        failed.error ||
        failedAction.error ||
        `Execution failed: ${failed.failedAction || "UNKNOWN_ACTION"}`;

      this.state.status = "repairing";

      const repairResult =
        await this.attemptRepair(
          repairError,
          [...new Set(repairFiles)]
        );

      /*
       * Automatic patching is allowed ONLY when
       * CodingBrain returns a complete explicit patch:
       *
       * {
       *   file,
       *   oldText,
       *   newText
       * }
       */
      if (
        repairResult?.success &&
        repairResult?.stage === "PATCH_READY" &&
        repairResult?.patch
      ) {
        const patch =
          repairResult.patch;

        this.state.observations.push({
          step: "AUTO_REPAIR",
          message:
            "Explicit repair patch received. Applying safely."
        });

        const patchResult =
          await this.codingBrain.applyRepair({
            file: patch.file,
            oldText: patch.oldText,
            newText: patch.newText,
            verify: true
          });

        this.state.observations.push({
          step: "AUTO_REPAIR_RESULT",
          message:
            patchResult.success
              ? `Repair applied and verified: ${patchResult.file}`
              : `Repair failed: ${patchResult.stage}`
        });

        /*
         * Retry the original execution exactly once.
         * This prevents infinite repair loops.
         */
        if (patchResult.success) {
          this.state.status = "retrying";

          const retry =
            await this.execution.executePlan(
              this.state.actions
            );

          this.state.execution =
            retry;

          this.state.observations.push({
            step: "REPAIR_RETRY",
            message:
              retry.success
                ? "Execution succeeded after repair."
                : "Execution still failed after repair."
          });
        }
      }
    }

    /*
     * STEP 6 — VERIFY
     */
    await this.verify();

    if (
      this.state.execution?.success &&
      this.state.verification?.success
    ) {
      this.state.status = "completed";

      this.state.result = {
        mode: "EXECUTED_AGENT",
        success: true,
        message:
          "Task executed and verified successfully."
      };
    } else {
      this.state.status = "failed";

      this.state.result = {
        mode: "EXECUTED_AGENT",
        success: false,
        message:
          "Task execution or verification failed.",
        nextAction:
          "Inspect the execution and verification results before retrying."
      };
    }

    return this.state;
  }

  getState() {
    return structuredClone(this.state);
  }

  reset() {
    this.state =
      this.createInitialState();
  }
}
