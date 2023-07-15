import { defineConfig } from 'sanity'
import { deskTool } from "sanity/desk"
import project from './sanity/schemas/project-schema'
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