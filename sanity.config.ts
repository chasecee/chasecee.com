import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { codeInput } from "@sanity/code-input";
import { colorInput } from "@sanity/color-input";
import schemas from "./sanity/schemas";
import {
  orderableDocumentListDeskItem,
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { ImagesIcon, DocumentsIcon } from "@sanity/icons";

// Type assertion for schema arrays - Sanity's internal types are complex
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

export const config = defineConfig({
  projectId: "lgevplo8",
  dataset: "production",
  title: "Cee App",
  apiVersion: "2023-07-12",
  basePath: "/studio",
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
  schema: { types: schemas },
  useCdn: true,
});

export default config;
