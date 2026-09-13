// Product configuration, surface definitions, and pricing options

export const PRODUCT_INFO = {
  id: "tent-8x8-pro",
  title: "8x8 Custom Logo Canopy Tent",
  subtitle: "Commercial Grade Dye-Sublimated Pop-Up Event Tent",
  modelUrl: "/Tent_8_8.glb",
  basePrice: 599.0,
  turnaroundDays: "2 Business Days",
  warranty: "Lifetime Frame Warranty",
  specs: {
    dimensions: "8' x 8' Base (96\" x 96\")",
    peakHeight: "10.5' Peak Clearance",
    valanceClearance: "6.5' Head Clearance",
    fabric: "600D Heavy Duty Polyester (Waterproof, UV Protected, Fire Rated B1)",
    standardFrame: "Silver 40mm Hexagonal Commercial Aluminum",
    packageIncludes: "Custom Printed Canopy, Commercial Hex Frame, Wheeled Bag, Stake/Rope Kit"
  }
};

export const COLOR_PRESETS = [
  { name: "Pure White", hex: "#FFFFFF", dark: false },
  { name: "Pitch Black", hex: "#18181B", dark: true },
  { name: "Royal Navy", hex: "#1E3A8A", dark: true },
  { name: "Cobalt Blue", hex: "#2563EB", dark: true },
  { name: "Crimson Red", hex: "#DC2626", dark: true },
  { name: "Forest Green", hex: "#15803D", dark: true },
  { name: "Bright Yellow", hex: "#FACC15", dark: false },
  { name: "Safety Orange", hex: "#EA580C", dark: true },
  { name: "Charcoal Gray", hex: "#4B5563", dark: true },
  { name: "Deep Purple", hex: "#7E22CE", dark: true },
  { name: "Cyan Aqua", hex: "#06B6D4", dark: false }
];

export const FONT_OPTIONS = [
  { name: "Montserrat", family: "'Montserrat', sans-serif" },
  { name: "Inter", family: "'Inter', sans-serif" },
  { name: "Oswald", family: "'Oswald', sans-serif" },
  { name: "Impact", family: "Impact, sans-serif" },
  { name: "Georgia", family: "Georgia, serif" }
];

export const SURFACES = [
  {
    id: "peak_front",
    name: "Front Peak",
    category: "peak",
    width: 600,
    height: 420,
    aspectRatio: "triangle",
    description: "Main front-facing triangular canopy roof section."
  },
  {
    id: "valance_front",
    name: "Front Valance",
    category: "valance",
    width: 800,
    height: 180,
    aspectRatio: "rectangle",
    description: "Horizontal perimeter skirt facing the front entrance."
  },
  {
    id: "peak_back",
    name: "Back Peak",
    category: "peak",
    width: 600,
    height: 420,
    aspectRatio: "triangle",
    description: "Rear triangular canopy roof section."
  },
  {
    id: "valance_back",
    name: "Back Valance",
    category: "valance",
    width: 800,
    height: 180,
    aspectRatio: "rectangle",
    description: "Rear horizontal perimeter skirt."
  },
  {
    id: "peak_left",
    name: "Left Peak",
    category: "peak",
    width: 600,
    height: 420,
    aspectRatio: "triangle",
    description: "Left side triangular canopy roof section."
  },
  {
    id: "valance_left",
    name: "Left Valance",
    category: "valance",
    width: 800,
    height: 180,
    aspectRatio: "rectangle",
    description: "Left side horizontal perimeter skirt."
  },
  {
    id: "peak_right",
    name: "Right Peak",
    category: "peak",
    width: 600,
    height: 420,
    aspectRatio: "triangle",
    description: "Right side triangular canopy roof section."
  },
  {
    id: "valance_right",
    name: "Right Valance",
    category: "valance",
    width: 800,
    height: 180,
    aspectRatio: "rectangle",
    description: "Right side horizontal perimeter skirt."
  },
  {
    id: "wall_back",
    name: "Back Full Wall",
    category: "wall",
    width: 800,
    height: 600,
    aspectRatio: "rectangle",
    description: "Optional full-height rear backdrop wall."
  }
];

export const HARDWARE_OPTIONS = {
  frameTypes: [
    {
      id: "40mm_hex_silver",
      name: "40mm Commercial Hex Aluminum (Silver)",
      price: 0,
      description: "Heavy-duty 40mm hexagonal legs with reinforced nylon composite joints.",
      finish: "#D4D4D8",
      roughness: 0.35,
      metalness: 0.85
    },
    {
      id: "50mm_hex_black",
      name: "50mm Pro Grade Hex Heavy-Duty (Matte Black)",
      price: 149.0,
      description: "Industrial 50mm hex legs, full cast aluminum brackets, maximum wind rating.",
      finish: "#27272A",
      roughness: 0.5,
      metalness: 0.3
    }
  ],
  walls: [
    {
      id: "none",
      name: "No Walls (Open Canopy)",
      price: 0,
      description: "Four open sides for maximum walkthrough traffic."
    },
    {
      id: "full_back",
      name: "Full Back Wall (Single-Sided Print)",
      price: 119.0,
      description: "Full-coverage rear privacy and prominent logo backdrop."
    },
    {
      id: "full_back_double",
      name: "Full Back Wall (Double-Sided Print)",
      price: 179.0,
      description: "Branded on both the inside and outside of the tent."
    }
  ],
  accessories: [
    {
      id: "heavy_duty_roller_bag",
      name: "Heavy-Duty All-Terrain Roller Bag",
      price: 49.0,
      description: "Reinforced 1680D nylon bag with rugged all-terrain wheels."
    },
    {
      id: "sandbag_weights",
      name: "Commercial Sandbag Weight Bags (Set of 4)",
      price: 39.0,
      description: "Holds up to 120 lbs total ballast weight for windy conditions."
    }
  ]
};

export const SAMPLE_LOGOS = [
  { id: "summit", name: "Summit Outdoors", url: "/logos/summit_outdoors.svg" },
  { id: "apex", name: "Apex Motorsports", url: "/logos/apex_racing.svg" },
  { id: "velocity", name: "Velocity Coffee", url: "/logos/velocity_coffee.svg" },
  { id: "mvp", name: "MVP Visuals", url: "/logos/mvp_visuals.svg" }
];
