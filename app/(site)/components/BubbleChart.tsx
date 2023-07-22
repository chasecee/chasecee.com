import React, { useEffect, useRef } from 'react';
import { scaleOrdinal } from 'd3-scale';
import { range } from 'd3-array';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { forceSimulation, forceManyBody, forceCollide, SimulationNodeDatum } from 'd3-force';
import { select } from 'd3-selection';
import { interpolateNumber } from 'd3-interpolate';

interface Node extends SimulationNodeDatum {
  cluster: number;
  radius: number;
}

const MyComponent: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const width = 960,
      height = 500,
      padding = 1.5, // separation between same-color circles
      clusterPadding = 6, // separation between different-color circles
      maxRadius = 12;

    const n = 200, // total number of circles
      m = 10; // number of distinct clusters

    const color = scaleOrdinal<string>()
      .domain(range(m).map((d) => d.toString()))
      .range(schemeCategory10);

    // The largest node for each cluster.
    const clusters: any[] = new Array(m);

    const nodes: Node[] = range(n).map(() => {
      const i = Math.floor(Math.random() * m);
      const r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius;
      const d: Node = { cluster: i, radius: r, index: 0, vx: 0, vy: 0, x: 0, y: 0 };
      if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
      return d;
    });

    const simulation = forceSimulation<Node>(nodes)
      .force('charge', forceManyBody().strength(0))
      .force('collide', forceCollide<Node>().radius((d) => d.radius + padding))
      .on('tick', tick);

    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const circle = svg.selectAll<SVGCircleElement, Node>('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d) => d.radius)
      .style('fill', (d) => color(d.cluster.toString())) // Convert the cluster value to a string
      .call((circle) => circle.transition().duration(750).delay((d, i) => i * 5).attrTween('r', function (d) {
        const interpolate = interpolateNumber(0, d.radius);
        return function (t) {
          return interpolate(t) + '';
        };
      }))
      .on('mouseover', (d) => console.log(d));

    function tick() {
      circle
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
    }
  }, []);

  return <svg ref={svgRef} />;
};

export default MyComponent;
