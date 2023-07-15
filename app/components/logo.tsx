import * as React from "react";

const Logo = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    width={70}
    height={70}
    viewBox="0 0 500 500"
    {...props}
  >
    <style>{".st2{fill:#fff}"}</style>
    <g id="Layer_2">
      <path
        d="M0 0h500v500H0z"
        style={{
          fill: "#f26667",
        }}
      />
      <path
        d="M499 337 366.8 205.7l-70.2-.2-33.3 34.2-35.3-35.6-96 7 16.1 13.6-16.1-4.9 3 88.8L335.3 500H500z"
        style={{
          fill: "#f04d49",
        }}
      />
    </g>
    <g id="Layer_1">
      <path
        d="M114.3 258c0-41 31-69 71-69 29.4 0 46.4 16 55.8 32.6l-24.4 12c-5.6-10.8-17.6-19.4-31.4-19.4-24.2 0-41.8 18.6-41.8 43.8s17.6 43.8 41.8 43.8c13.8 0 25.8-8.4 31.4-19.4l24.4 11.8c-9.6 16.6-26.4 32.8-55.8 32.8-40 0-71-28-71-69zM251.7 258c0-41 31-69 71-69 29.4 0 46.4 16 55.8 32.6l-24.4 12c-5.6-10.8-17.6-19.4-31.4-19.4-24.2 0-41.8 18.6-41.8 43.8s17.6 43.8 41.8 43.8c13.8 0 25.8-8.4 31.4-19.4l24.4 11.8c-9.6 16.6-26.4 32.8-55.8 32.8-40 0-71-28-71-69z"
        className="st2"
      />
    </g>
  </svg>
)
export default Logo
