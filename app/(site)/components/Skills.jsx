"use client";
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const Skills = () => {
  const ref = useRef(null);
  const breadcrumbRef = useRef(null); // Reference to the breadcrumb div

  useEffect(() => {
    fetch("/json/skills.json")
      .then((response) => response.json())
      .then((data) => {
        if (ref.current) {
          const svg = d3.select(ref.current);

          const width = 711;
          const height = width;

          const color = d3
            .scaleSequential()
            .domain([0, 5])
            .interpolator(
              d3.interpolateHcl("hsl(152,80%,80%)", "hsl(228,30%,40%)"),
            );

          const pack = (data) =>
            d3.pack().size([width, height]).padding(3)(
              d3
                .hierarchy(data)
                .sum((d) => d.value)
                .sort((a, b) => (b.value || 0) - (a.value || 0)),
            );

          const root = pack(data);

          svg
            .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .attr("width", width.toString())
            .attr("height", height.toString())
            .attr("class", "cursor-pointer block h-auto max-w-full");

          const node = svg
            .append("g")
            .selectAll("circle")
            .data(root.descendants().slice(1))
            .join("circle")
            .attr("fill", (d) => (d.children ? color(d.depth) : "white"))
            .attr("class", "stroke-[2px]")
            .attr("pointer-events", (d) => (!d.children ? "none" : null))
            .on("mouseover", function () {
              d3.select(this).attr("stroke", "#000");
            })
            .on("mouseout", function () {
              d3.select(this).attr("stroke", null);
            })
            .on("click", (event, d) => {
              if (focus !== d) {
                zoom(event, d);
                event.stopPropagation();
              }
            });

          const label = svg
            .append("g")
            // .style("font-size", "1rem")
            .attr(
              "class",
              "font-sans text-[2rem] sm:text-[1.5rem] md:text-base",
            )
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants())
            .join("text")
            .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
            .style("display", (d) => (d.parent === root ? "inline" : "none"))
            .text((d) => d.data.name)
            .attr("dy", ".3em")
            .on("click", (event, d) => {
              if (d.parent) {
                zoom(event, d.parent);
                event.stopPropagation();
              }
            });

          svg.on("click", (event) => zoom(event, root));
          let focus = root;
          let view;

          const zoomTo = (v) => {
            const k = width / v[2];

            view = v;

            label.attr(
              "transform",
              (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
            );
            node.attr(
              "transform",
              (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
            );
            node.attr("r", (d) => (d.r * k).toString());
          };

          const zoom = (event = null, d) => {
            const focus0 = focus;

            focus = d;
            updateBreadcrumb(focus); // Update the breadcrumb text with the current node and its ancestors

            // Update rect dimensions based on text dimensions
            const bbox = breadcrumbRef.current.getBoundingClientRect();

            const transition = svg
              .transition()
              .duration(event && event.altKey ? 7500 : 750)
              .tween("zoom", (d) => {
                const i = d3.interpolateZoom(view, [
                  focus.x,
                  focus.y,
                  focus.r * 2,
                ]);
                return (t) => zoomTo(i(t));
              });

            label
              .filter(
                (d, i, groups) =>
                  d.parent === focus || groups[i].style.display === "inline",
              )
              .transition(transition)
              .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
              .on("start", (d, i, groups) => {
                if (d.parent === focus) groups[i].style.display = "inline";
              })
              .on("end", (d, i, groups) => {
                if (d.parent !== focus) groups[i].style.display = "none";
              });
          };

          const updateBreadcrumb = (node) => {
            let breadcrumbText = "";
            while (node) {
              breadcrumbText = `<span className="breadcrumb-node cursor-pointer" data-name="${node.data.name}">${node.data.name}</span>${breadcrumbText}`;
              if (node.parent) {
                breadcrumbText = `<span className="separator"> > </span>${breadcrumbText}`;
              }
              node = node.parent;
            }
            breadcrumbRef.current.innerHTML = breadcrumbText;

            // Add click event handler to the breadcrumb nodes
            const breadcrumbNodes =
              breadcrumbRef.current.querySelectorAll(".breadcrumb-node");
            breadcrumbNodes.forEach((node) => {
              node.addEventListener("click", () => {
                const name = node.dataset.name;
                const targetNode = findNodeByName(root, name);
                if (targetNode) {
                  zoom(null, targetNode);
                }
              });
            });
          };

          const findNodeByName = (node, name) => {
            if (node.data.name === name) {
              return node;
            }
            if (node.children) {
              for (const child of node.children) {
                const foundNode = findNodeByName(child, name);
                if (foundNode) {
                  return foundNode;
                }
              }
            }
            return null;
          };

          zoomTo([focus.x, focus.y, focus.r * 2]);
          updateBreadcrumb(focus); // Show the breadcrumb for the initial node
        }
      });
  }, []);

  return (
    <div className="prose dark:prose-invert relative mx-auto rounded-3xl">
      <div className="text-center">
        <div
          className="breadcrumb flex justify-center rounded-3xl bg-white px-4 py-2 text-neutral-900 dark:bg-neutral-900 dark:text-white"
          ref={breadcrumbRef}
        ></div>
      </div>
      <div className="overflow-hidden rounded-3xl bg-neutral-800">
        <svg ref={ref} />
      </div>
    </div>
  );
};

export default Skills;
