import { createOGImage } from "@/lib/og-image";

const { Image, size, contentType } = createOGImage({
  template: "page",
  title: "Contact",
});

export { size, contentType };
export default Image;
