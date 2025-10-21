interface LinkOutIconProps {
  className?: string;
  size?: number;
}

export default function LinkOutIcon({
  className = "",
  size = 24,
}: LinkOutIconProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
    >
      <title>External Link</title>
      <path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
        fill="currentColor"
      />
      <polyline points="15,3 21,3 21,9" fill="currentColor" />
      <line
        x1="10"
        y1="14"
        x2="21"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
