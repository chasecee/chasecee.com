export const STUDIO_URL = import.meta.env.DEV
  ? "http://localhost:3333"
  : "https://admin.chasecee.com";

export function studioDocumentUrl(doc?: {
  _id?: string | null;
  _type?: string | null;
} | null): string {
  const base = STUDIO_URL.replace(/\/$/, "");
  const id = doc?._id?.replace(/^drafts\./, "");
  const type = doc?._type;
  if (!id || !type) return `${base}/structure`;
  return `${base}/structure/${type};${id}`;
}
