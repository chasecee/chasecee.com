import React from "react";

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:gap-20 opacity-30">
      <div>
        <div className="animate-pulse bg-current rounded-xl pt-[100%]" />
        <div className="animate-pulse bg-current rounded-xl h-[1rem] mt-3" />
      </div>
      <div>
        <div className="animate-pulse bg-current rounded-xl pt-[100%]" />
        <div className="animate-pulse bg-current rounded-xl h-[1rem] mt-3" />
      </div>
      <div>
        <div className="animate-pulse bg-current rounded-xl pt-[100%]" />
        <div className="animate-pulse bg-current rounded-xl h-[1rem] mt-3" />
      </div>
      <div>
        <div className="animate-pulse bg-current rounded-xl pt-[100%]" />
        <div className="animate-pulse bg-current rounded-xl h-[1rem] mt-3" />
      </div>
    </div>
  );
}
