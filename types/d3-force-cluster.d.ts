declare module 'd3-force-cluster' {
    import { Force, SimulationNodeDatum } from 'd3-force';
  
    interface ClusterForce<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum, undefined> {
      centers(centers: {x: number, y: number, radius: number}[]): this;
      strength(strength: number): this;
    }
  
    export function forceCluster<NodeDatum extends SimulationNodeDatum>(): ClusterForce<NodeDatum>;
  }