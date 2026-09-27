import fs from "node:fs/promises";
import path from "node:path";

export class FileSystemTool {
  constructor(root = process.cwd()) {
    this.root = path.resolve(root);
  }

  resolve(target) {
    const resolved = path.resolve(this.root, target);

    if (!resolved.startsWith(this.root + path.sep) && resolved !== this.root) {
      throw new Error("SECURITY_BLOCKED: path outside workspace");
    }

    return resolved;
  }

  async list(target = ".") {
    const dir = this.resolve(target);
    const entries = await fs.readdir(dir, { withFileTypes: true });

    return entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file"
    }));
  }

  async read(target) {
    return fs.readFile(this.resolve(target), "utf8");
  }

  async exists(target) {
    try {
      await fs.access(this.resolve(target));
      return true;
    } catch {
      return false;
    }
  }

  async write(target, content) {
    const file = this.resolve(target);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, "utf8");
    return true;
  }
}
