import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { ReactNode } from "react";
import backgroundPngDataUrl from "@/assets/bg.png?inline";
import jersey10TtfDataUrl from "@/assets/jersey10-regular.ttf?inline";
import rubikRegularWoffDataUrl from "@/assets/rubik-latin-400.woff?inline";
import rubikBoldWoffDataUrl from "@/assets/rubik-latin-800.woff?inline";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate";

interface OGImageOptions {
  title?: string;
  template?: "home" | "page" | "project";
}

function decodeDataUrl(dataUrl: string) {
  const [, encoded = ""] = dataUrl.split(",");
  return Buffer.from(encoded, "base64");
}

function homeContent() {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 1100,
        textAlign: "center",
        padding: "0 40px",
      },
      children: {
        type: "div",
        props: {
          style: {
            fontSize: 216,
            fontWeight: 400,
            color: "#ffffff",
            margin: 0,
            marginBottom: 20,
            lineHeight: 0.7,
            fontFamily: "Jersey 10",
            whiteSpace: "nowrap",
          },
          children: "Let's build.",
        },
      },
    },
  };
}

function pageContent(title: string) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 1100,
        textAlign: "center",
        padding: "0 40px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 216,
              fontWeight: 400,
              color: "#ffffff",
              margin: 0,
              marginBottom: 20,
              lineHeight: 0.7,
              fontFamily: "Jersey 10",
              whiteSpace: "nowrap",
            },
            children: title,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 28,
              color: "#ffffff",
              margin: 0,
              fontWeight: 300,
              lineHeight: 1.3,
              fontFamily: "Rubik",
              opacity: 0.9,
            },
            children: "chasecee.com",
          },
        },
      ],
    },
  };
}

function projectContent(title: string) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 1100,
        textAlign: "center",
        padding: "0 40px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 128,
              fontWeight: 400,
              color: "#ffffff",
              margin: 0,
              marginBottom: 20,
              lineHeight: 0.7,
              fontFamily: "Jersey 10",
              whiteSpace: "nowrap",
            },
            children: title,
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: 48,
              color: "#f0f0f0",
              margin: 0,
              fontWeight: 300,
              lineHeight: 1.3,
              fontFamily: "Rubik",
              opacity: 0.8,
            },
            children: "chasecee.com",
          },
        },
      ],
    },
  };
}

export async function generateOGImagePng(options: OGImageOptions = {}) {
  const { title, template = "home" } = options;
  const fonts = [
    {
      name: "Jersey 10",
      data: decodeDataUrl(jersey10TtfDataUrl),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Rubik",
      data: decodeDataUrl(rubikRegularWoffDataUrl),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Rubik",
      data: decodeDataUrl(rubikBoldWoffDataUrl),
      weight: 800 as const,
      style: "normal" as const,
    },
  ];

  let content;
  switch (template) {
    case "page":
      content = pageContent(title || "Page");
      break;
    case "project":
      content = projectContent(title || "Project");
      break;
    default:
      content = homeContent();
  }

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "#000000",
        },
        children: [
          {
            type: "img",
            props: {
              src: backgroundPngDataUrl,
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              },
            },
          },
          content,
        ],
      },
    } as ReactNode,
    {
      ...OG_SIZE,
      fonts,
    },
  );

  return new Resvg(svg).render().asPng();
}
