import { PatchEngine } from "./PatchEngine.js";

export class RepairEngine {
  constructor({ registry, brain = null, execution = null, patchEngine = null }) {
    this.registry = registry;
    this.brain = brain;
    this.execution = execution;
    this.patchEngine =
      patchEngine ||
      new PatchEngine({
        root: process.cwd(),
        registry
      });

    this.version = "1.1.0";
  }

  normalize(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  async readFile(file) {
    return await this.registry.execute(
      "read_file",
      file
    );
  }

  async fileExists(file) {
    return await this.registry.execute(
      "file_exists",
      file
    );
  }

  async runShell(command) {
    return await this.registry.execute(
      "shell",
      command
    );
  }

  extractFiles(text) {
    const matches =
      String(text || "").match(
        /(?:[\w.-]+\/)*[\w.-]+\.(?:js|mjs|cjs|ts|tsx|jsx|json|py|java|kt|go|rs|cpp|c|html|css|md|yml|yaml|sh)/gi
      ) || [];

    return [...new Set(matches)];
  }

  detectErrorType(text) {
    const value = String(text || "").toLowerCase();

    if (
      /syntaxerror|syntax error|unexpected token|unexpected identifier/.test(
        value
      )
    ) {
      return "SYNTAX_ERROR";
    }

    if (
      /referenceerror|is not defined|undefined/.test(
        value
      )
    ) {
      return "REFERENCE_ERROR";
    }

    if (
      /typeerror|cannot read properties|not a function/.test(
        value
      )
    ) {
      return "TYPE_ERROR";
    }

    if (
      /module not found|cannot find module|err_module_not_found|import/.test(
        value
      )
    ) {
      return "MODULE_ERROR";
    }

    if (
      /permission denied|eacces|eperm/.test(
        value
      )
    ) {
      return "PERMISSION_ERROR";
    }

    if (
      /timeout|timed out/.test(
        value
      )
    ) {
      return "TIMEOUT_ERROR";
    }

    if (
      /test failed|failing test|assertion/.test(
        value
      )
    ) {
      return "TEST_FAILURE";
    }

    return "UNKNOWN_ERROR";
  }

  extractLineNumber(text) {
    const match = String(text || "").match(
      /(?:line|at .*:)(\d+)/i
    );

    if (!match) {
      const nodeMatch =
        String(text || "").match(
          /:(\d+):(\d+)/
        );

      if (nodeMatch) {
        return Number(nodeMatch[1]);
      }

      return null;
    }

    return Number(match[1]);
  }

  async inspectFile(file) {
    const exists =
      await this.fileExists(file);

    if (!exists) {
      return {
        file,
        exists: false,
        content: null,
        size: 0
      };
    }

    const content =
      await this.readFile(file);

    return {
      file,
      exists: true,
      content: String(content || ""),
      size: String(content || "").length
    };
  }

  async inspectFiles(files = []) {
    const results = [];

    for (const file of files) {
      try {
        results.push(
          await this.inspectFile(file)
        );
      } catch (error) {
        results.push({
          file,
          exists: false,
          content: null,
          size: 0,
          error: error.message
        });
      }
    }

    return results;
  }

  buildDiagnosis({
    error,
    files,
    inspections
  }) {
    const errorText =
      this.normalize(error);

    const type =
      this.detectErrorType(errorText);

    const line =
      this.extractLineNumber(errorText);

    const existingFiles =
      inspections
        .filter(item => item.exists)
        .map(item => item.file);

    const missingFiles =
      inspections
        .filter(item => !item.exists)
        .map(item => item.file);

    let confidence = "LOW";

    if (
      type !== "UNKNOWN_ERROR" &&
      existingFiles.length > 0
    ) {
      confidence = "MEDIUM";
    }

    if (
      line &&
      existingFiles.length > 0
    ) {
      confidence = "HIGH";
    }

    return {
      type,
      confidence,
      error: errorText,
      files,
      existingFiles,
      missingFiles,
      line
    };
  }

  buildRepairStrategy(diagnosis) {
    const type = diagnosis?.type || "GENERAL_ERROR";
    const files = Array.isArray(diagnosis?.files)
      ? diagnosis.files
      : [];

    const stages = [
      "UNDERSTAND_ERROR",
      "INSPECT_FILES"
    ];

    switch (type) {
      case "SYNTAX_ERROR":
        stages.push(
          "LOCATE_SYNTAX_PROBLEM",
          "PREPARE_SYNTAX_REPAIR"
        );
        break;

      case "REFERENCE_ERROR":
        stages.push(
          "LOCATE_REFERENCE",
          "TRACE_SYMBOL",
          "PREPARE_REFERENCE_REPAIR"
        );
        break;

      case "TYPE_ERROR":
        stages.push(
          "LOCATE_TYPE_MISMATCH",
          "TRACE_DATA_FLOW",
          "PREPARE_TYPE_REPAIR"
        );
        break;

      case "MODULE_ERROR":
        stages.push(
          "TRACE_IMPORT",
          "CHECK_MODULE",
          "PREPARE_MODULE_REPAIR"
        );
        break;

      case "TEST_FAILURE":
        stages.push(
          "ANALYZE_TEST",
          "TRACE_FAILURE",
          "PREPARE_TEST_REPAIR"
        );
        break;

      default:
        stages.push(
          "ANALYZE_FAILURE",
          "PREPARE_GENERAL_REPAIR"
        );
    }

    stages.push(
      "SAFETY_CHECK",
      "APPLY_REPAIR",
      "VERIFY_REPAIR",
      "FINAL_REVIEW"
    );

    return {
      type,
      files,
      stages,
      requiresExplicitPatch: true,
      patch: null,
      automaticPatch: false
    };
  }
  async createBackup(files = []) {
    const backups = [];

    for (const file of files) {
      try {
        const backup =
          `${file}.repair-backup`;

        const command =
          `cp "${file}" "${backup}"`;

        const result =
          await this.runShell(command);

        backups.push({
          file,
          backup,
          success: result.code === 0,
          stdout: result.stdout,
          stderr: result.stderr
        });
      } catch (error) {
        backups.push({
          file,
          success: false,
          error: error.message
        });
      }
    }

    return backups;
  }

  async verifyJavaScript(files = []) {
    const results = [];

    for (const file of files) {
      if (
        !/\.(js|mjs|cjs)$/.test(file)
      ) {
        results.push({
          file,
          checked: false,
          success: true,
          reason:
            "JavaScript syntax verification not required."
        });

        continue;
      }

      try {
        const result =
          await this.runShell(
            `node --check "${file}"`
          );

        results.push({
          file,
          checked: true,
          success: result.code === 0,
          stdout: result.stdout,
          stderr: result.stderr
        });
      } catch (error) {
        results.push({
          file,
          checked: true,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async diagnose(error, explicitFiles = []) {
    const errorText =
      this.normalize(error);

    if (!errorText) {
      throw new Error(
        "EMPTY_REPAIR_ERROR"
      );
    }

    const extractedFiles =
      this.extractFiles(errorText);

    const files = [
      ...new Set([
        ...explicitFiles,
        ...extractedFiles
      ])
    ];

    const inspections =
      await this.inspectFiles(files);

    const diagnosis =
      this.buildDiagnosis({
        error: errorText,
        files,
        inspections
      });

    return {
      version: this.version,
      diagnosis,
      inspections,
      strategy:
        this.buildRepairStrategy(
          diagnosis
        )
    };
  }

  async prepareRepair(errorOrOptions, files = []) {
    const options =
      errorOrOptions &&
      typeof errorOrOptions === "object" &&
      !Array.isArray(errorOrOptions)
        ? errorOrOptions
        : {
            error: errorOrOptions,
            files
          };

    const analysis =
      await this.diagnose(
        options.error,
        options.files || []
      );

    const existingFiles =
      analysis.diagnosis.existingFiles;

    if (!existingFiles.length) {
      return {
        ready: false,
        reason:
          "No existing target file was found.",
        analysis
      };
    }

    const strategy =
      this.buildRepairStrategy(
        analysis.diagnosis
      );

    return {
      ready: true,
      analysis,
      targetFiles: existingFiles,
      strategy,
      safety: {
        backupRequired: true,
        verificationRequired: true,
        automaticOverwrite: false
      }
    };
  }

  async verifyRepair(files = []) {
    const syntax =
      await this.verifyJavaScript(
        files
      );

    const success =
      syntax.every(
        item => item.success !== false
      );

    return {
      success,
      syntax
    };
  }

  async applyPatch({
    file,
    oldText,
    newText,
    verify = true
  }) {
    const patch = this.patchEngine.createPatch({
      file,
      oldText,
      newText
    });

    if (verify) {
      return await this.patchEngine.applyAndVerify(patch);
    }

    return await this.patchEngine.apply(patch);
  }

  async repair({
    error,
    files = [],
    apply = false
  }) {
    const preparation =
      await this.prepareRepair({
        error,
        files
      });

    if (!preparation.ready) {
      return {
        success: false,
        repaired: false,
        preparation
      };
    }

    const targetFiles =
      preparation.targetFiles;

    const backups =
      await this.createBackup(targetFiles);

    const backupSuccess =
      backups.every(
        item => item.success !== false
      );

    if (!backupSuccess) {
      return {
        success: false,
        repaired: false,
        stage: "BACKUP",
        preparation,
        backups
      };
    }

    if (!apply) {
      return {
        success: true,
        repaired: false,
        mode: "ANALYSIS_ONLY",
        message:
          "Repair prepared successfully. No code was changed.",
        preparation,
        backups
      };
    }

    return {
      success: false,
      repaired: false,
      stage: "PATCH_SPEC_REQUIRED",
      preparation,
      backups,
      patchEngine: {
        available: Boolean(this.patchEngine),
        version: this.patchEngine?.version || null
      },
      message:
        "Repair is ready for an explicit exact-text patch."
    };
  }
}
