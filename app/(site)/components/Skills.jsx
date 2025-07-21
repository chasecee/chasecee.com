"use client";
import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import * as d3 from "d3";

const CONFIG = {
  baseSize: 736,
  padding: 3,
  transitionDuration: 750,
  strokeWidth: 2,
  dragSensitivity: 1,
  aspectRatio: {
    desktop: { width: 16, height: 9 },
    mobile: { width: 9, height: 16 },
  },
};

const STYLES = {
  svg: "cursor-pointer block h-auto w-full",
  svgDragging: "cursor-grabbing block h-auto w-full",
  container: "prose dark:prose-invert max-w-none relative mx-auto rounded-3xl",
  breadcrumb:
    "breadcrumb flex justify-center rounded-3xl bg-white px-4 py-2 text-neutral-900 dark:bg-neutral-900 dark:text-white",
  svgContainer:
    "overflow-hidden rounded-3xl bg-neutral-800 aspect-[9/16] md:aspect-video",
};

const dataCache = new Map();

const useSkillsData = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cacheKey = "/json/skills.json";

    if (dataCache.has(cacheKey)) {
      setData(dataCache.get(cacheKey));
      return;
    }

    fetch(cacheKey)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`),
      )
      .then((result) => {
        dataCache.set(cacheKey, result);
        setData(result);
      })
      .catch((err) => setError(err));
  }, []);

  return { data, error };
};

const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState({
    width: CONFIG.baseSize,
    height:
      (CONFIG.baseSize * CONFIG.aspectRatio.desktop.height) /
      CONFIG.aspectRatio.desktop.width,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth < 768;
      const ratio = isMobile
        ? CONFIG.aspectRatio.mobile
        : CONFIG.aspectRatio.desktop;

      if (isMobile) {
        setDimensions({
          width: (CONFIG.baseSize * ratio.width) / ratio.height,
          height: CONFIG.baseSize,
        });
      } else {
        setDimensions({
          width: CONFIG.baseSize,
          height: (CONFIG.baseSize * ratio.height) / ratio.width,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return dimensions;
};

const Skills = () => {
  const svgRef = useRef(null);
  const breadcrumbRef = useRef(null);
  const focusRef = useRef(null);
  const viewRef = useRef(null);
  const elementsRef = useRef({});
  const isDraggingRef = useRef(false);

  const { data, error } = useSkillsData();
  const { width, height } = useResponsiveDimensions();

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

  const updateTransforms = useCallback(
    (view) => {
      if (!elementsRef.current.nodes || !elementsRef.current.labels) return;

      const k = Math.min(width, height) / view[2];
      const transform = (d) =>
        `translate(${(d.x - view[0]) * k},${(d.y - view[1]) * k})`;

      elementsRef.current.nodes
        .attr("transform", transform)
        .attr("r", (d) => d.r * k);
      elementsRef.current.labels.attr("transform", transform);

      elementsRef.current.labels
        .style("fill-opacity", (d) => {
          const scaledRadius = d.r * k;
          if (scaledRadius < 20) return 0;

          if (d.children) {
            const hasVisibleChildren = d.children.some(
              (child) => child.r * k > 20,
            );
            return hasVisibleChildren ? 0 : 1;
          }
          return 1;
        })
        .style("display", (d) => {
          const scaledRadius = d.r * k;
          if (scaledRadius < 20) return "none";

          if (d.children) {
            const hasVisibleChildren = d.children.some(
              (child) => child.r * k > 20,
            );
            return hasVisibleChildren ? "none" : "inline";
          }
          return "inline";
        });
    },
    [width, height],
  );

  const zoomTo = useCallback(
    (view) => {
      viewRef.current = view;
      updateTransforms(view);
    },
    [updateTransforms],
  );

  const updateBreadcrumb = useCallback((node, root) => {
    if (!breadcrumbRef.current || !node) return;

    const path = [];
    let current = node;
    while (current) {
      path.unshift(current.data.name);
      current = current.parent;
    }

    breadcrumbRef.current.innerHTML = path
      .map(
        (name) =>
          `<span class="breadcrumb-node cursor-pointer" data-name="${name}">${name}</span>`,
      )
      .join('<span class="separator"> > </span>');

    breadcrumbRef.current.querySelectorAll(".breadcrumb-node").forEach((el) => {
      el.onclick = () => {
        const targetNode = findNode(root, el.dataset.name);
        if (targetNode) zoom(null, targetNode, root);
      };
    });
  }, []);

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
      updateBreadcrumb(targetNode, root);

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
    [updateBreadcrumb, zoomTo],
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
      .attr("class", "font-sans text-[2rem] sm:text-[1.5rem] md:text-base")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
      .style("display", (d) => (d.parent === root ? "inline" : "none"))
      .text((d) => d.data.name)
      .attr("dy", "0.3em");

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
        const sensitivity = CONFIG.dragSensitivity;
        const scale = Math.min(width, height);
        const newView = [
          x - (event.dx * r) / (scale * sensitivity),
          y - (event.dy * r) / (scale * sensitivity),
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
    updateBreadcrumb(root, root);

    return () => {
      svg.selectAll("*").remove();
      if (breadcrumbRef.current) breadcrumbRef.current.innerHTML = "";
    };
  }, [
    data,
    packLayout,
    colorScale,
    zoom,
    zoomTo,
    updateBreadcrumb,
    width,
    height,
  ]);

  if (error) {
    return (
      <div className={STYLES.container}>
        <div className="text-center text-red-500">
          Failed to load skills: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={STYLES.container}>
      <div className="text-center">
        <div className={STYLES.breadcrumb} ref={breadcrumbRef}>
          {!data && "Loading..."}
        </div>
      </div>
      <div className={STYLES.svgContainer}>
        <svg ref={svgRef} />
      </div>
    </div>
  );
};

export default Skills;
