"use client";

export type ProfilePicDevParams = {
  cells: number;
  strength: number;
  radius: number;
  easeMs: number;
  lineOpacity: number;
  showGrid: boolean;
};

type ProfilePicDevControlsProps = {
  values: ProfilePicDevParams;
  onChange: (next: ProfilePicDevParams) => void;
};

export default function ProfilePicDevControls({
  values,
  onChange,
}: ProfilePicDevControlsProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-64 border border-black/30 bg-white/90 p-3 text-black backdrop-blur-sm"
      style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.4 }}
    >
      <div className="mb-2 font-semibold">Profile Warp</div>

      <label className="mb-2 block">
        <div className="mb-1 flex items-center justify-between">
          <span>cells</span>
          <span>{values.cells}</span>
        </div>
        <input
          type="range"
          min={6}
          max={24}
          step={1}
          value={values.cells}
          onChange={(event) =>
            onChange({ ...values, cells: Number(event.currentTarget.value) })
          }
          className="w-full"
        />
      </label>

      <label className="mb-2 block">
        <div className="mb-1 flex items-center justify-between">
          <span>strength</span>
          <span>{values.strength.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.25}
          max={3.5}
          step={0.01}
          value={values.strength}
          onChange={(event) =>
            onChange({ ...values, strength: Number(event.currentTarget.value) })
          }
          className="w-full"
        />
      </label>

      <label className="mb-2 block">
        <div className="mb-1 flex items-center justify-between">
          <span>radius</span>
          <span>{values.radius.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.08}
          max={0.9}
          step={0.01}
          value={values.radius}
          onChange={(event) =>
            onChange({ ...values, radius: Number(event.currentTarget.value) })
          }
          className="w-full"
        />
      </label>

      <label className="mb-2 block">
        <div className="mb-1 flex items-center justify-between">
          <span>easeMs</span>
          <span>{Math.round(values.easeMs)}</span>
        </div>
        <input
          type="range"
          min={24}
          max={220}
          step={1}
          value={values.easeMs}
          onChange={(event) =>
            onChange({ ...values, easeMs: Number(event.currentTarget.value) })
          }
          className="w-full"
        />
      </label>

      <label className="mb-2 block">
        <div className="mb-1 flex items-center justify-between">
          <span>lineOpacity</span>
          <span>{values.lineOpacity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={values.lineOpacity}
          onChange={(event) =>
            onChange({
              ...values,
              lineOpacity: Number(event.currentTarget.value),
            })
          }
          className="w-full"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={values.showGrid}
          onChange={(event) =>
            onChange({ ...values, showGrid: event.currentTarget.checked })
          }
        />
        <span>showGrid</span>
      </label>
    </div>
  );
}
