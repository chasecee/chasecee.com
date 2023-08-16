import { Project } from "@/types/Project";

type ColorPaletteProps = {
  colorPalette: string[];
  project: Project;
};
export function ColorPalette({ colorPalette, project }: ColorPaletteProps) {
  return (
    <>
      {colorPalette.map((color, index) => (
        <div
          key={index}
          className={`color-div transform-gpu transition-transform duration-[300ms] ${project.name === "InMoment.com"
            ? "translate-x-0 group-hover:-translate-y-1/2 group-hover:scale-x-75"
            : "group-hover:translate-y-10"
            }`}
          style={{
            backgroundColor: color,
            top: `${((index / colorPalette.length) * 100).toFixed(2)}%`,
            transitionDelay: `${index * 100}ms`,
          }}
        />
      ))}
    </>
  );
}
