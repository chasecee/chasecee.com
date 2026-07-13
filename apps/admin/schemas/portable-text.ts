import {
  createContentPortableText,
} from "@chasecee/sanity-kit/studio";

export const contentPortableText = createContentPortableText({
  referenceTypes: ["project", "page", "music"],
});

export const leadInPortableText = {
  ...contentPortableText,
  of: [...contentPortableText.of, { type: "siteMini" }],
};
