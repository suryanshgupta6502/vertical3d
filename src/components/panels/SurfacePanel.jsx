import React from "react";
import { useConfig } from "../../store/ConfigContext";
import { COLOR_PRESETS } from "../../config/productData";
import { Palette, Check } from "lucide-react";

export default function SurfacePanel() {
  const { canvasConfig, setBackgroundColor } = useConfig();
  const currentColor = canvasConfig.backgroundColor || "#FFFFFF";

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h3>
          <Palette size={16} color="#60a5fa" />
          Canopy Fabric Color
        </h3>
        <p>Choose background color for the whole tent.</p>
      </div>

      {/* Preset Swatches Grid */}
      <div className="swatch-grid">
        {COLOR_PRESETS.map((color) => {
          const isSelected = currentColor.toLowerCase() === color.hex.toLowerCase();
          return (
            <div
              key={color.hex}
              onClick={() => setBackgroundColor(color.hex)}
              className={`swatch-card ${isSelected ? "active" : ""}`}
            >
              <div className="swatch-bubble" style={{ backgroundColor: color.hex }}>
                {isSelected && (
                  <Check size={14} color={color.dark ? "#ffffff" : "#0f172a"} />
                )}
              </div>
              <span className="swatch-label">{color.name}</span>
            </div>
          );
        })}
      </div>

      {/* Custom Hex Row */}
      <div className="hex-input-row">
        <span className="hex-label">Custom HEX:</span>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          className="native-color-picker"
        />
        <input
          type="text"
          value={currentColor.toUpperCase()}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
              setBackgroundColor(e.target.value);
            }
          }}
          className="hex-text-input"
        />
      </div>
    </div>
  );
}
