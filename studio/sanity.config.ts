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
import { ImagesIcon, DocumentsIcon } from "@sanity/icons";
import {
  defineDocuments,
  defineLocations,
  presentationTool,
} from "sanity/presentation";
import { StudioNavbar } from "./components/StudioNavbar";

const SITE_URL = "https://chasecee.com";
const PREVIEW_URL = process.env.SANITY_STUDIO_PREVIEW_URL || SITE_URL;

const schemasAny = schemas as any;
const projectSchema = schemasAny.find(
  (schema: any) => schema.name === "project",
);
const pageSchema = schemasAny.find((schema: any) => schema.name === "page");

if (projectSchema) {
  projectSchema.fields.push(
    orderRankField({ type: "project", fieldset: "details" }),
  );
  projectSchema.orderings = [orderRankOrdering];
}
if (pageSchema) {
  pageSchema.fields.push(
    orderRankField({ type: "page", fieldset: "details" }),
  );
  pageSchema.orderings = [orderRankOrdering];
}

function resolveProductionUrl(
  previousUrl: string | undefined,
  context: { document?: any; schemaType?: string },
) {
  const slug = context.document?.slug?.current;

  if (context.schemaType === "project" && slug) {
    return `${SITE_URL}/projects/${slug}`;
  }

  if (context.schemaType === "page" && slug) {
    return slug === "home" ? SITE_URL : `${SITE_URL}/${slug}`;
  }

  return previousUrl || SITE_URL;
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
          ]);
      },
    }),
    codeInput(),
    colorInput(),
    presentationTool({
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
    productionUrl: resolveProductionUrl,
  },
  schema: { types: schemas },
  useCdn: true,
});
