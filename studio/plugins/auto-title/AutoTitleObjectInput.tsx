import { useEffect, useRef } from "react";
import { set, type ObjectInputProps } from "sanity";
import { fetchOEmbedTitle } from "./fetchOEmbedTitle";

type WithUrlTitle = {
  url?: string;
  title?: string;
};

export function AutoTitleObjectInput(props: ObjectInputProps) {
  const value = (props.value as WithUrlTitle | undefined) ?? {};
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const title = typeof value.title === "string" ? value.title : "";
  const onChange = props.onChange;
  const autoTitleRef = useRef<string | undefined>(undefined);
  const fetchedUrlRef = useRef<string>("");

  useEffect(() => {
    if (!url) return;
    if (title && title !== autoTitleRef.current) return;
    if (fetchedUrlRef.current === url && title === autoTitleRef.current) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const next = await fetchOEmbedTitle(url, controller.signal);
        if (!next) return;
        fetchedUrlRef.current = url;
        autoTitleRef.current = next;
        if (title !== next) onChange(set(next, ["title"]));
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [url, title, onChange]);

  return props.renderDefault(props);
}
