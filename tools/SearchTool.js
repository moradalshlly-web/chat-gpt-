import fs from "node:fs/promises";
import path from "node:path";

export class SearchTool {
  constructor(root = process.cwd()) {
    this.root = path.resolve(root);

    this.ignore = new Set([
      ".git",
      "node_modules",
      "dist",
      "build",
      ".next"
    ]);
  }

  resolve(target) {
    const resolved = path.resolve(this.root, target);

    if (
      !resolved.startsWith(this.root + path.sep) &&
      resolved !== this.root
    ) {
      throw new Error("SECURITY_BLOCKED");
    }

    return resolved;
  }

  async search(query, dir = ".") {
    const root = this.resolve(dir);
    const results = [];

    await this.walk(root, query, results);

    return results.slice(0, 100);
  }

  async walk(dir, query, results) {
    let entries;

    try {
      entries = await fs.readdir(dir, {
        withFileTypes: true
      });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (this.ignore.has(entry.name)) continue;

      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.walk(full, query, results);
        continue;
      }

      try {
        const content = await fs.readFile(full, "utf8");

        if (content.includes(query)) {
          results.push({
            file: path.relative(this.root, full),
            match: query
          });
        }
      } catch {
        // Ignore binary/unreadable files.
      }
    }
  }
}
