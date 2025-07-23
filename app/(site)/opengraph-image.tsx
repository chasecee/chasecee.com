import { createOGImage } from "@/lib/og-image";

const { Image, size, contentType } = createOGImage({ template: "home" });

export const runtime = "nodejs";
export { size, contentType };
export default Image;
