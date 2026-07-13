import {
  createContentPortableText,
} from "@chasecee/sanity-kit/studio";

const videoFileBlock = {
  name: "videoFile",
  type: "file",
  title: "Video file",
  accept: ".mp4,.webm",
  fields: [
    {
      name: "alt",
      type: "string",
      title: "Alt text",
      description: "Alternative text for accessibility.",
    },
  ],
};

export const contentPortableText = createContentPortableText({
  referenceTypes: ["project", "page", "music"],
  extraOf: [videoFileBlock],
});

export const leadInPortableText = {
  ...contentPortableText,
  of: [...contentPortableText.of, { type: "siteMini" }],
};
