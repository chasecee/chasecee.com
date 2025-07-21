"use client";
import Image from "next/image";
import Tilt from "react-parallax-tilt";
import profilePic from "@/public/me.jpeg";

const alt = "alt text";

export default function ProfilePic(): JSX.Element {
  return (
    <>
      <Tilt
        className="group relative flex size-[230px] flex-shrink-0 items-center justify-center rounded-full text-center"
        tiltMaxAngleX={15}
        tiltMaxAngleY={15}
        perspective={1000}
        scale={1.1}
        gyroscope={true}
        transitionSpeed={2000}
        transitionEasing="cubic-bezier(.03,.98,.52,.99)"
      >
        <div className="group">
          <Image
            src={profilePic}
            alt={alt}
            width={500}
            height={500}
            priority={true}
            className="m-0 w-full rounded-full"
          />
        </div>
        <div className="absolute -inset-6 hidden aspect-square animate-[spin_5s_linear_infinite] rounded-full opacity-0 transition-opacity group-hover:opacity-100 md:block">
          <div className="border-animation h-full rounded-full"></div>
        </div>
      </Tilt>
    </>
  );
}
