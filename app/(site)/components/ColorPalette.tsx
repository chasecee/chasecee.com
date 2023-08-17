import { Project } from "@/types/Project";

type ColorPaletteProps = {
  colorPalette: string[];
  project: Project;
};
export function ColorPalette({ colorPalette, project }: ColorPaletteProps) {
  return (
    <div className="project-gradient-bg absolute inset-0 -bottom-10 -top-10 flex-col flex-nowrap gap-0 overflow-hidden rounded-xl opacity-[20%] transition-all duration-500">
      {colorPalette.map((color, index) => (
        <div
          key={index}
          className={`color-div transform-gpu transition-transform duration-[200ms] ${project.name === "InMoment.com"
            ? "translate-x-0 group-hover:-translate-y-[2rem]"
            : "group-hover:translate-y-[20%]"
            }`}
          style={{
            backgroundColor: color,
            top: `${((index / colorPalette.length) * 100).toFixed(2)}%`,
            transitionDelay: `${index * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}
