import * as React from "react";
const SvgComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={940}
    height={940}
    fill="none"
    {...props}
  >
    <g>
      <mask
        id="d"
        width={901}
        height={901}
        x={19}
        y={20}
        maskUnits="userSpaceOnUse"
        filter="url(#noiseFilter)"
        style={{
          maskType: "alpha",
        }}
      >
        <rect
          width={665.727}
          height={665.727}
          x={469.521}
          fill="url(#c)"
          rx={50}
          transform="rotate(45 469.521 0)"
        />
      </mask>
    </g>
    <g clipPath="url(#a)">
      <rect
        clipPath="url(#d)"
        width={655.727}
        height={655.727}
        x={469.521}
        fill="url(#b)"
        rx={50}
        transform="rotate(45 469.521 0)"
      />
    </g>
    <defs>
      <linearGradient
        id="b"
        x1={469.86}
        x2={1065.24}
        y1={-0.339}
        y2={578.074}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#6F87C5" stopOpacity={0.5} />
        <stop offset={0.299} stopColor="#7574B1" stopOpacity={0.261} />
        <stop offset={1} stopColor="#141355" stopOpacity={0} />
      </linearGradient>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h940v940H0z" filter="url(#noiseFilter)" />
      </clipPath>
      <filter id="noiseFilter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency=".6"
          numOctaves="2"
          stitchTiles="stitch"
        />
      </filter>
    </defs>
  </svg>
);
export default SvgComponent;
