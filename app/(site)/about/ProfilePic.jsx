"use client";
import { Tilt } from "react-tilt";
import Image from "next/image";
import profilePic from "@/public/me.jpeg";

const alt = "alt text";
const defaultOptions = {
  reverse: false, // reverse the tilt direction
  max: 45, // max tilt rotation (degrees)
  perspective: 200, // Transform perspective, the lower the more extreme the tilt gets.
  scale: 1.2, // 2 = 200%, 1.5 = 150%, etc..
  speed: 1000, // Speed of the enter/exit transition
  transition: true, // Set a transition on enter/exit.
  axis: null, // What axis should be disabled. Can be X or Y.
  reset: true, // If the tilt effect has to be reset on exit.
  easing: "cubic-bezier(.03,.98,.52,.99)", // Easing on enter/exit.
};
export default function ProfilePic() {
  return (
    <>
      <Tilt
        options={defaultOptions}
        className=" group relative flex items-center justify-center rounded-full text-center sm:w-1/4"
      >
        <div className="group w-[260px]">
          <Image
            src={profilePic}
            alt={alt}
            width={500}
            height={500}
            className="m-0 w-full rounded-full"
          />
        </div>
        <div className="absolute -inset-6  animate-[spin_5s_linear_infinite] rounded-full opacity-0 transition-opacity group-hover:opacity-100">
          <div className="border-animation h-full rounded-full"></div>
        </div>
      </Tilt>
    </>
  );
}
