import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitePort = process.env.PORT || 4321;
const studioPort = Number(process.env.SANITY_STUDIO_PORT || 3333);

function probePort(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.setTimeout(250);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

async function isPortInUse(port) {
  const results = await Promise.all([
    probePort(port, "127.0.0.1"),
    probePort(port, "::1"),
  ]);
  return results.some(Boolean);
}

function run(command, args, cwd) {
  return spawn(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

const children = [];

function shutdown(code = 0) {
  for (const child of children) child.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("");
console.log(`  Site    http://localhost:${sitePort}/`);
console.log(`  Studio  http://localhost:${studioPort}/`);
console.log("");

const astro = run("bun", ["x", "astro", "dev"], root);
children.push(astro);

astro.on("exit", (code, signal) => {
  if (signal === "SIGTERM") return;
  shutdown(code ?? 1);
});

const studioBusy = await isPortInUse(studioPort);
if (studioBusy) {
  console.log(`Studio already running on port ${studioPort}\n`);
} else {
  const studio = run(
    "bun",
    ["x", "sanity", "dev", "--port", String(studioPort)],
    path.join(root, "studio"),
  );
  children.push(studio);

  studio.on("exit", (code, signal) => {
    if (signal === "SIGTERM") return;
    console.error(
      `\nStudio exited (${code ?? signal ?? "unknown"}). Site keeps running.\n`,
    );
  });
}
