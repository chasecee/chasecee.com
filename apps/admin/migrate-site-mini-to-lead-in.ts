import { createClient } from "sanity";
import { randomUUID } from "node:crypto";

type ProjectDoc = {
  _id: string;
  siteMini?: {
    url?: string;
    embedUrl?: string;
    title?: string;
  };
  leadIn?: Array<Record<string, unknown>>;
};

const token = process.env.SANITY_API_TOKEN;
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

if (!token || !projectId || !dataset) {
  throw new Error(
    "Set SANITY_API_TOKEN, SANITY_STUDIO_PROJECT_ID, and SANITY_STUDIO_DATASET.",
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-07-12",
  useCdn: false,
  token,
});

const shouldWrite = process.argv.includes("--write");

const projects = await client.fetch<ProjectDoc[]>(
  `*[_type == "project" && defined(siteMini.url)]{
    _id,
    siteMini,
    leadIn
  }`,
);

for (const project of projects) {
  const url = project.siteMini?.url?.trim();
  if (!url) continue;

  const siteMiniBlock = {
    _type: "siteMini",
    _key: randomUUID().replaceAll("-", "").slice(0, 12),
    url,
    embedUrl: project.siteMini?.embedUrl,
    title: project.siteMini?.title,
  };

  const nextLeadIn = [siteMiniBlock, ...(project.leadIn ?? [])];
  const patch = client
    .patch(project._id)
    .set({ leadIn: nextLeadIn })
    .unset(["siteMini"]);

  if (shouldWrite) {
    await patch.commit();
    console.log(`migrated ${project._id}`);
    continue;
  }

  console.log(`dry-run ${project._id}`);
}

console.log(
  shouldWrite
    ? `completed ${projects.length} project migrations`
    : `dry-run complete for ${projects.length} projects`,
);
