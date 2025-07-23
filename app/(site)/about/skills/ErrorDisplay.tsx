import type { ErrorDisplayProps } from "@/types/UI";

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => (
  <div className="text-red-500">Error: {error}</div>
);
