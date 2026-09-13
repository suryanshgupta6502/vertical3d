import React from "react";
import { useConfig } from "../../store/ConfigContext";
import { RotateCw, Camera } from "lucide-react";

export default function ViewportToolbar({ onTakeSnapshot }) {
  const { cameraPreset, setCameraPreset, autoRotate, setAutoRotate } = useConfig();

  const presets = [
    { id: "front", label: "Front" },
    { id: "iso", label: "3D Iso" },
    { id: "back", label: "Back" },
    { id: "left", label: "Left" },
    { id: "right", label: "Right" },
    { id: "top", label: "Top" }
  ];

  return (
    <div className="viewport-floating-bar">
      {/* View Presets */}
      <div className="camera-preset-group">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setCameraPreset(p.id)}
            className={`camera-pill-btn ${cameraPreset === p.id ? "active" : ""}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="toolbar-separator" />

      {/* Auto Rotate */}
      <button
        onClick={() => setAutoRotate(!autoRotate)}
        title={autoRotate ? "Pause 360° Rotation" : "Start 360° Rotation"}
        className={`toolbar-icon-btn ${autoRotate ? "active-spin" : ""}`}
      >
        <RotateCw size={15} />
      </button>

      {/* Screenshot */}
      {onTakeSnapshot && (
        <button
          onClick={onTakeSnapshot}
          title="Take 3D Screenshot"
          className="toolbar-icon-btn"
        >
          <Camera size={15} />
        </button>
      )}
    </div>
  );
}
