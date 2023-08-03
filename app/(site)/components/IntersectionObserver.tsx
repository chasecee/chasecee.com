"use client"
import { useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  inViewClass: string;
  notInViewClass: string;
};

const IntersectionObserverComponent: React.FC<Props> = ({ children, inViewClass, notInViewClass }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={` ${
        inView ? inViewClass : notInViewClass
      }`}
    >
      {children}
    </div>
  );
};

export default IntersectionObserverComponent;
