import { Project } from "@/types/Project";

interface ColorPaletteObject {
  darkest: string;
  darker: string;
  main: string;
  lighter: string;
  lightest: string;
}

interface ColorPaletteProps {
  colorPalette: ColorPaletteObject;
  project?: Project;
}

export function ColorPalette({ colorPalette, project }: ColorPaletteProps) {
  const colors = [
    colorPalette.darkest,
    colorPalette.darker,
    colorPalette.main,
    colorPalette.lighter,
    colorPalette.lightest,
  ];

  // If no project is provided, return simple palette
  if (!project) {
    return (
      <div className="color-palette flex space-x-1">
        {colors.map((color, index) => (
          <div
            key={index}
            className="h-8 w-8 rounded-full border border-gray-300"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="project-gradient-bg absolute inset-0 -top-10 -bottom-10 flex-col flex-nowrap gap-0 overflow-hidden rounded-xl opacity-[20%] transition-all duration-500">
      {colors.map((color, index) => (
        <div
          key={index}
          className={`color-div transform-gpu transition-transform duration-[200ms] ${
            project.name === "Strider Intel"
              ? "group-hover:translate-y-[20%]"
              : ""
          } ${project.name === "doxy.me" ? "group-hover:translate-y-[20%]" : ""} ${
            project.name === "InMoment.com"
              ? "translate-x-0 group-hover:-translate-y-[10%]"
              : ""
          } ${
            project.name === "Yoli"
              ? "translate-x-0 group-hover:-translate-x-[10%] group-hover:-translate-y-[10%]"
              : ""
          }`}
          style={{
            backgroundColor: color,
            top: `${((index / colors.length) * 100).toFixed(2)}%`,
            transitionDelay: `${index * 20}ms`,
            left:
              project.name === "Yoli"
                ? `${((index / colors.length) * 100).toFixed(2)}%`
                : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default ColorPalette;
