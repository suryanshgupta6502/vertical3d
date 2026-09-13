import { PRODUCT_INFO, HARDWARE_OPTIONS } from "../config/productData";

/**
 * Calculates itemized pricing based on tent configuration
 * @param {Object} config - { hardware, canvasConfig }
 * @returns {Object} itemized breakdown and total price
 */
export function calculatePricing(config = {}) {
  const breakdown = [];
  let subtotal = PRODUCT_INFO.basePrice;

  breakdown.push({
    title: PRODUCT_INFO.title,
    subtitle: "Base Tent Package (Includes full dye-sublimation print)",
    amount: PRODUCT_INFO.basePrice
  });

  // Frame upgrade
  const frameId = config.hardware?.frameType || "40mm_hex_silver";
  const frameOption = HARDWARE_OPTIONS.frameTypes.find((f) => f.id === frameId);
  if (frameOption && frameOption.price > 0) {
    subtotal += frameOption.price;
    breakdown.push({
      title: "Frame Upgrade: " + frameOption.name,
      subtitle: frameOption.description,
      amount: frameOption.price
    });
  }

  // Wall package
  const wallId = config.hardware?.wallPackage || "none";
  const wallOption = HARDWARE_OPTIONS.walls.find((w) => w.id === wallId);
  if (wallOption && wallOption.price > 0) {
    subtotal += wallOption.price;
    breakdown.push({
      title: "Wall Package: " + wallOption.name,
      subtitle: wallOption.description,
      amount: wallOption.price
    });
  }

  // Accessories
  const selectedAccessories = config.hardware?.accessories || [];
  selectedAccessories.forEach((accId) => {
    const acc = HARDWARE_OPTIONS.accessories.find((a) => a.id === accId);
    if (acc) {
      subtotal += acc.price;
      breakdown.push({
        title: "Accessory: " + acc.name,
        subtitle: acc.description,
        amount: acc.price
      });
    }
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    breakdown
  };
}
