import type { ClientPerspective, QueryParams } from "@sanity/client";
import { perspectiveCookieName } from "@sanity/preview-url-secret/constants";
import { loadQuery as sharedLoadQuery, setServerClient } from "./loader";
import { getSanityClient, parsePerspective } from "./preview";

type CookiesLike = {
  get: (name: string) => { value: string } | undefined;
};

type LoadQueryInput = {
  query: string;
  params?: QueryParams;
  perspectiveCookie?: string | undefined;
};

export function getDraftModeProps(cookies: CookiesLike) {
  return {
    perspectiveCookie: cookies.get(perspectiveCookieName)?.value,
  };
}

export async function loadQuery<QueryResponseResult>({
  query,
  params = {},
  perspectiveCookie,
}: LoadQueryInput) {
  const draftMode = perspectiveCookie !== undefined;
  const perspective: ClientPerspective = draftMode
    ? (parsePerspective(perspectiveCookie) ?? "drafts")
    : "published";

  setServerClient(getSanityClient(draftMode, perspective));

  return sharedLoadQuery<QueryResponseResult>(query, params, {
    perspective,
    stega: draftMode,
    useCdn: !draftMode,
  });
}
