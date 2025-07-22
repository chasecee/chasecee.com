"use client";
import React, { useRef, useMemo, useCallback, useEffect } from "react";
import * as d3 from "d3";
import { useSkillsData } from "../../hooks/useSkillsData";
import { wrapText } from "./utils";
import { ErrorDisplay } from "./ErrorDisplay";
import { D3_VISUALIZATION, COLORS } from "../../constants";

const CONFIG = {
  baseSize: D3_VISUALIZATION.BUBBLE_CONFIG.BASE_SIZE,
  padding: D3_VISUALIZATION.BUBBLE_CONFIG.PADDING,
  transitionDuration: 750,
  strokeWidth: D3_VISUALIZATION.BUBBLE_CONFIG.STROKE_WIDTH,
  dragSensitivity: D3_VISUALIZATION.BUBBLE_CONFIG.DRAG_SENSITIVITY,
};

const STYLES = {
  svg: "cursor-pointer block h-auto w-full",
  svgDragging: "cursor-grabbing block h-auto w-full",
  container: "prose dark:prose-invert max-w-none relative mx-auto rounded-3xl",
  svgContainer: "overflow-hidden rounded-3xl bg-neutral-800 aspect-square",
};

const BubbleView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const focusRef = useRef<any>(null);
  const viewRef = useRef<any>(null);
  const elementsRef = useRef<any>({});
  const isDraggingRef = useRef<boolean>(false);

  const { data, error } = useSkillsData();
  const { width, height } = { width: CONFIG.baseSize, height: CONFIG.baseSize };

  const colorScale = useMemo(
    () =>
      d3
        .scaleSequential()
        .domain(COLORS.DEPTH_DOMAIN)
        .interpolator(
          d3.interpolateHcl("hsl(152,80%,80%)", "hsl(228,30%,40%)"),
        ),
    [],
  );

  const packLayout = useMemo(
    () => d3.pack().size([width, height]).padding(CONFIG.padding),
    [width, height],
  );

  const renderTextSpans = useCallback(
    (element: any, text: string, radius: number, scaledRadius: number) => {
      const fontSize = Math.min(
        scaledRadius / D3_VISUALIZATION.BUBBLE_CONFIG.FONT_SIZE_DIVISOR,
        D3_VISUALIZATION.BUBBLE_CONFIG.MAX_FONT_SIZE,
      );
      const lines = wrapText(text, scaledRadius);
      const lineHeight =
        fontSize * D3_VISUALIZATION.BUBBLE_CONFIG.LINE_HEIGHT_MULTIPLIER;
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
    },
    [],
  );

  const zoomTo = useCallback(
    (v: any) => {
      const k = Math.min(width, height) / v[2];

      viewRef.current = v;

      if (!elementsRef.current.labels || !elementsRef.current.nodes) return;

      elementsRef.current.labels
        .attr(
          "transform",
          (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
        )
        .style(
          "font-size",
          (d: any) => `${Math.min(((d.r || 0) * k) / 3, 24)}px`,
        )
        .each(function (this: any, d: any) {
          const scaledRadius = (d.r || 0) * k;
          renderTextSpans(this, d.data.name, d.r || 0, scaledRadius);
        });

      elementsRef.current.nodes
        .attr(
          "transform",
          (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
        )
        .attr("r", (d: any) => (d.r || 0) * k);
    },
    [width, height, renderTextSpans],
  );

  const zoom = useCallback(
    (event: any, d: any, root: any) => {
      const focus0 = focusRef.current;
      focusRef.current = d;

      const transition = d3
        .select(svgRef.current)
        .transition()
        .duration(CONFIG.transitionDuration)
        .tween("zoom", () => {
          const i = d3.interpolateZoom(viewRef.current || [0, 0, 1], [
            focusRef.current?.x || 0,
            focusRef.current?.y || 0,
            (focusRef.current?.r || 0) * 2,
          ]);
          return (t: number) => zoomTo(i(t));
        });

      if (!elementsRef.current.labels) return;

      elementsRef.current.labels
        .filter(function (this: any, d: any) {
          return d.parent === focus0 || this.style.display === "inline";
        })
        .transition(transition)
        .style("fill-opacity", (d: any) =>
          d.parent === focusRef.current ? 1 : 0,
        )
        .on("start", function (this: any, d: any) {
          if (d.parent === focusRef.current) this.style.display = "inline";
        })
        .on("end", function (this: any, d: any) {
          if (d.parent !== focusRef.current) this.style.display = "none";
        });
    },
    [zoomTo],
  );

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const root = packLayout(
      d3
        .hierarchy(data as any)
        .sum((d: any) => d.value)
        .sort((a: any, b: any) => (b.value || 0) - (a.value || 0)),
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
      .attr("fill", (d: any) => (d.children ? colorScale(d.depth) : "white"))
      .attr("class", `stroke-[${CONFIG.strokeWidth}px]`)
      .attr("pointer-events", (d: any) => (!d.children ? "none" : null))
      .on("mouseover", function () {
        d3.select(this).attr("stroke", "#000");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", null);
      })
      .on("click", (event: any, d: any) => {
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
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .style("fill", "black")
      .style("font-size", (d: any) => `${Math.min((d.r || 0) / 3, 24)}px`)
      .style("fill-opacity", (d: any) => (d.parent === root ? 1 : 0))
      .style("display", (d: any) => (d.parent === root ? "inline" : "none"))
      .each(function (this: any, d: any) {
        renderTextSpans(this, d.data.name, d.r || 0, d.r || 0);
      });

    const dragBehavior = d3
      .drag()
      .on("start", () => {
        if (focusRef.current === root) return;
        isDraggingRef.current = true;
        svg.attr("class", STYLES.svgDragging);
      })
      .on("drag", (event: any) => {
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

    (svg as any).call(dragBehavior);
    svg.on("click", (event: any) => {
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
