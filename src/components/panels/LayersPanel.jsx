import React from "react";
import { useConfig } from "../../store/ConfigContext";
import { Layers, Type, Image as ImageIcon, Trash2 } from "lucide-react";

export default function LayersPanel() {
  const { canvasConfig, activeLayerId, setActiveLayerId, removeLayer } = useConfig();
  const layers = canvasConfig.layers || [];

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h3>
          <Layers size={16} color="#60a5fa" />
          Canvas Layers ({layers.length})
        </h3>
        <p>Manage elements placed on the canopy canvas.</p>
      </div>

      {layers.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", border: "1px dashed var(--border-subtle)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
          <Layers size={32} color="var(--text-dim)" style={{ marginBottom: "8px" }} />
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>No layers on canvas</span>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
            Add an image or text from the tabs above.
          </span>
        </div>
      ) : (
        <div className="layers-list">
          {layers.map((layer) => {
            const isSelected = activeLayerId === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`layer-item-card ${isSelected ? "active" : ""}`}
              >
                <div className="layer-left">
                  <div className="layer-icon-badge">
                    {layer.type === "text" ? <Type size={14} /> : <ImageIcon size={14} />}
                  </div>
                  <div className="layer-info-col">
                    <span className="layer-name">
                      {layer.type === "text" ? `"${layer.content}"` : layer.name || "Image"}
                    </span>
                    <span className="layer-pos">
                      Pos: ({Math.round((layer.x || 0.5) * 100)}%, {Math.round((layer.y || 0.5) * 100)}%)
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                  style={{ padding: "6px", color: "var(--text-muted)" }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
