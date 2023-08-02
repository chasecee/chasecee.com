import {createClient} from '@sanity/client'
import { deskTool } from "sanity/desk"
import schemas from  './sanity/schemas'

export const config = createClient ({
    projectId: "lgevplo8",
    dataset: "production",
    apiVersion: "2023-07-12",
})