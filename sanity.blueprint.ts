import { defineBlueprint, defineDocumentWebhook } from "@sanity/blueprints";

export default defineBlueprint({
  resources: [
    defineDocumentWebhook({
      name: "vercel-isr-revalidate",
      displayName: "Vercel ISR revalidate",
      on: ["create", "update", "delete"],
      url: "https://chasecee.com/api/revalidate",
      filter: '_type in ["page", "project", "music"]',
      projection: "{_type, slug}",
      dataset: "production",
      apiVersion: "v2026-01-01",
      httpMethod: "POST",
      includeDrafts: false,
      headers: {
        Authorization: `Bearer ${process.env.REVALIDATE_SECRET}`,
      },
    }),
  ],
});
