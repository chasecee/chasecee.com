"use client";
import React, { useEffect, useRef } from "react";

const DrawArrow = (): JSX.Element => {
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const div1 = div1Ref.current;
    const div2 = div2Ref.current;
    const svg = svgRef.current;

    if (!div1 || !div2 || !svg) return;

    const rect1 = div1.getBoundingClientRect();
    const rect2 = div2.getBoundingClientRect();

    const x1 = rect1.x + rect1.width / 2;
    const y1 = rect1.y + rect1.height / 2;
    const x2 = rect2.x + rect2.width / 2;
    const y2 = rect2.y + rect2.height / 2;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1.toString());
    line.setAttribute("y1", y1.toString());
    line.setAttribute("x2", x2.toString());
    line.setAttribute("y2", y2.toString());
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#arrowhead)");
    svg.appendChild(line);

    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker",
    );
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 0 0 L 10 3.5 L 0 7 Z");
    marker.appendChild(path);
    svg.appendChild(marker);

    svg.setAttribute("width", window.innerWidth.toString());
    svg.setAttribute("height", window.innerHeight.toString());
  }, []);

  return (
    <div className="relative">
      <div
        ref={div1Ref}
        style={{
          position: "absolute",
          top: "50px",
          left: "500px",
          width: "100px",
          height: "100px",
          backgroundColor: "red",
        }}
      ></div>
      <div
        ref={div2Ref}
        style={{
          position: "absolute",
          top: "200px",
          left: "200px",
          width: "100px",
          height: "100px",
          backgroundColor: "blue",
        }}
      ></div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default DrawArrow;
