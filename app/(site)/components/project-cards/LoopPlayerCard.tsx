import { Project } from "@/types/Project";

type LoopPlayerCardProps = {
  project: Project;
};

export default function LoopPlayerCard({ project }: LoopPlayerCardProps) {
  return (
    <div className="relative h-0 overflow-hidden rounded-xl pt-[100%]">
      <div
        className="absolute inset-0 scale-105 rounded-xl bg-black bg-size-[200%] bg-top-left bg-no-repeat transition-[background-position] duration-300 group-hover:bg-top-right group-active:bg-top-right md:group-active:bg-bottom-right"
        style={{
          backgroundImage: `url(/img/loop-box.jpg)`,
        }}
      ></div>

      {project.svgcode?.code && (
        <div className="view-actor absolute inset-0 transition-transform delay-[25ms] duration-500 group-hover:scale-105 group-hover:duration-300">
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
