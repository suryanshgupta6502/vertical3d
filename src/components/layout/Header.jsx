import React, { useState } from "react";
import { useConfig } from "../../store/ConfigContext";
import { PRODUCT_INFO } from "../../config/productData";
import { FileDown, Columns, Box, LayoutGrid, ChevronDown, ShoppingCart } from "lucide-react";

export default function Header({
  onExportPdf,
  isGeneratingPdf,
  pdfSuccessMessage,
  onAddToCart,
  cartSuccessMessage
}) {
  const { viewMode, setViewMode, pricing, designId } = useConfig();
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  return (
    <header className="header-bar">
      {/* Brand & Product Info */}
      <div className="brand-section">
        <div className="brand-logo-badge">▲</div>
        <span className="design-id-pill">{designId}</span>
      </div>

      {/* View Mode Switcher (Split, 3D Only, 2D Canvas) */}
      <div className="view-switcher-pill">
        <button
          onClick={() => setViewMode("split")}
          className={`view-btn ${viewMode === "split" ? "active" : ""}`}
        >
          <Columns size={14} />
          <span>Split View</span>
        </button>

        <button
          onClick={() => setViewMode("3d")}
          className={`view-btn ${viewMode === "3d" ? "active" : ""}`}
        >
          <Box size={14} />
          <span>3D Only</span>
        </button>

        <button
          onClick={() => setViewMode("2d")}
          className={`view-btn ${viewMode === "2d" ? "active" : ""}`}
        >
          <LayoutGrid size={14} />
          <span>2D Canvas</span>
        </button>
      </div>

      {/* Right Controls: Price & Spec PDF */}
      <div className="header-actions">
        {/* Dynamic Price Display */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowPriceDetails(!showPriceDetails)}
            className="price-trigger"
          >
            <div className="price-text-col">
              <span className="price-label">Live Total</span>
              <span className="price-val">${pricing.subtotal.toFixed(2)}</span>
            </div>
            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {/* Pricing Breakdown Dropdown */}
          {showPriceDetails && (
            <div className="price-dropdown-menu">
              <div className="dropdown-header">
                <span>Itemized Pricing Breakdown</span>
                <span className="dropdown-sync-tag">Live Dynamic</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {pricing.breakdown.map((item, i) => (
                  <div key={i} className="breakdown-row">
                    <div className="breakdown-row-left">
                      <span className="breakdown-title">{item.title}</span>
                      <span className="breakdown-desc">{item.subtitle}</span>
                    </div>
                    <span className="breakdown-amt">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="dropdown-total-row">
                <span>Subtotal:</span>
                <span className="dropdown-total-val">${pricing.subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Export Spec PDF Button */}
        <button
          onClick={onExportPdf}
          disabled={isGeneratingPdf}
          className="btn-spec-pdf"
          style={{
            borderColor: pdfSuccessMessage ? "#10b981" : undefined,
            color: pdfSuccessMessage ? "#34d399" : undefined,
            minWidth: "105px",
            justifyContent: "center"
          }}
        >
          {isGeneratingPdf ? (
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
          ) : pdfSuccessMessage ? (
            <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
          ) : (
            <FileDown size={15} color="#f59e0b" />
          )}
          <span>
            {isGeneratingPdf
              ? "Building..."
              : pdfSuccessMessage
              ? "Downloaded!"
              : "Spec PDF"}
          </span>
        </button>

        {/* Add to Cart Button for Shopify Embed / Standalone */}
        {onAddToCart && (
          <button
            onClick={onAddToCart}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 15px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: "700",
              cursor: "pointer",
              background: cartSuccessMessage
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
              transition: "all 0.2s ease",
              userSelect: "none"
            }}
          >
            <ShoppingCart size={14} />
            <span>{cartSuccessMessage ? "✓ Added to Cart!" : `Add to Cart • $${pricing.subtotal.toFixed(2)}`}</span>
          </button>
        )}
      </div>
    </header>
  );
}
