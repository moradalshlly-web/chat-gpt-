import process from "node:process";

import { AgentCore } from "../agents/AgentCore.js";
import { FileSystemTool } from "../tools/FileSystemTool.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";
import { SearchTool } from "../tools/SearchTool.js";
import { ShellTool } from "../tools/ShellTool.js";
import { RepositoryMap } from "./RepositoryMap.js";
import { Planner } from "./Planner.js";
import { MemoryStore } from "../memory/MemoryStore.js";

const root = process.cwd();

const agent = new AgentCore();
const registry = new ToolRegistry();

const filesystem = new FileSystemTool(root);
const search = new SearchTool(root);
const shell = new ShellTool(root);
const repositoryMap = new RepositoryMap(root);
const planner = new Planner();
const memory = new MemoryStore(root);

registry.register(
  "list_files",
  target => filesystem.list(target)
);

registry.register(
  "read_file",
  target => filesystem.read(target)
);

registry.register(
  "write_file",
  (target, content) =>
    filesystem.write(target, content)
);

registry.register(
  "file_exists",
  target => filesystem.exists(target)
);

registry.register(
  "search_code",
  query => search.search(query)
);

registry.register(
  "shell",
  command => shell.execute(command)
);

registry.register(
  "repository_map",
  () => repositoryMap.build()
);

registry.register(
  "create_plan",
  prompt => planner.createPlan(prompt)
);

registry.register(
  "remember",
  entry => memory.remember(entry)
);

console.log("=================================");
console.log("       MOROAI 1 AGENT CORE       ");
console.log("=================================");

console.log(agent.status());

console.log("");
console.log("TOOLS:");
console.log(registry.list());

console.log("");
console.log("WORKSPACE:");
console.log(root);

console.log("");
console.log("STATUS: READY");
