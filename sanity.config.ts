import { defineConfig } from 'sanity'
import { deskTool } from "sanity/desk"
import schemas from  './sanity/schemas'

export const config = defineConfig ({
    projectId: "lgevplo8",
    dataset: "production",
    title: "Cee App",
    apiVersion: "2023-07-12",
    basePath: "/studio",
    plugins: [deskTool()],
    schema: { types: schemas }
})