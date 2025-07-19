import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

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
        style: "normal" as const,
        weight: 400 as const,
      },
      {
        name: "Inter Bold",
        data: interBold,
        style: "normal" as const,
        weight: 800 as const,
      },
    ],
    backgroundImage: Uint8Array.from(backgroundImageBuffer).buffer,
  };
}

function HomeTemplate() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 800,
        textAlign: "center",
        padding: "0 40px",
      }}
    >
      <h1
        style={{
          fontSize: 108,
          fontWeight: 800,
          color: "#ffffff",
          margin: 0,
          marginBottom: 20,
          lineHeight: 1.1,
          fontFamily: "Inter Bold",
        }}
      >
        Let&apos;s build.
      </h1>
    </div>
  );
}

function PageTemplate({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 900,
        textAlign: "center",
        padding: "0 40px",
      }}
    >
      <h1
        style={{
          fontSize: 108,
          fontWeight: 800,
          color: "#ffffff",
          margin: 0,
          marginBottom: 20,
          lineHeight: 1.1,
          fontFamily: "Inter Bold",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 28,
          color: "#ffffff",
          margin: 0,
          fontWeight: 300,
          lineHeight: 1.3,
          fontFamily: "Inter",
          opacity: 0.9,
        }}
      >
        chasecee.com
      </p>
    </div>
  );
}

function ProjectTemplate({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 720,
        textAlign: "center",
        padding: "0 40px",
      }}
    >
      <h1
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: "#ffffff",
          margin: 0,
          marginBottom: 20,
          lineHeight: 1.1,
          fontFamily: "Inter Bold",
          maxWidth: "60%",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 48,
          color: "#f0f0f0",
          margin: 0,
          fontWeight: 300,
          lineHeight: 1.3,
          fontFamily: "Inter",
          opacity: 0.8,
        }}
      >
        chasecee.com
      </p>
    </div>
  );
}

export async function generateOGImage(options: OGImageOptions = {}) {
  const { title, template = "home" } = options;
  const { fonts, backgroundImage } = await loadAssets();

  let content;
  switch (template) {
    case "home":
      content = <HomeTemplate />;
      break;
    case "page":
      content = <PageTemplate title={title || "Page"} />;
      break;
    case "project":
      content = <ProjectTemplate title={title || "Project"} />;
      break;
    default:
      content = <HomeTemplate />;
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "#000000",
        }}
      >
        <img
          alt=""
          src={backgroundImage as any}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {content}
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}

export function createOGImage(options: OGImageOptions = {}) {
  const Image = async () => generateOGImage(options);
  return { Image, size, contentType };
}

export function createDynamicOGImage<T>(
  getOptions: (params: T) => Promise<OGImageOptions> | OGImageOptions,
) {
  const Image = async ({ params }: { params: T }) => {
    const options = await getOptions(params);
    return generateOGImage(options);
  };
  return { Image, size, contentType };
}
