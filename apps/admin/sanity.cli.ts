// Dev servers alias @chasecee/sanity-kit to the local sibling checkout when it
// exists on disk; deployed builds fall back to the installed github: package.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineCliConfig } from "sanity/cli";
import { localKitPlugin, localKit, monorepoRoot, useLocalKit } from "../../scripts/local-kit";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineCliConfig({
  api: {
    projectId: "lgevplo8",
    dataset: "production",
  },
  deployment: {
    appId: "ksqu42puhnbcxg35cnckoug9",
  },
  vite: (config) => {
    if (!useLocalKit) return config;
    return {
      ...config,
      plugins: [localKitPlugin(appRoot), ...(config.plugins ?? [])],
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "@chasecee/sanity-kit/studio": path.join(localKit, "src/studio/index.ts"),
        },
      },
      server: {
        ...config.server,
        fs: {
          ...config.server?.fs,
          allow: [...(config.server?.fs?.allow ?? []), monorepoRoot, localKit],
        },
      },
    };
  },
});
