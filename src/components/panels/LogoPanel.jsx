import React, { useRef } from "react";
import { useConfig } from "../../store/ConfigContext";
import { SAMPLE_LOGOS } from "../../config/productData";
import { Upload, Image as ImageIcon, Sparkles, Info } from "lucide-react";

export default function LogoPanel() {
  const { addImageLayer } = useConfig();
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        addImageLayer(img, file.name);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSelectSample = (logo) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      addImageLayer(img, `${logo.name}.svg`);
    };
    img.src = logo.url;
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h3>
          <ImageIcon size={16} color="#60a5fa" />
          Upload Artwork / Image
        </h3>
        <p>Upload artwork to map directly onto the tent.</p>
      </div>

      {/* Upload Dropzone */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png, image/jpeg, image/svg+xml"
        style={{ display: "none" }}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="upload-dropzone"
      >
        <div className="upload-icon-circle">
          <Upload size={22} />
        </div>
        <span className="upload-title">Click or Drop Image File</span>
        <span className="upload-hint">PNG, JPG, or SVG (Maps live to 3D tent)</span>
      </div>

      {/* Preset Badges */}
      <div className="field-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="field-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={14} color="#f59e0b" />
            Quick Test Badges:
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>Instant 1-Click</span>
        </div>

        <div className="preset-logos-grid">
          {SAMPLE_LOGOS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="preset-logo-card"
            >
              <div className="preset-logo-thumb-wrapper">
                <img src={sample.url} alt={sample.name} className="preset-logo-thumb" />
              </div>
              <span className="preset-logo-name">{sample.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", padding: "10px", background: "rgba(20,31,54,0.4)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", fontSize: "11px", color: "var(--text-muted)" }}>
        <Info size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
        <span>Click and drag on the 2D canvas to position or scale. Changes map to the 3D tent in real-time.</span>
      </div>
    </div>
  );
}
