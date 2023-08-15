"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  inViewClass: string;
  notInViewClass: string;
  className: string;
  threshold: number;
};

const IntersectionObserverComponent: React.FC<Props> = ({
  children,
  inViewClass,
  notInViewClass,
  className,
  threshold,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const currentRef = ref.current; // Copy ref.current to a variable
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: threshold,
      },
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef); // Use the variable in the cleanup function
      }
    };
  }, [threshold]); // Include threshold in the dependency array

  return (
    <div
      ref={ref}
      className={`${className}  ${inView ? inViewClass : notInViewClass}`}
    >
      {children}
    </div>
  );
};

export default IntersectionObserverComponent;
