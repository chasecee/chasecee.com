import { createClient } from "@sanity/client";
import config from "./config/client-config";
const sanityClient = createClient(config);
export default sanityClient;
