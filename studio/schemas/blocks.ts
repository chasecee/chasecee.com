export const imageBlock = {
  type: "image",
  options: { hotspot: true },
  fields: [{ name: "alt", type: "string", title: "Alt Text" }],
};

export const mediaBlock = {
  name: "media",
  type: "object",
  title: "Media",
  fields: [{ name: "media", type: "file", title: "Media file" }],
};

export const columnsBlock = {
  type: "columns",
};

export const contentBlocks = [
  { type: "embed" },
  { type: "skills" },
  imageBlock,
  mediaBlock,
];
