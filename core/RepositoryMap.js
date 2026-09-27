import fs from "node:fs/promises";
import path from "node:path";

export class RepositoryMap {
  constructor(root = process.cwd()) {
    this.root = path.resolve(root);

    this.ignore = new Set([
      ".git",
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
      ".cache",
      ".turbo",
      ".vite"
    ]);
  }

  resolve(target = ".") {
    const resolved = path.resolve(this.root, target);

    if (
      resolved !== this.root &&
      !resolved.startsWith(this.root + path.sep)
    ) {
      throw new Error("SECURITY_BLOCKED");
    }

    return resolved;
  }

  async scan(dir = this.root, depth = 0, maxDepth = 6) {
    if (depth > maxDepth) {
      return [];
    }

    const result = [];

    let entries;

    try {
      entries = await fs.readdir(dir, {
        withFileTypes: true
      });
    } catch {
      return [];
    }

    for (const entry of entries) {
      if (this.ignore.has(entry.name)) {
        continue;
      }

      const full = path.join(dir, entry.name);
      const relative = path.relative(this.root, full);

      if (entry.isDirectory()) {
        result.push({
          path: relative,
          type: "directory"
        });

        const children = await this.scan(
          full,
          depth + 1,
          maxDepth
        );

        result.push(...children);
      } else {
        result.push({
          path: relative,
          type: "file",
          extension: path.extname(entry.name)
        });
      }
    }

    return result;
  }

  async build() {
    const files = await this.scan();

    return {
      root: this.root,
      files,
      totalFiles: files.filter(
        item => item.type === "file"
      ).length,
      totalDirectories: files.filter(
        item => item.type === "directory"
      ).length
    };
  }
}
