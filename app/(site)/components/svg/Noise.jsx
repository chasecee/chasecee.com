import * as React from "react";
const SvgComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={1400}
    height={940}
    fill="none"
    {...props}
  >
    <filter id="noiseFilter">
      <feTurbulence
        type="fractalNoise"
        baseFrequency=".6"
        numOctaves="2"
        stitchTiles="stitch"
      />
    </filter>

    <g>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </g>
  </svg>
);
export default SvgComponent;
