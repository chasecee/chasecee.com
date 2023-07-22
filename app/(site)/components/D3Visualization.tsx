import React, { useEffect } from 'react';
import { SimulationNodeDatum, forceSimulation, forceX, forceY, forceCollide, forceManyBody, forceCenter } from 'd3-force';
import { scaleOrdinal } from 'd3-scale';
import { select } from 'd3-selection';
import { drag as d3Drag } from 'd3-drag';
import { forceCluster } from 'd3-force-cluster'; // Import forceCluster

interface Skill extends SimulationNodeDatum {
    name: string;
    years: number;
    cluster: number;
    radius?: number;
    id?: number;
    fx?: null | number;
    fy?: null | number;
    x?: number;
    y?: number;
}

const ForceGraph: React.FC = () => {
    useEffect(() => {
        const skills: Skill[] = [
            { name: 'JS', years: 7, cluster: 0 },
            { name: 'React', years: 5, cluster: 0 },
            { name: 'NextJS', years: 2, cluster: 0 },
            { name: 'PHP', years: 9, cluster: 0 },
            { name: 'HTML', years: 10, cluster: 0 },
            { name: 'CSS', years: 10, cluster: 0 },
            { name: 'Tailwind', years: 3, cluster: 0 },
            { name: 'Wordpress', years: 12, cluster: 0 },
            { name: 'Photoshop', years: 12, cluster: 1 },
            { name: 'After Effects', years: 5, cluster: 1 },
            { name: 'Illustrator', years: 7, cluster: 1 },
            { name: 'Figma', years: 4, cluster: 1 },
            { name: 'Sysadmin', years: 8, cluster: 2 },
            { name: 'Node', years: 5, cluster: 2 },
            { name: 'Networking', years: 10, cluster: 2 },
            { name: 'Cloudflare', years: 8, cluster: 2 },
        ];

        const width = 1280;
        const height = 500;

        const color = scaleOrdinal<string>().domain(skills.map((d) => d.cluster.toString())).range(["#ff0000", "#5e35b1", "#0000ff"]);

        const nodes: SimulationNodeDatum[] = skills.map((skill, i) => {
            const calculatedRadius = Math.max(skill.years * 5, 30);
            const minimumRadius = 15; // Set the minimum radius here
            const radius = Math.max(calculatedRadius, minimumRadius);
            return {
                ...skill,
                radius,
                id: i,
            };
        });

        const clusterCenters: { [key: number]: { x: number; y: number } } = {};

        // Find the largest node in each cluster and set its position as the cluster center
        nodes.forEach((node) => {
            const clusterId = node.cluster;
            const center = clusterCenters[clusterId];
            if (!center || node.radius! > center.radius!) {
                clusterCenters[clusterId] = { x: node.x || 0, y: node.y || 0 };
            }
        });

        const simulation = forceSimulation(nodes)
            .force('collide', forceCollide().radius((d: Skill) => (d.radius || 0) + 2).strength(.6)) // Increase collide strength to prevent overlap
            .force('charge', forceManyBody().strength(-50))
            .force('center', forceCenter(width / 2, height / 2)) // Center force for all nodes
            .force(
                'cluster',
                forceCluster() // Add the forceCluster here
                    .centers((d: Skill) => clusterCenters[d.cluster])
                    .strength(2) // Increase the strength to keep nodes in their clusters
            )
            .force('x', forceX().strength(0.3).x((d: Skill) => clusterCenters[d.cluster].x)) // Horizontal force based on cluster center
            .force('y', forceY().strength(0.1).y((d: Skill) => clusterCenters[d.cluster].y)) // Vertical force based on cluster center
            .on('tick', ticked);

        const svg = select('#d3viz')
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const circles = svg
            .append('g')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', (d: Skill) => d.radius)
            .attr('fill', (d: Skill) => color(d.cluster.toString()))
            .attr('cx', (d: Skill) => d.x)
            .attr('cy', (d: Skill) => d.y)
            .call(drag(simulation));

        const labels = svg
            .append('g')
            .selectAll('text')
            .data(nodes)
            .join('text')
            .text((d: Skill) => d.name)
            .attr('x', (d: Skill) => d.x)
            .attr('y', (d: Skill) => d.y)
            .attr('text-anchor', 'middle')
            .attr('font-size', '.875rem');

        function ticked() {
            circles.attr('cx', (d: Skill) => d.x).attr('cy', (d: Skill) => d.y);
            labels.attr('x', (d: Skill) => d.x).attr('y', (d: Skill) => d.y + 5);
        }

        function drag(simulation: any) {
            function dragstarted(event: any) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event: any) {
                const radius = event.subject.radius || 0;
                event.subject.fx = Math.max(radius, Math.min(width - radius, event.x));
                event.subject.fy = Math.max(radius, Math.min(height - radius, event.y));
            }

            function dragended(event: any) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3Drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        }
    }, []);

    return <div id="d3viz" className='max-w-full' />;
};

export default ForceGraph;
