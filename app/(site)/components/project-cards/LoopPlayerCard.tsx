import Image from "next/image";
import { Project } from "@/types/Project";
import type { ProjectCardProps } from "@/types/UI";

export default function LoopPlayerCard({
  project,
}: Pick<ProjectCardProps, "project">) {
  return (
    <div className="relative h-0 overflow-hidden rounded-xl pt-[100%]">
      <Image
        src="/img/loop-box.webp"
        alt=""
        width={473}
        height={473}
        className="absolute inset-0 h-full w-full rounded-xl object-cover"
        fetchPriority="high"
        loading="eager"
        priority={true}
      />

      {project.svgcode?.code && (
        <div className="view-actor absolute inset-0 transition-transform delay-[25ms] duration-500 group-hover:scale-110 group-hover:duration-300">
          <div
            className="svg-parent absolute top-1/2 left-1/2 h-full w-[50%] -translate-x-1/2 -translate-y-1/2 text-white"
            dangerouslySetInnerHTML={{
              __html: project.svgcode.code,
            }}
          />
        </div>
      )}
    </div>
  );
}
