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
import { StudioNavbar } from "./components/StudioNavbar";

const SITE_URL = "https://chasecee.com";

const schemasAny = schemas as any;
const projectSchema = schemasAny.find(
  (schema: any) => schema.name === "project",
);
const pageSchema = schemasAny.find((schema: any) => schema.name === "page");

if (projectSchema) {
  projectSchema.fields.push(orderRankField({ type: "project" }));
  projectSchema.orderings = [orderRankOrdering];
}
if (pageSchema) {
  pageSchema.fields.push(orderRankField({ type: "page" }));
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
