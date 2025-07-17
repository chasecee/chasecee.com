import { createDynamicOGImage } from "@/lib/og-image";
import { getProject } from "@/sanity/sanity-utils";

const { Image, size, contentType } = createDynamicOGImage(
  async (params: { project: string }) => {
    const result = await getProject(params.project);
    return {
      template: "project" as const,
      title: result?.project?.name || "Project",
    };
  },
);

export { size, contentType };
export default Image;
