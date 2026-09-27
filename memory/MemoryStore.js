import fs from "node:fs/promises";
import path from "node:path";

export class MemoryStore {
  constructor(root = process.cwd()) {
    this.file = path.join(root, "memory", "session.json");
  }

  async load() {
    try {
      return JSON.parse(
        await fs.readFile(this.file, "utf8")
      );
    } catch {
      return {
        sessions: []
      };
    }
  }

  async save(data) {
    await fs.mkdir(
      path.dirname(this.file),
      { recursive: true }
    );

    await fs.writeFile(
      this.file,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  }

  async remember(entry) {
    const data = await this.load();

    data.sessions.push({
      timestamp: new Date().toISOString(),
      ...entry
    });

    await this.save(data);
  }
}
