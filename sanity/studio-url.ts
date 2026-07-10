export const STUDIO_URL = import.meta.env.DEV
  ? "http://localhost:3333"
  : import.meta.env.PUBLIC_SANITY_STUDIO_URL || "https://studio.chasecee.com";
