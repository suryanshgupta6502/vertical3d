import React from "react";
import { useConfig } from "../../store/ConfigContext";
import { Layers, Sparkles, RefreshCw, Palette } from "lucide-react";

export default function SurfaceNav() {
  const { canvasConfig, setBackgroundColor } = useConfig();
  const layerCount = canvasConfig.layers?.length || 0;

  return (
    <div className="surface-navbar">
      <div className="surface-nav-label">
        <Layers size={14} color="#60a5fa" />
        <span>Canvas Mapping:</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
        <span style={{ color: "var(--text-light)", fontWeight: "600" }}>
          Full Canopy Wrap Texture
        </span>
        <span style={{ color: "var(--text-dim)" }}>•</span>
        <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
          1024 × 1024 Square
        </span>
        <span style={{ color: "var(--text-dim)" }}>•</span>
        <span style={{ color: layerCount > 0 ? "#38bdf8" : "var(--text-muted)", fontWeight: "600" }}>
          {layerCount} Artwork Layer{layerCount === 1 ? "" : "s"} Placed
        </span>
      </div>
    </div>
  );
}
