import { createClient, type QueryParams } from "@sanity/client";
import {
  useLiveMode,
  useQuery,
  type QueryResponseInitial,
} from "./loader";
import config from "./config/client-config";
import { STUDIO_URL } from "./studio-url";

export type { QueryResponseInitial };
export { STUDIO_URL };

const liveClient = createClient({
  ...config,
  useCdn: true,
  stega: {
    enabled: true,
    studioUrl: STUDIO_URL,
  },
});

export function useLiveQuery<T>(
  query: string,
  params: QueryParams,
  options: { initial: QueryResponseInitial<T> },
) {
  useLiveMode({ client: liveClient, studioUrl: STUDIO_URL });
  return useQuery<T>(query, params, options);
}
