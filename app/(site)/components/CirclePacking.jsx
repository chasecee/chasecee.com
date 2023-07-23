import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const CirclePacking = () => {
  const ref = useRef(null);

  useEffect(() => {
    fetch('/json/skills.json')
      .then(response => response.json())
      .then((data) => {
        if (ref.current) {
          const svg = d3.select(ref.current);

          const width = 800;
          const height = 800;

          const color = d3.scaleSequential()
            .domain([0, 5])
            .interpolator(d3.interpolateHcl("hsl(152,80%,80%)", "hsl(228,30%,40%)"));

          const pack = (data) => d3.pack()
            .size([width, height])
            .padding(3)
            (d3.hierarchy(data)
              .sum((d) => d.value)
              .sort((a, b) => (b.value || 0) - (a.value || 0)));

          const root = pack(data);

          svg.attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .attr("width", width.toString())
            .attr("height", height.toString())
            .attr("style", `max-width: 100%; height: auto; display: block; background: transparent; cursor: pointer;`);

          const node = svg.append("g")
            .selectAll("circle")
            .data(root.descendants().slice(1))
            .join("circle")
            .attr("fill", (d) => d.children ? color(d.depth) : "white")
            .attr("pointer-events", (d) => !d.children ? "none" : null)
            .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
            .on("mouseout", function() { d3.select(this).attr("stroke", null); })
            .on("click", (event, d) => {
              if (focus !== d) {
                zoom(event, d);
                event.stopPropagation();
              }
            });

          const label = svg.append("g")
            .style("font", "15px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants())
            .join("text")
            .style("fill-opacity", (d) => d.parent === root ? 1 : 0)
            .style("display", (d) => d.parent === root ? "inline" : "none")
            .text((d) => d.data.name)
            .attr("dy", ".5em");

          svg.on("click", (event) => zoom(event, root));
          let focus = root;
          let view;

          const zoomTo = (v) => {
            const k = width / v[2];

            view = v;

            label.attr("transform", (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("transform", (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("r", (d) => (d.r * k).toString());
          }

          const zoom = (event, d) => {
            const focus0 = focus;

            focus = d;

            const transition = svg.transition()
              .duration(event.altKey ? 7500 : 750)
              .tween("zoom", d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return (t) => zoomTo(i(t));
              });

            label
              .filter((d, i, groups) => d.parent === focus || groups[i].style.display === "inline")
              .transition(transition)
              .style("fill-opacity", (d) => d.parent === focus ? 1 : 0)
              .on("start", (d, i, groups) => { if (d.parent === focus) groups[i].style.display = "inline"; })
              .on("end", (d, i, groups) => { if (d.parent !== focus) groups[i].style.display = "none"; });
          }

          zoomTo([focus.x, focus.y, focus.r * 2]);
        }
      });
  }, []);

  return <svg className="mx-auto" ref={ref} />;
};

export default CirclePacking;
