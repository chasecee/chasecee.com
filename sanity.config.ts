import { defineConfig } from 'sanity'
import { deskTool } from "sanity/desk"
import {codeInput} from '@sanity/code-input'
import {colorInput} from '@sanity/color-input'
import schemas from  './sanity/schemas'

export const config = defineConfig ({
    projectId: "lgevplo8",
    dataset: "production",
    title: "Cee App",
    apiVersion: "2023-07-12",
    basePath: "/studio",
    plugins: [deskTool(),codeInput(),colorInput()],
    schema: { types: schemas }
})