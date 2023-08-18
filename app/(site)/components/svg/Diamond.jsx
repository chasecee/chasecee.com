import * as React from "react";
const SvgComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={940}
    height={940}
    fill="none"
    {...props}
  >
    <g clipPath="url(#a)">
      <g clipPath="url(#b)">
        <mask
          id="d"
          width={901}
          height={901}
          x={19}
          y={20}
          maskUnits="userSpaceOnUse"
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
        <g mask="url(#d)">
          <path fill="#000" d="M940 0H-260v1200H940V0Z" />
          <path
            fill="#00C5DF"
            fillOpacity={0.245}
            d="M940 0H-260v1200H940V0Z"
          />
          <mask
            id="e"
            width={1200}
            height={1200}
            x={-260}
            y={0}
            maskUnits="userSpaceOnUse"
            style={{
              maskType: "luminance",
            }}
          >
            <path fill="#fff" d="M940 0H-260v1200H940V0Z" />
          </mask>
          <g filter="url(#f)" mask="url(#e)">
            <path fill="#00C5DF" d="M990.25 277.5h-841.5V939h841.5V277.5Z" />
            <path
              fill="#1BC47D"
              d="M728.5 113.25h-861.75v889.5H728.5v-889.5Z"
            />
            <path fill="#18A0FB" d="M779.5 166.5h-881.25v875.25H779.5V166.5Z" />
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
          </g>
          <path
            fill="gray"
            d="M940 0H-260v1200H940V0Z"
            style={{
              mixBlendMode: "overlay",
            }}
          />
        </g>
      </g>
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h940v940H0z" />
      </clipPath>
      <clipPath id="b">
        <path fill="#fff" d="M-260 0H940v1200H-260z" />
      </clipPath>
      <linearGradient
        id="c"
        x1={469.86}
        x2={915.337}
        y1={-0.339}
        y2={495.343}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#E2E2E2" />
        <stop offset={1} stopColor="#D9D9D9" stopOpacity={0} />
      </linearGradient>
      <filter
        id="f"
        width={1873.5}
        height={1678.5}
        x={-508.25}
        y={-261.75}
        colorInterpolationFilters="sRGB"
        filterUnits="userSpaceOnUse"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feGaussianBlur
          result="effect1_foregroundBlur_1_2"
          stdDeviation={187.5}
        />
      </filter>
      <filter id="noiseFilter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency=".05"
          numOctaves="3"
          stitchTiles="stitch"
        />
      </filter>
    </defs>
  </svg>
);
export default SvgComponent;
