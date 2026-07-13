import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureLocalKit } from "./local-kit.ts";

ensureLocalKit();

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "apps/site");
const adminDir = path.join(root, "apps/admin");
const preferredSite = Number(process.env.PORT || 4321);
const preferredStudio = Number(process.env.SANITY_STUDIO_PORT || 3333);

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

const sharedEnv = {
  ...loadEnvFile(path.join(root, ".env")),
  ...loadEnvFile(path.join(root, ".env.local")),
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

async function findFreePort(start) {
  let port = start;
  while (await isPortInUse(port)) port += 1;
  return port;
}

function run(command, args, cwd, env = sharedEnv) {
  return spawn(command, args, {
    cwd,
    stdio: "inherit",
    env,
  });
}

function stopAstro() {
  return new Promise((resolve) => {
    const child = spawn("bun", ["x", "astro", "dev", "stop"], {
      cwd: siteDir,
      stdio: "ignore",
      env: sharedEnv,
    });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
}

await stopAstro();

for (let i = 0; i < 20 && (await isPortInUse(preferredSite)); i++) {
  await new Promise((r) => setTimeout(r, 100));
}

const sitePort = await findFreePort(preferredSite);
const studioPort = await findFreePort(preferredStudio);

const children = [];

function shutdown(code = 0) {
  for (const child of children) child.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("");
if (sitePort !== preferredSite || studioPort !== preferredStudio) {
  console.log(
    `  Ports busy — using site ${sitePort}, studio ${studioPort}`,
  );
}
console.log(`  Site    http://localhost:${sitePort}/`);
console.log(`  Studio  http://localhost:${studioPort}/`);
console.log("");

const site = run(
  "bun",
  ["x", "astro", "dev", "--force", "--port", String(sitePort)],
  siteDir,
);
children.push(site);

site.on("exit", (code, signal) => {
  if (signal === "SIGTERM") return;
  shutdown(code ?? 1);
});

const studio = run(
  "bun",
  ["x", "sanity", "dev", "--port", String(studioPort)],
  adminDir,
  {
    ...sharedEnv,
    SANITY_STUDIO_PREVIEW_URL:
      sharedEnv.SANITY_STUDIO_PREVIEW_URL ||
      `http://localhost:${sitePort}`,
  },
);
children.push(studio);

studio.on("exit", (code, signal) => {
  if (signal === "SIGTERM") return;
  console.error(
    `\nStudio exited (${code ?? signal ?? "unknown"}). Site keeps running.\n`,
  );
});
