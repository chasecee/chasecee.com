import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineCliConfig } from "sanity/cli";
import { kitTypegenConfig } from "@chasecee/sanity-kit/studio/typegen";
import {
  ensureLocalKit,
  localKit,
  monorepoRoot,
  useLocalKit,
} from "../../scripts/local-kit";

ensureLocalKit();

const appRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineCliConfig({
  api: {
    projectId: "lgevplo8",
    dataset: "production",
  },
  deployment: {
    appId: "ksqu42puhnbcxg35cnckoug9",
  },
  ...kitTypegenConfig(),
  vite: (config) => {
    if (!useLocalKit) return config;
    return {
      ...config,
      server: {
        ...config.server,
        fs: {
          ...config.server?.fs,
          allow: [...(config.server?.fs?.allow ?? []), monorepoRoot, localKit, appRoot],
        },
      },
    };
  },
});
