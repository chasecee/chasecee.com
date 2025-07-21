"use client";
import React, { useRef, useMemo, useCallback, useEffect } from "react";
import * as d3 from "d3";
import { useSkillsData } from "../../hooks/useSkillsData";
import { wrapText } from "./utils";
import { ErrorDisplay } from "./ErrorDisplay";

const CONFIG = {
  baseSize: 736,
  padding: 3,
  transitionDuration: 750,
  strokeWidth: 2,
  dragSensitivity: 1,
};

const STYLES = {
  svg: "cursor-pointer block h-auto w-full",
  svgDragging: "cursor-grabbing block h-auto w-full",
  container: "prose dark:prose-invert max-w-none relative mx-auto rounded-3xl",
  svgContainer: "overflow-hidden rounded-3xl bg-neutral-800 aspect-square",
};

const BubbleView = () => {
  const svgRef = useRef(null);
  const focusRef = useRef(null);
  const viewRef = useRef(null);
  const elementsRef = useRef({});
  const isDraggingRef = useRef(false);

  const { data, error } = useSkillsData();
  const { width, height } = { width: CONFIG.baseSize, height: CONFIG.baseSize };

  const colorScale = useMemo(
    () =>
      d3
        .scaleSequential()
        .domain([0, 5])
        .interpolator(
          d3.interpolateHcl("hsl(152,80%,80%)", "hsl(228,30%,40%)"),
        ),
    [],
  );

  const packLayout = useMemo(
    () => d3.pack().size([width, height]).padding(CONFIG.padding),
    [width, height],
  );

  const renderTextSpans = useCallback((element, text, radius, scaledRadius) => {
    const fontSize = Math.min(scaledRadius / 3, 24);
    const lines = wrapText(text, scaledRadius);
    const lineHeight = fontSize * 1.1;
    const totalHeight = (lines.length - 1) * lineHeight;

    d3.select(element).selectAll("tspan").remove();

    lines.forEach((line, i) => {
      d3.select(element)
        .append("tspan")
        .attr("x", 0)
        .attr("dy", i === 0 ? -totalHeight / 2 + "px" : lineHeight + "px")
        .style("font-size", fontSize + "px")
        .text(line);
    });
  }, []);

  const updateTransforms = useCallback(
    (view) => {
      if (!elementsRef.current.nodes || !elementsRef.current.labels) return;

      const k = Math.min(width, height) / view[2];
      const transform = (d) =>
        `translate(${(d.x - view[0]) * k},${(d.y - view[1]) * k})`;

      elementsRef.current.nodes
        .attr("transform", transform)
        .attr("r", (d) => d.r * k);

      elementsRef.current.labels
        .attr("transform", transform)
        .each(function (d) {
          const scaledRadius = d.r * k;
          renderTextSpans(this, d.data.name, d.r, scaledRadius);
        });

      elementsRef.current.labels
        .style("fill-opacity", (d) => {
          const scaledRadius = d.r * k;
          const fontSize = Math.min((d.r * k) / 3, 24);
          if (scaledRadius < 15 || fontSize < 8) return 0;

          if (focusRef.current) {
            if (focusRef.current.data.name === "Skills") {
              return d.parent && d.parent.data.name === "Skills" ? 1 : 0;
            }
            return d.parent === focusRef.current ? 1 : 0;
          }
          return 1;
        })
        .style("display", (d) => {
          const scaledRadius = d.r * k;
          const fontSize = Math.min((d.r * k) / 3, 24);
          if (scaledRadius < 15 || fontSize < 8) return "none";

          if (focusRef.current) {
            if (focusRef.current.data.name === "Skills") {
              return d.parent && d.parent.data.name === "Skills"
                ? "inline"
                : "none";
            }
            return d.parent === focusRef.current ? "inline" : "none";
          }
          return "inline";
        });
    },
    [width, height, renderTextSpans],
  );

  const zoomTo = useCallback(
    (view) => {
      viewRef.current = view;
      updateTransforms(view);
    },
    [updateTransforms],
  );

  const findNode = useCallback((node, name) => {
    if (node.data.name === name) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, name);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const zoom = useCallback(
    (event, targetNode, root) => {
      if (!targetNode || !svgRef.current) return;

      focusRef.current = targetNode;

      const svg = d3.select(svgRef.current);
      const transition = svg
        .transition()
        .duration(CONFIG.transitionDuration)
        .tween("zoom", () => {
          const interpolate = d3.interpolateZoom(viewRef.current, [
            targetNode.x,
            targetNode.y,
            targetNode.r * 2,
          ]);
          return (t) => zoomTo(interpolate(t));
        });

      elementsRef.current.labels
        .filter(
          (d, i, groups) =>
            d.parent === targetNode || groups[i].style.display === "inline",
        )
        .transition(transition)
        .style("fill-opacity", (d) => (d.parent === targetNode ? 1 : 0))
        .on("start", (d, i, groups) => {
          if (d.parent === targetNode) groups[i].style.display = "inline";
        })
        .on("end", (d, i, groups) => {
          if (d.parent !== targetNode) groups[i].style.display = "none";
        });
    },
    [zoomTo],
  );

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const root = packLayout(
      d3
        .hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => (b.value || 0) - (a.value || 0)),
    );
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr("class", STYLES.svg);

    const nodes = svg
      .append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
      .attr("fill", (d) => (d.children ? colorScale(d.depth) : "white"))
      .attr("class", `stroke-[${CONFIG.strokeWidth}px]`)
      .attr("pointer-events", (d) => (!d.children ? "none" : null))
      .on("mouseover", function () {
        d3.select(this).attr("stroke", "#000");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", null);
      })
      .on("click", (event, d) => {
        if (isDraggingRef.current || focusRef.current === d) return;
        zoom(event, d, root);
        event.stopPropagation();
      });

    const labels = svg
      .append("g")
      .attr("class", "font-sans")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("fill", "black")
      .style("font-size", (d) => `${Math.min(d.r / 3, 24)}px`)
      .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
      .style("display", (d) => (d.parent === root ? "inline" : "none"))
      .each(function (d) {
        renderTextSpans(this, d.data.name, d.r, d.r);
      });

    const dragBehavior = d3
      .drag()
      .on("start", () => {
        if (focusRef.current === root) return;
        isDraggingRef.current = true;
        svg.attr("class", STYLES.svgDragging);
      })
      .on("drag", (event) => {
        if (focusRef.current === root || !viewRef.current) return;
        const [x, y, r] = viewRef.current;
        const scale = Math.min(width, height);
        const newView = [
          x - (event.dx * r) / (scale * CONFIG.dragSensitivity),
          y - (event.dy * r) / (scale * CONFIG.dragSensitivity),
          r,
        ];
        zoomTo(newView);
      })
      .on("end", () => {
        isDraggingRef.current = false;
        svg.attr("class", STYLES.svg);
      });

    svg.call(dragBehavior);
    svg.on("click", (event) => {
      if (isDraggingRef.current) return;
      zoom(event, root, root);
    });

    elementsRef.current = { nodes, labels };
    focusRef.current = root;

    const initialView = [root.x, root.y, root.r * 2];
    viewRef.current = initialView;
    zoomTo(initialView);

    return () => {
      svg.selectAll("*").remove();
    };
  }, [
    data,
    packLayout,
    colorScale,
    zoom,
    zoomTo,
    renderTextSpans,
    width,
    height,
  ]);

  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className={STYLES.container}>
      <div className={STYLES.svgContainer}>
        <svg ref={svgRef} />
      </div>
    </div>
  );
};

export default BubbleView;
