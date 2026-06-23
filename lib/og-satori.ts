import satori from "satori";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

interface OGImageOptions {
  title?: string;
  subtitle?: string;
  template?: "home" | "page" | "project";
}

async function loadAssets() {
  const [interRegular, interBold, backgroundImageBuffer] = await Promise.all([
    readFile(join(process.cwd(), "assets/inter-v19-latin-regular.ttf")),
    readFile(join(process.cwd(), "assets/inter-v19-latin-800.ttf")),
    readFile(join(process.cwd(), "assets/bg.png")),
  ]);

  return {
    fonts: [
      {
        name: "Inter",
        data: interRegular,
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "Inter Bold",
        data: interBold,
        weight: 800 as const,
        style: "normal" as const,
      },
    ],
    backgroundImage: `data:image/png;base64,${backgroundImageBuffer.toString("base64")}`,
  };
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
        maxWidth: 800,
        textAlign: "center",
        padding: "0 40px",
      },
      children: {
        type: "div",
        props: {
          style: {
            fontSize: 108,
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            marginBottom: 20,
            lineHeight: 1.1,
            fontFamily: "Inter Bold",
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
        maxWidth: 900,
        textAlign: "center",
        padding: "0 40px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 108,
              fontWeight: 800,
              color: "#ffffff",
              margin: 0,
              marginBottom: 20,
              lineHeight: 1.1,
              fontFamily: "Inter Bold",
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
              fontFamily: "Inter",
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
        maxWidth: 720,
        textAlign: "center",
        padding: "0 40px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 64,
              fontWeight: 800,
              color: "#ffffff",
              margin: 0,
              marginBottom: 20,
              lineHeight: 1.1,
              fontFamily: "Inter Bold",
              maxWidth: "60%",
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
              fontFamily: "Inter",
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
  const { fonts, backgroundImage } = await loadAssets();

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
              src: backgroundImage,
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
    },
    {
      ...OG_SIZE,
      fonts,
    },
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}
