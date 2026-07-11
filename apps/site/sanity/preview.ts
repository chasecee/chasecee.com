import { configureAstroDraft } from "@chasecee/sanity-kit/astro";
import config from "./config/client-config";
import { STUDIO_URL } from "./studio-url";
export {
  isPreviewRequest,
  parsePerspective,
  getPerspectiveCookie,
  draftFetchOptions,
  getSanityClient,
} from "@chasecee/sanity-kit/astro";

configureAstroDraft({
  clientConfig: config,
  studioUrl: STUDIO_URL,
  readTokenEnvKey: "SANITY_API_READ_TOKEN",
});
