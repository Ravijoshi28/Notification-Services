import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const processes = [
  {
    name: "API",
    command: process.execPath,
    args: [resolve(serverRoot, "node_modules/nodemon/bin/nodemon.js"), "app/index.js"],
  },
  {
    name: "notification worker",
    command: process.execPath,
    args: ["app/emailService/worker.js"],
  },
];

let stopping = false;
const children = processes.map(({ name, command, args }) => {
  console.log(`[dev] Starting ${name}`);
  const child = spawn(command, args, { cwd: serverRoot, stdio: "inherit", env: process.env });
  child.on("error", error => {
    console.error(`[dev] ${name} failed to start: ${error.message}`);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (stopping) return;
    console.error(`[dev] ${name} stopped${signal ? ` (${signal})` : ` with exit code ${code}`}`);
    stop(code || 1);
  });
  return child;
});

function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
  const timer = setTimeout(() => process.exit(exitCode), 1500);
  timer.unref();
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
