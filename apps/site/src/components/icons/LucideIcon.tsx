import { getLucideSvg } from "./lucide";

interface LucideIconProps {
  icon: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  ariaHidden?: boolean;
}

export default function LucideIcon({
  icon,
  size = 24,
  className,
  strokeWidth,
  ariaHidden = true,
}: LucideIconProps) {
  const svg = getLucideSvg(icon, { size, className, strokeWidth });

  return (
    <span
      className="inline-flex"
      aria-hidden={ariaHidden}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
