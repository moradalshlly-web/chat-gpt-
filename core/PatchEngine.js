import fs from "node:fs/promises";
import path from "node:path";

export class PatchEngine {
  constructor({
    root = process.cwd(),
    registry = null
  } = {}) {
    this.root = path.resolve(root);
    this.registry = registry;
    this.version = "1.0.0";
  }

  resolveFile(file) {
    const absolute = path.resolve(
      this.root,
      String(file || "")
    );

    const relative = path.relative(
      this.root,
      absolute
    );

    if (
      relative.startsWith("..") ||
      path.isAbsolute(relative)
    ) {
      throw new Error("PATCH_PATH_OUTSIDE_WORKSPACE");
    }

    return absolute;
  }

  async exists(file) {
    try {
      await fs.access(
        this.resolveFile(file)
      );
      return true;
    } catch {
      return false;
    }
  }

  async read(file) {
    return await fs.readFile(
      this.resolveFile(file),
      "utf8"
    );
  }

  async backup(file) {
    const target = this.resolveFile(file);

    if (!(await this.exists(file))) {
      throw new Error(
        `PATCH_TARGET_NOT_FOUND:${file}`
      );
    }

    const backup =
      `${target}.moro-backup`;

    await fs.copyFile(
      target,
      backup
    );

    return {
      file,
      backup: path.relative(
        this.root,
        backup
      )
    };
  }

  validatePatch({
    file,
    oldText,
    newText
  }) {
    if (!file) {
      throw new Error("PATCH_FILE_REQUIRED");
    }

    if (
      typeof oldText !== "string" ||
      typeof newText !== "string"
    ) {
      throw new Error(
        "PATCH_CONTENT_MUST_BE_STRING"
      );
    }

    if (oldText.length === 0) {
      throw new Error(
        "PATCH_OLD_TEXT_EMPTY"
      );
    }

    if (oldText === newText) {
      throw new Error(
        "PATCH_HAS_NO_CHANGE"
      );
    }
  }

  createPatch({
    file,
    oldText,
    newText
  }) {
    this.validatePatch({
      file,
      oldText,
      newText
    });

    return {
      version: this.version,
      file,
      oldText,
      newText,
      type: "EXACT_TEXT_REPLACEMENT"
    };
  }

  async preview(patch) {
    const {
      file,
      oldText,
      newText
    } = patch;

    this.validatePatch({
      file,
      oldText,
      newText
    });

    const content =
      await this.read(file);

    const occurrences =
      content.split(oldText).length - 1;

    if (occurrences === 0) {
      return {
        valid: false,
        file,
        occurrences: 0,
        reason:
          "PATCH_TARGET_TEXT_NOT_FOUND"
      };
    }

    if (occurrences > 1) {
      return {
        valid: false,
        file,
        occurrences,
        reason:
          "PATCH_TARGET_TEXT_NOT_UNIQUE"
      };
    }

    const result =
      content.replace(
        oldText,
        newText
      );

    return {
      valid: true,
      file,
      occurrences,
      beforeSize: content.length,
      afterSize: result.length,
      changed: content !== result
    };
  }

  async apply(patch) {
    const preview =
      await this.preview(patch);

    if (!preview.valid) {
      return {
        success: false,
        stage: "PREVIEW",
        ...preview
      };
    }

    const backup =
      await this.backup(
        patch.file
      );

    const target =
      this.resolveFile(
        patch.file
      );

    const content =
      await fs.readFile(
        target,
        "utf8"
      );

    const updated =
      content.replace(
        patch.oldText,
        patch.newText
      );

    await fs.writeFile(
      target,
      updated,
      "utf8"
    );

    return {
      success: true,
      stage: "APPLIED",
      file: patch.file,
      backup: backup.backup,
      changed: true
    };
  }

  async rollback(file) {
    const target =
      this.resolveFile(file);

    const backup =
      `${target}.moro-backup`;

    try {
      await fs.access(backup);
    } catch {
      return {
        success: false,
        reason:
          "PATCH_BACKUP_NOT_FOUND"
      };
    }

    await fs.copyFile(
      backup,
      target
    );

    return {
      success: true,
      file,
      restored: true
    };
  }

  async verifyJavaScript(file) {
    const target =
      this.resolveFile(file);

    if (
      !file.endsWith(".js") &&
      !file.endsWith(".mjs") &&
      !file.endsWith(".cjs")
    ) {
      return {
        success: true,
        skipped: true,
        reason:
          "NOT_JAVASCRIPT"
      };
    }

    const { spawn } =
      await import("node:child_process");

    return await new Promise(
      resolve => {
        const child =
          spawn(
            process.execPath,
            ["--check", target],
            {
              cwd: this.root,
              stdio: [
                "ignore",
                "pipe",
                "pipe"
              ]
            }
          );

        let stdout = "";
        let stderr = "";

        child.stdout.on(
          "data",
          data => {
            stdout += data.toString();
          }
        );

        child.stderr.on(
          "data",
          data => {
            stderr += data.toString();
          }
        );

        child.on(
          "close",
          code => {
            resolve({
              success: code === 0,
              code,
              stdout,
              stderr
            });
          }
        );
      }
    );
  }

  async applyAndVerify(patch) {
    const applied =
      await this.apply(patch);

    if (!applied.success) {
      return applied;
    }

    const verification =
      await this.verifyJavaScript(
        patch.file
      );

    if (verification.success) {
      return {
        success: true,
        stage: "VERIFIED",
        file: patch.file,
        backup: applied.backup,
        verification
      };
    }

    const rollback =
      await this.rollback(
        patch.file
      );

    return {
      success: false,
      stage: "ROLLED_BACK",
      file: patch.file,
      backup: applied.backup,
      verification,
      rollback
    };
  }

  async removeBackup(file) {
    const target =
      this.resolveFile(file);

    const backup =
      `${target}.moro-backup`;

    try {
      await fs.unlink(backup);

      return {
        success: true,
        removed: true,
        file
      };
    } catch {
      return {
        success: false,
        removed: false,
        file
      };
    }
  }
}
