export interface ColorPalette {
  darkest: string;
  darker: string;
  main: string;
  lighter: string;
  lightest: string;
}

export interface ButtonProps
  extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement> &
      React.ButtonHTMLAttributes<HTMLButtonElement>,
    "href" | "children"
  > {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface ProjectCardProps {
  project: import("./Project").Project;
  index?: number;
}

export interface ErrorDisplayProps {
  error: string;
}
