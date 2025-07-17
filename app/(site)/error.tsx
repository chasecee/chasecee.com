"use client"; // Error components must be Client Components

import { useEffect } from "react";
import Button from "./components/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-5">
      <h2>Something went wrong!</h2>
      <Button
        className="mt-2 bg-red-800/50 px-4 ring-red-800/50 dark:ring-red-800/50"
        href="/"
      >
        Try again
      </Button>
    </div>
  );
}
