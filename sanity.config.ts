import { defineConfig } from "sanity";
import { deskTool, StructureBuilder } from "sanity/desk";
import { codeInput } from "@sanity/code-input";
import { colorInput } from "@sanity/color-input";
import schemas from "./sanity/schemas";
import {
  orderableDocumentListDeskItem,
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { ImagesIcon, DocumentsIcon } from "@sanity/icons";

let schemasAny = schemas as any;
let projectSchema = schemasAny.find((schema: any) => schema.name === "project");
let pageSchema = schemasAny.find((schema: any) => schema.name === "page");

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
    deskTool({
      structure: (S, context) => {
        return S.list()
          .title("Content")
          .items([
            // Include all list items except 'project'
            //...S.documentTypeListItems().filter(listItem => listItem.getId() !== 'project'),
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
            }), // This becomes the new 'Projects' list
          ]);
      },
    }),
    codeInput(),
    colorInput(),
  ],
  schema: { types: schemas },
  useCdn: true,
});
