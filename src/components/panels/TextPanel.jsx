import React, { useState } from "react";
import { useConfig } from "../../store/ConfigContext";
import { FONT_OPTIONS } from "../../config/productData";
import { Type, Plus } from "lucide-react";

export default function TextPanel() {
  const { canvasConfig, activeLayerId, addTextLayer, updateLayer } = useConfig();
  const activeLayer = canvasConfig.layers.find((l) => l.id === activeLayerId && l.type === "text");

  const [textContent, setTextContent] = useState("BRAND NAME");
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].family);
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState("#FFFFFF");

  const handleAddOrUpdate = () => {
    if (activeLayer) {
      updateLayer(activeLayer.id, {
        content: textContent,
        fontFamily,
        fontSize,
        color: textColor
      });
    } else {
      addTextLayer(textContent);
    }
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h3>
          <Type size={16} color="#60a5fa" />
          Add Text to Canopy
        </h3>
        <p>Type custom text to place anywhere on the tent.</p>
      </div>

      {/* Text Input */}
      <div className="field-group">
        <label className="field-label">Text Content:</label>
        <input
          type="text"
          value={activeLayer ? activeLayer.content : textContent}
          onChange={(e) => {
            if (activeLayer) {
              updateLayer(activeLayer.id, { content: e.target.value });
            } else {
              setTextContent(e.target.value);
            }
          }}
          placeholder="e.g. SUMMIT OUTDOORS"
          className="text-input-field"
        />
      </div>

      {/* Font Family Selector */}
      <div className="field-group">
        <label className="field-label">Typography Font:</label>
        <div className="font-grid">
          {FONT_OPTIONS.map((f) => (
            <div
              key={f.name}
              onClick={() => {
                setFontFamily(f.family);
                if (activeLayer) updateLayer(activeLayer.id, { fontFamily: f.family });
              }}
              style={{ fontFamily: f.family }}
              className={`font-card ${(activeLayer ? activeLayer.fontFamily === f.family : fontFamily === f.family) ? "active" : ""}`}
            >
              {f.name}
            </div>
          ))}
        </div>
      </div>

      {/* Font Size Slider */}
      <div className="field-group">
        <div className="slider-row">
          <span className="field-label">Font Size:</span>
          <span className="slider-val">
            {activeLayer ? activeLayer.fontSize : fontSize}px
          </span>
        </div>
        <input
          type="range"
          min="20"
          max="80"
          value={activeLayer ? activeLayer.fontSize || 48 : fontSize}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setFontSize(val);
            if (activeLayer) updateLayer(activeLayer.id, { fontSize: val });
          }}
          className="range-slider"
        />
      </div>

      {/* Text Color Picker */}
      <div className="field-group">
        <label className="field-label">Text Color:</label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {["#FFFFFF", "#000000", "#DC2626", "#2563EB", "#FACC15", "#15803D"].map((c) => (
            <div
              key={c}
              onClick={() => {
                setTextColor(c);
                if (activeLayer) updateLayer(activeLayer.id, { color: c });
              }}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: c,
                border: "1px solid rgba(255,255,255,0.3)",
                cursor: "pointer",
                boxShadow: "var(--shadow-sm)"
              }}
            />
          ))}
          <input
            type="color"
            value={activeLayer ? activeLayer.color || "#FFFFFF" : textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              if (activeLayer) updateLayer(activeLayer.id, { color: e.target.value });
            }}
            className="native-color-picker"
          />
        </div>
      </div>

      {/* Add / Apply Button */}
      <button onClick={handleAddOrUpdate} className="btn-panel-action">
        <Plus size={16} />
        <span>{activeLayer ? "Update Selected Text" : "Add Text to Canvas"}</span>
      </button>
    </div>
  );
}
