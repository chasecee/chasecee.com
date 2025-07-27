export interface ColorPalette {
  darkest: string;
  darker: string;
  main: string;
  lighter: string;
  lightest: string;
}

export interface CommonComponentProps {
  children?: React.ReactNode;
  className?: string;
}

export interface ContainerProps extends CommonComponentProps {
  showCTA?: boolean;
}

export interface ButtonProps
  extends Omit<
      React.AnchorHTMLAttributes<HTMLAnchorElement>,
      "href" | "children"
    >,
    Omit<
      React.ComponentProps<typeof import("next/link").default>,
      "className"
    > {
  className?: string;
}

export interface ProjectCardProps {
  project: import("./Project").Project;
  index?: number;
}

export interface BreakpointSize {
  type: "xs" | "sm" | "md" | "lg" | "xl";
}

export interface ErrorDisplayProps {
  error: string;
}

export interface IconProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

export interface ColorPaletteProps {
  colorPalette: ColorPalette;
  project?: import("./Project").Project;
}

export interface ProjectsListProps {
  projects: import("./Project").Project[];
  title?: string;
  columns?: number;
  forceLoading?: boolean;
}

export interface CTASectionProps {
  outerClass?: string;
  title: string;
  subtitle: string;
  primaryLink: string;
  secondaryLink: string;
}

export interface BodyProps {
  value: (
    | import("@portabletext/types").PortableTextBlock
    | import("@portabletext/types").ArbitraryTypedObject
  )[];
}
