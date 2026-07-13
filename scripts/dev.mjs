import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLocalKit } from "./local-kit.ts";

ensureLocalKit();

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitePort = process.env.PORT || 4321;
const studioPort = Number(process.env.SANITY_STUDIO_PORT || 3333);

function loadEnvFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    const env = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (key) env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

const rootEnv = {
  ...loadEnvFile(path.join(root, ".env")),
  ...loadEnvFile(path.join(root, ".env.local")),
};
const sharedEnv = {
  ...rootEnv,
  ...process.env,
};

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
    env: sharedEnv,
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

const astro = run("bun", ["run", "dev"], path.join(root, "apps/site"));
children.push(astro);

astro.on("exit", (code, signal) => {
  if (signal === "SIGTERM") return;
  shutdown(code ?? 1);
});

const studioBusy = await isPortInUse(studioPort);
if (studioBusy) {
  console.log(`Studio already running on port ${studioPort}\n`);
} else {
  const studio = spawn(
    "bun",
    ["x", "sanity", "dev", "--port", String(studioPort)],
    {
      cwd: path.join(root, "apps/admin"),
      stdio: "inherit",
      env: {
        ...sharedEnv,
        SANITY_STUDIO_PREVIEW_URL: sharedEnv.SANITY_STUDIO_PREVIEW_URL ||
          `http://localhost:${sitePort}`,
      },
    },
  );
  children.push(studio);

  studio.on("exit", (code, signal) => {
    if (signal === "SIGTERM") return;
    console.error(
      `\nStudio exited (${code ?? signal ?? "unknown"}). Site keeps running.\n`,
    );
  });
}
