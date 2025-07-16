export type InitMainMessage = {
  type: "INIT";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  isMobile: boolean;
};

export type ResizeMainMessage = {
  type: "RESIZE";
  width: number;
  height: number;
};

export type PointerMainMessage = {
  type: "POINTER_DOWN" | "POINTER_MOVE" | "POINTER_UP";
  x: number;
  y: number;
};

export type ShockMainMessage = {
  type: "SHOCKWAVE";
  x: number;
  y: number;
  strength?: number; 
};

export type ScrollForceMainMessage = {
  type: "SCROLL_FORCE";
  force: number;
  direction?: number;
};

export type SetPausedMainMessage = {
  type: "SET_PAUSED";
  paused: boolean;
};

export type TerminateMainMessage = {
  type: "TERMINATE";
};

export type GetStateMainMessage = {
  type: "GET_STATE";
};

export type MainToWorkerMessage =
  | InitMainMessage
  | ResizeMainMessage
  | PointerMainMessage
  | ShockMainMessage
  | ScrollForceMainMessage
  | SetPausedMainMessage
  | TerminateMainMessage
  | GetStateMainMessage;

export type StateUpdateWorkerMessage = {
  type: "STATE_UPDATE";
  positions: Float32Array;
  angles: Float32Array;
};

export type MetricsWorkerMessage = {
  type: "METRICS";
  simulationTime: number;
  renderTime: number;
  totalTime: number;
  fps: number;
};

export type InitializedWorkerMessage = {
  type: "INITIALIZED";
};

export type WorkerToMainMessage =
  | StateUpdateWorkerMessage
  | MetricsWorkerMessage
  | InitializedWorkerMessage;
