import { spawn } from "node:child_process";

export class ShellTool {
  constructor(root = process.cwd()) {
    this.root = root;

    this.blocked = [
      "rm -rf /",
      "mkfs",
      "dd if=",
      "git reset --hard",
      "git clean -fd",
      "git push --force",
      "git push -f"
    ];
  }

  validate(command) {
    const normalized = command.toLowerCase();

    for (const item of this.blocked) {
      if (normalized.includes(item)) {
        throw new Error(
          `COMMAND_BLOCKED: ${item}`
        );
      }
    }

    return true;
  }

  execute(command) {
    this.validate(command);

    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        cwd: this.root,
        shell: true,
        env: process.env
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", data => {
        stdout += data.toString();
      });

      child.stderr.on("data", data => {
        stderr += data.toString();
      });

      child.on("error", reject);

      child.on("close", code => {
        resolve({
          code,
          stdout,
          stderr
        });
      });
    });
  }
}
