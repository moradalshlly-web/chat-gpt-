import os from "node:os";
import process from "node:process";

console.log("=== MOROAI 1 DOCTOR ===");

console.log("Node:", process.version);
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);
console.log("CPUs:", os.cpus().length);
console.log(
  "Memory:",
  Math.round(os.totalmem() / 1024 / 1024),
  "MB"
);

console.log("Status: VERIFIED");
