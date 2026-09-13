import { jsPDF } from "jspdf";
import { PRODUCT_INFO } from "../config/productData";

/**
 * Generates a multi-page commercial production job ticket / specsheet PDF
 * @param {Object} config - { designId, canvasConfig }
 * @param {Object} pricing - Pricing breakdown
 * @param {Object} snapshots - { preview3d, uvLayout }
 */
export async function generateProductionPDF(config, pricing = {}, snapshots = {}) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const designId = config.designId || `TENT-8X8-${Date.now().toString(36).toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // -----------------------------------------------------------
    // PAGE 1: Job Summary & 3D Render
    // -----------------------------------------------------------
    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("CANOPY TENT PRODUCTION SPECSHEET", 14, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Reference ID: ${designId}   |   Date: ${dateStr}`, 14, 19);

    // Status Badge
    doc.setFillColor(34, 197, 94); // green-500
    doc.roundedRect(pageWidth - 48, 6, 34, 13, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("READY FOR PRINT", pageWidth - 46, 14);

    let currentY = 32;

    // 3D Visual Rendering Snapshot (Left Column)
    if (
      snapshots.preview3d &&
      typeof snapshots.preview3d === "string" &&
      snapshots.preview3d.startsWith("data:image")
    ) {
      try {
        const imgType = snapshots.preview3d.includes("png") ? "PNG" : "JPEG";
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, currentY, 110, 80, 2, 2, "F");
        doc.addImage(snapshots.preview3d, imgType, 16, currentY + 2, 106, 76);
      } catch (err) {
        console.warn("Could not embed 3D snapshot image:", err);
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, currentY, 110, 80, 2, 2, "F");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("3D Perspective Render Snapshot", 35, currentY + 40);
      }
    } else {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, currentY, 110, 80, 2, 2, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("3D Perspective Render Snapshot", 35, currentY + 40);
    }

    // Specifications Box (Right Column)
    const specX = 130;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(specX, currentY, 66, 80, 2, 2, "F");

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("TECHNICAL SPECS", specX + 6, currentY + 10);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("PRODUCT MODEL:", specX + 6, currentY + 20);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.text(PRODUCT_INFO.title, specX + 6, currentY + 25);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("FABRIC & PRINT METHOD:", specX + 6, currentY + 34);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.text("600D Poly / Dye-Sublimation", specX + 6, currentY + 39);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("FRAME HARDWARE:", specX + 6, currentY + 48);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.text("Commercial Hex Aluminum", specX + 6, currentY + 53);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("DIMENSIONS:", specX + 6, currentY + 62);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.text("8ft x 8ft x 11.2ft Peak", specX + 6, currentY + 67);

    currentY += 88;

    // Color Specifications
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("CANOPY FABRIC BASE COLOR", 14, currentY);
    currentY += 6;

    const bgColor = config.canvasConfig?.backgroundColor || "#FFFFFF";
    doc.setFillColor(bgColor);
    doc.rect(14, currentY, 12, 12, "F");
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, currentY, 12, 12, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Master Fabric Color", 30, currentY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`HEX CODE: ${bgColor.toUpperCase()}`, 30, currentY + 10);

    currentY += 20;

    // Pricing Summary Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("ITEMIZED PRICING SUMMARY", 14, currentY);
    currentY += 6;

    doc.setFillColor(248, 250, 252);
    doc.rect(14, currentY, pageWidth - 28, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("ITEM DESCRIPTION", 18, currentY + 5);
    doc.text("TOTAL (USD)", pageWidth - 42, currentY + 5);
    currentY += 7;

    const breakdownList = pricing?.breakdown || [
      { title: PRODUCT_INFO.title, amount: pricing.subtotal || PRODUCT_INFO.basePrice }
    ];

    breakdownList.forEach((item) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(item.title, 18, currentY + 5);
      doc.text(`$${Number(item.amount).toFixed(2)}`, pageWidth - 40, currentY + 5);
      currentY += 6;
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
    currentY += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("ORDER TOTAL (ESTIMATE):", pageWidth - 90, currentY);
    doc.setTextColor(37, 99, 235);
    doc.text(`$${Number(pricing?.subtotal || PRODUCT_INFO.basePrice).toFixed(2)}`, pageWidth - 36, currentY);

    // Footer Page 1
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Page 1 of 2  •  MVP Visuals Custom Product Configurator", 14, pageHeight - 8);

    // -----------------------------------------------------------
    // PAGE 2: 2D Full Tent Canvas & Print Layout
    // -----------------------------------------------------------
    doc.addPage();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("2D PRODUCTION CANOPY PRINT LAYOUT", 14, 13);

    let p2Y = 28;

    if (
      snapshots.uvLayout &&
      typeof snapshots.uvLayout === "string" &&
      snapshots.uvLayout.startsWith("data:image")
    ) {
      try {
        const imgType = snapshots.uvLayout.includes("jpeg") || snapshots.uvLayout.includes("jpg") ? "JPEG" : "PNG";
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, p2Y, 182, 130, 2, 2, "F");
        doc.addImage(snapshots.uvLayout, imgType, 40, p2Y + 2, 130, 126);
      } catch (err) {
        console.warn("Could not embed canvas snapshot:", err);
      }
    }

    p2Y += 138;

    // Applied Graphics Inventory
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("APPLIED GRAPHICS & CUSTOM TEXT INVENTORY", 14, p2Y);
    p2Y += 6;

    const layers = config.canvasConfig?.layers || [];
    layers.forEach((l) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const desc =
        l.type === "text"
          ? `Text: "${l.content}" (${l.fontFamily || "Montserrat"})`
          : `Artwork/Logo: ${l.name || l.id} (Scale: ${Math.round((l.scale || 1) * 100)}%)`;
      doc.text(`• ${desc}`, 18, p2Y);
      p2Y += 5;
    });

    if (layers.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Solid color canopy. No additional artwork layers placed.", 18, p2Y);
      p2Y += 6;
    }

    p2Y = Math.max(p2Y + 8, 225);

    // Production Sign-Off Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, p2Y, 182, 40, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("MANUFACTURING & QUALITY ASSURANCE SIGN-OFF", 18, p2Y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Pre-Press Operator: _______________________   Date: _______________", 18, p2Y + 18);
    doc.text("Print Quality Control: _______________________   Status: [  ] PASSED  [  ] REWORK", 18, p2Y + 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page 2 of 2  •  Order Attachment Ref: ${designId}`, 14, pageHeight - 8);

    // Direct, uncorrupted browser download via jsPDF's native save method
    const fileName = `Canopy_Specsheet_${designId}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert(`Could not generate PDF: ${err.message}`);
    return { success: false, error: err };
  }
}
