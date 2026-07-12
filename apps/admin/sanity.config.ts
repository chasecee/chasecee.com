import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { codeInput } from "@sanity/code-input";
import { colorInput } from "@sanity/color-input";
import schemas from "./schemas";
import {
  orderableDocumentListDeskItem,
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { ImagesIcon } from "@sanity/icons/Images";
import { DocumentsIcon } from "@sanity/icons/Documents";
import {
  defineDocuments,
  defineLocations,
  presentationTool,
} from "sanity/presentation";
import {
  DocumentLayout,
  StudioNavbar,
  withPublishShortcut,
  resolveProductionUrlAsync,
  getSiteBaseUrl,
  galleryPlugin,
  configureStudioPreviewUrls,
  kitStudioConfig,
} from "@chasecee/sanity-kit/studio";

configureStudioPreviewUrls({
  siteUrl: "https://chasecee.com",
  localSiteUrl: "http://localhost:4321",
  resolveDocumentUrl(baseUrl, previousUrl, context) {
    const base = baseUrl.replace(/\/$/, "");
    const slug = context.document?.slug?.current;
    const type = context.schemaType || context.document?._type;
    if (type === "project" && slug) return `${base}/projects/${slug}`;
    if (type === "music" && slug) return `${base}/music/${slug}`;
    if (type === "page" && slug) return slug === "home" ? base : `${base}/${slug}`;
    return previousUrl || base;
  },
});

const PREVIEW_URL = getSiteBaseUrl();

const schemasAny = schemas as any;
const projectSchema = schemasAny.find(
  (schema: any) => schema.name === "project",
);
const pageSchema = schemasAny.find((schema: any) => schema.name === "page");
const musicSchema = schemasAny.find((schema: any) => schema.name === "music");

if (projectSchema) {
  projectSchema.fields.push({
    ...orderRankField({ type: "project" }),
    fieldset: "meta",
  });
  projectSchema.orderings = [orderRankOrdering];
}
if (pageSchema) {
  pageSchema.fields.push({
    ...orderRankField({ type: "page" }),
    fieldset: "details",
  });
  pageSchema.orderings = [orderRankOrdering];
}
if (musicSchema) {
  musicSchema.fields.push(orderRankField({ type: "music" }));
  musicSchema.orderings = [orderRankOrdering];
}

const presentationMainDocuments = defineDocuments([
  {
    route: "/",
    filter: `_type == "page" && slug.current == "home"`,
  },
  {
    route: "/projects/:slug",
    filter: `_type == "project" && slug.current == $slug`,
    params: ({ params }) => ({ slug: params.slug }),
  },
  {
    route: "/music/:slug",
    filter: `_type == "music" && (slug.current == $slug || _id == $slug)`,
    params: ({ params }) => ({ slug: params.slug }),
  },
  {
    route: "/:slug",
    filter: `_type == "page" && slug.current == $slug`,
    params: ({ params }) => ({ slug: params.slug }),
  },
]);

const presentationLocations = {
  project: defineLocations({
    select: {
      title: "name",
      slug: "slug.current",
    },
    resolve: (doc) => {
      if (!doc?.slug) return null;
      return {
        locations: [
          {
            title: doc.title || "Project",
            href: `/projects/${doc.slug}`,
          },
        ],
      };
    },
  }),
  music: defineLocations({
    select: {
      title: "albumName",
      slug: "slug.current",
    },
    resolve: (doc) => {
      if (!doc?.slug) return null;
      return {
        locations: [
          {
            title: doc.title || "Music",
            href: `/music/${doc.slug}`,
          },
        ],
      };
    },
  }),
  page: defineLocations({
    select: {
      title: "title",
      slug: "slug.current",
    },
    resolve: (doc) => {
      if (!doc?.slug) return null;
      const href = doc.slug === "home" ? "/" : `/${doc.slug}`;
      return {
        locations: [
          {
            title: doc.title || "Page",
            href,
          },
        ],
      };
    },
  }),
};

export default defineConfig({
  ...kitStudioConfig,
  projectId: "lgevplo8",
  dataset: "production",
  title: "Cee App",
  apiVersion: "2023-07-12",
  plugins: [
    structureTool({
      structure: (S, context) => {
        return S.list()
          .title("Content")
          .items([
            orderableDocumentListDeskItem({
              type: "project",
              title: "Projects",
              icon: ImagesIcon,
              S,
              context,
            }),
            orderableDocumentListDeskItem({
              type: "page",
              title: "Pages",
              icon: DocumentsIcon,
              S,
              context,
            }),
            orderableDocumentListDeskItem({
              type: "music",
              title: "Music",
              icon: ImagesIcon,
              S,
              context,
            }),
          ]);
      },
    }),
    codeInput(),
    colorInput(),
    galleryPlugin({}),
    presentationTool({
      name: "edit",
      title: "Edit",
      previewUrl: {
        initial: PREVIEW_URL,
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable",
        },
      },
      resolve: {
        mainDocuments: presentationMainDocuments,
        locations: presentationLocations,
      },
    }),
  ],
  studio: {
    components: {
      navbar: StudioNavbar,
    },
  },
  document: {
    productionUrl: resolveProductionUrlAsync,
    actions: (prev) =>
      prev.map((Action) =>
        Action.action === "publish" ? withPublishShortcut(Action) : Action,
      ),
    components: {
      unstable_layout: DocumentLayout,
    },
  },
  schema: { types: schemas },
  useCdn: true,
});
