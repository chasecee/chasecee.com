import React, { useEffect, useRef } from 'react';
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
    const isDragging = useRef(false);

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
            { name: 'Premier', years: 5, cluster: 1 },
            { name: 'Illustrator', years: 7, cluster: 1 },
            { name: 'Figma', years: 4, cluster: 1 },
            { name: 'Sysadmin', years: 8, cluster: 2 },
            { name: 'Node', years: 5, cluster: 2 },
            { name: 'Networking', years: 10, cluster: 2 },
            { name: 'Cloudflare', years: 8, cluster: 2 },
            { name: 'AWS', years: 7, cluster: 2 },
        ];

        const width = 1280;
        const height = 500;

        const color = scaleOrdinal<string>().domain(skills.map((d) => d.cluster.toString())).range(["#075985", "#3730a3", "#1d4ed8"]);

        const nodes: Skill[] = skills.map((skill, i) => {
            const calculatedRadius = Math.max(skill.years * 5, 30);
            const minimumRadius = 15; // Set the minimum radius here
            const radius = Math.max(calculatedRadius, minimumRadius);
            return {
                ...skill,
                radius,
                id: i,
            };
        });

        const clusterCenters: { [key: number]: { x: number; y: number; radius: number } } = {};

        // Find the largest node in each cluster and set its position as the cluster center
        nodes.forEach((node) => {
            const clusterId = node.cluster;
            const center = clusterCenters[clusterId] || { x: 0, y: 0, radius: 0 }; // Initialize center if not set
            if (!clusterCenters[clusterId] || node.radius! > center.radius) {
                clusterCenters[clusterId] = {
                    x: node.x || 0,
                    y: node.y || 0,
                    radius: node.radius || 0,
                };
            }
        });

        const simulation = forceSimulation(nodes)
            .force(
                'collide', 
                forceCollide().radius((d: any) => (d.radius || 0) + 5).strength(1)
            )
            .force('charge', forceManyBody().strength(-300))
            .force('center', forceCenter(width / 2, height / 2)) // Center force for all nodes
            .force(
                'cluster',
                forceCluster<Skill>() // Add the forceCluster here
                    .centers(Object.values(clusterCenters))
                    .strength(2.85) // Increase the strength to keep nodes in their clusters
            )
            .force('x', forceX<Skill>().strength(0.1).x((d: Skill) => clusterCenters[d.cluster].x)) // Horizontal force based on cluster center
            .force('y', forceY<Skill>().strength(0.5).y((d: Skill) => clusterCenters[d.cluster].y)) // Vertical force based on cluster center
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
            .attr('r', (d: Skill) => d.radius || 0) // Add default value
            .attr('fill', (d: Skill) => color(d.cluster.toString()))
            .attr('cx', (d: Skill) => d.x || 0) // Add default value
            .attr('cy', (d: Skill) => d.y || 0) // Add default value
            .call(drag(simulation) as any);

        const labels = svg
            .append('g')
            .selectAll('text')
            .data(nodes)
            .join('text')
            .text((d: Skill) => d.name)
            .attr('x', (d: Skill) => d.x || 0) // Add default value
            .attr('y', (d: Skill) => (d.y || 0) + 5) // Add default value
            .attr('text-anchor', 'middle')
            .attr('class', 'fill-white pointer-events-none')
            .attr('font-size', '.875rem');

        function ticked() {
            circles.attr('cx', (d: Skill) => d.x || 0).attr('cy', (d: Skill) => d.y || 0); // Add default values
            labels.attr('x', (d: Skill) => d.x || 0).attr('y', (d: Skill) => (d.y || 0) + 5); // Add default values
        }

        function drag(simulation: any) {
            function dragstarted(event: any, d: any) {
                isDragging.current = true;
                if (!event.active) simulation.alphaTarget(0.1).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
        
            function dragged(event: any, d: any) {
                const radius = d.radius || 0;
                d.fx = Math.max(radius, Math.min(width - radius, event.x));
                d.fy = Math.max(radius, Math.min(height - radius, event.y));
            }
        
            function dragended(event: any, d: any) {
                isDragging.current = false;
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
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
