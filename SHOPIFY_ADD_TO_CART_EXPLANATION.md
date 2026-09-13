# 🛒 How the 3D Configurator Adds to Shopify Cart (Option 1 Guide)

This document explains the step-by-step mechanism of how clicking **"Add to Cart"** inside the embedded Vercel 3D Configurator (`https://vertical3d.vercel.app/`) automatically adds the customized canopy tent with all custom print files into your **Shopify Horizon Theme** store.

---

## 🗺️ High-Level Architecture & Flow Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│  1. INSIDE VERCEL (https://vertical3d.vercel.app)           │
│                                                             │
│  Customer clicks [Add to Cart]                              │
│   ├── Generates 1024x1024 high-res texture PNG              │
│   ├── Takes 3D perspective snapshot JPG                     │
│   └── Sends message: window.parent.postMessage(payload)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │  (Cross-Window Message Bridge)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  2. INSIDE SHOPIFY HORIZON THEME (Your Store)               │
│                                                             │
│  window.addEventListener("message", ...) catches payload    │
│   ├── Converts base64 data into binary file Blobs           │
│   ├── Grabs your Shopify Product Variant ID via Liquid      │
│   └── Packs everything into standard FormData:              │
│       • id: Variant ID                                      │
│       • properties[Design ID]                               │
│       • properties[Base Color]                              │
│       • properties[Print Layout Texture] (File)             │
│       • properties[3D Isometric Preview] (File)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │  POST /cart/add.js
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  3. SHOPIFY NATIVE CART & ADMIN                             │
│                                                             │
│  Shopify Cart API receives the files and:                   │
│   ├── Uploads customer files to Shopify's secure CDN        │
│   ├── Adds the customized tent to the customer's cart       │
│   ├── Opens the Horizon Cart Drawer (or goes to /cart)      │
│   └── Merchant sees download links in Shopify Admin Orders! │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Step-by-Step Technical Breakdown

### Step 1: What Happens in your React Configurator (on Vercel)
When the customer customizes the tent and clicks the **Add to Cart** button in the header bar, `src/App.jsx` executes:

```javascript
// 1. Captures the high-res 1024x1024 print texture canvas
const uvLayout = masterCanvasRef.current.toDataURL("image/png");

// 2. Captures the 3D perspective snapshot from Three.js WebGL
const preview3d = tentViewerRef.current.captureSnapshot("iso");

// 3. Packages the custom design details
const payload = {
  type: "CONFIGURATOR_ADD_TO_CART",
  designId: designId,
  pricing: pricing,
  color: canvasConfig.backgroundColor,
  textureData: uvLayout,
  snapshotData: preview3d
};

// 4. Sends the data to the parent Shopify window outside the iframe
if (window.parent && window.parent !== window) {
  window.parent.postMessage(payload, "*");
}
```

> **Why `postMessage`?**  
> Since Vercel (`vertical3d.vercel.app`) and Shopify (`yourstore.myshopify.com`) are on different domains, browser security (CORS) prevents them from touching each other directly. `postMessage` is the official, secure HTML5 standard for an iframe to send structured messages to its parent webpage.

---

### Step 2: What Happens in your Shopify Horizon Theme (`liquid_code.html`)
The script embedded inside your Shopify Horizon theme listens for the message event:

```javascript
window.addEventListener("message", async function (event) {
  // Checks that the message is from your configurator
  if (!event.data || event.data.type !== "CONFIGURATOR_ADD_TO_CART") return;
  const data = event.data;
```

Once it catches the payload, it performs three operations:

1. **Converts Base64 strings into real binary file Blobs**:
   ```javascript
   const textureBlob = await (await fetch(data.textureData)).blob();
   const snapshotBlob = await (await fetch(data.snapshotData)).blob();
   ```
2. **Injects your store's Product Variant ID using Liquid**:
   ```javascript
   formData.append("id", {{ product.selected_or_first_available_variant.id }});
   formData.append("quantity", 1);
   ```
   Shopify Liquid automatically fills in the exact numeric variant ID of the canopy tent product from your store (e.g., `4829104928172`).
3. **Attaches Custom Files as Line Item Properties**:
   ```javascript
   formData.append("properties[Design ID]", data.designId);
   formData.append("properties[Base Color]", data.color);
   formData.append("properties[Print Layout Texture]", textureBlob, `print_layout_${data.designId}.png`);
   formData.append("properties[3D Isometric Preview]", snapshotBlob, `preview_3d_${data.designId}.jpg`);
   ```

---

### Step 3: Adding Directly into Shopify's Cart
The script then sends this `formData` to Shopify's built-in AJAX endpoint:

```javascript
const res = await fetch(window.Shopify.routes.root + "cart/add.js", {
  method: "POST",
  body: formData
});
const cartItem = await res.json();
```

- **Every Shopify store has `/cart/add.js` built in.** No third-party apps or server backends are required.
- When `/cart/add.js` receives files in `properties[...]`, Shopify automatically uploads them to Shopify's cloud CDN and attaches them to that specific line item.

---

### Step 4: Refreshing Horizon's Cart Drawer
Once the item is added:

```javascript
if (document.querySelector('cart-drawer')) {
  // Horizon / Dawn OS 2.0 cart-drawer trigger
  document.querySelector('cart-drawer').renderContents?.();
  document.querySelector('cart-drawer').open?.();
} else {
  // Fallback: redirect directly to cart
  window.location.href = window.Shopify.routes.root + "cart";
}
```

Horizon's slide-out cart drawer smoothly opens up, displaying the customized tent.

---

## 📦 What You (The Merchant) See in Shopify Admin

When the customer checks out and places their order:
1. Go to **Shopify Admin** → **Orders** → Open the customer's order.
2. Under the Tent product line item, you will see:
   - **Design ID**: `TENT-8X8-MTZWOD2F`
   - **Base Color**: `#FFFFFF`
   - **Print Layout Texture**: Clickable link to download the high-resolution PNG file.
   - **3D Isometric Preview**: Clickable link to download the 3D snapshot JPG file.
3. Your printing team simply clicks **Print Layout Texture** to download the customer's exact print file and send it straight to the dye-sublimation printer!
