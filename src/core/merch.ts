/**
 * Merchandise System
 *
 * Physical goods that fund the mission.
 * No pay-to-win. Cosmetics and pride only.
 * Every purchase powers development.
 */

// Product categories
export type MerchCategory = 'apparel' | 'patches' | 'accessories' | 'digital';

// Apparel sizes
export type ApparelSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

// Product variant (size, color, etc.)
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;          // In cents (USD)
  size?: ApparelSize;
  color?: string;
  inStock: boolean;
  stockCount?: number;
}

// A merchandise product
export interface MerchProduct {
  id: string;
  name: string;
  description: string;
  category: MerchCategory;

  // Pricing
  basePrice: number;      // In cents
  variants: ProductVariant[];

  // Images
  imageUrls: string[];
  thumbnailUrl: string;

  // Game integration
  unlocksDigitalItem?: string;  // Badge, title, skin, etc.
  requiresAchievement?: string; // Must have achievement to purchase
  limitedEdition: boolean;
  maxPerCustomer?: number;

  // Metadata
  tags: string[];
  releaseDate: string;
  active: boolean;
}

// Order status
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// Shipping address
export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Order line item
export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// A merchandise order
export interface MerchOrder {
  id: string;
  playerId: string;
  playerUsername: string;

  // Items
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;

  // Payment
  paymentMethod: 'stripe' | 'paypal';
  paymentId?: string;
  paidAt?: string;

  // Shipping
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;

  // Status
  status: OrderStatus;

  // Digital unlocks
  digitalItemsGranted: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Initial Product Catalog
// ============================================

export const INITIAL_PRODUCTS: MerchProduct[] = [
  // T-Shirts
  {
    id: 'tshirt-logo-black',
    name: 'SpaceOrBust Logo Tee',
    description: 'Classic black tee with the SpaceOrBust logo. 100% cotton. Built to last.',
    category: 'apparel',
    basePrice: 2500, // $25
    variants: [
      { id: 'tshirt-logo-black-s', name: 'Small', sku: 'SOB-TEE-BLK-S', price: 2500, size: 'S', color: 'Black', inStock: true },
      { id: 'tshirt-logo-black-m', name: 'Medium', sku: 'SOB-TEE-BLK-M', price: 2500, size: 'M', color: 'Black', inStock: true },
      { id: 'tshirt-logo-black-l', name: 'Large', sku: 'SOB-TEE-BLK-L', price: 2500, size: 'L', color: 'Black', inStock: true },
      { id: 'tshirt-logo-black-xl', name: 'XL', sku: 'SOB-TEE-BLK-XL', price: 2500, size: 'XL', color: 'Black', inStock: true },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    unlocksDigitalItem: 'badge-supporter',
    limitedEdition: false,
    tags: ['apparel', 'tshirt', 'logo'],
    releaseDate: '2024-01-01',
    active: true,
  },
  {
    id: 'tshirt-era1-earth',
    name: 'Era 1: Earth-Bound Tee',
    description: 'Commemorative shirt for Era 1. "We started here."',
    category: 'apparel',
    basePrice: 2800,
    variants: [
      { id: 'tshirt-era1-m', name: 'Medium', sku: 'SOB-ERA1-M', price: 2800, size: 'M', color: 'Navy', inStock: true },
      { id: 'tshirt-era1-l', name: 'Large', sku: 'SOB-ERA1-L', price: 2800, size: 'L', color: 'Navy', inStock: true },
      { id: 'tshirt-era1-xl', name: 'XL', sku: 'SOB-ERA1-XL', price: 2800, size: 'XL', color: 'Navy', inStock: true },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    unlocksDigitalItem: 'badge-era1-supporter',
    limitedEdition: false,
    tags: ['apparel', 'tshirt', 'era1'],
    releaseDate: '2024-01-01',
    active: true,
  },

  // Hoodies
  {
    id: 'hoodie-mission-control',
    name: 'Mission Control Hoodie',
    description: 'Heavyweight hoodie. "MISSION CONTROL" on back. Kangaroo pocket.',
    category: 'apparel',
    basePrice: 5500, // $55
    variants: [
      { id: 'hoodie-mc-m', name: 'Medium', sku: 'SOB-HOOD-MC-M', price: 5500, size: 'M', color: 'Charcoal', inStock: true },
      { id: 'hoodie-mc-l', name: 'Large', sku: 'SOB-HOOD-MC-L', price: 5500, size: 'L', color: 'Charcoal', inStock: true },
      { id: 'hoodie-mc-xl', name: 'XL', sku: 'SOB-HOOD-MC-XL', price: 5500, size: 'XL', color: 'Charcoal', inStock: true },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    unlocksDigitalItem: 'title-mission-control',
    limitedEdition: false,
    tags: ['apparel', 'hoodie', 'mission-control'],
    releaseDate: '2024-01-01',
    active: true,
  },

  // Hats
  {
    id: 'hat-logo-black',
    name: 'SpaceOrBust Cap',
    description: 'Structured cap with embroidered logo. Adjustable strap.',
    category: 'accessories',
    basePrice: 2200, // $22
    variants: [
      { id: 'hat-logo-black-os', name: 'One Size', sku: 'SOB-CAP-BLK', price: 2200, color: 'Black', inStock: true },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    limitedEdition: false,
    tags: ['accessories', 'hat', 'cap', 'logo'],
    releaseDate: '2024-01-01',
    active: true,
  },

  // Patches
  {
    id: 'patch-era1-complete',
    name: 'Era 1 Completion Patch',
    description: 'Iron-on patch for completing Era 1. Wear your achievement.',
    category: 'patches',
    basePrice: 1200, // $12
    variants: [
      { id: 'patch-era1-os', name: 'Standard', sku: 'SOB-PATCH-ERA1', price: 1200, inStock: true },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    unlocksDigitalItem: 'badge-era1-patch',
    requiresAchievement: 'lunar_landing', // Must complete lunar landing
    limitedEdition: false,
    tags: ['patches', 'era1', 'achievement'],
    releaseDate: '2024-01-01',
    active: true,
  },
  {
    id: 'patch-first-sync',
    name: 'First Sync Patch',
    description: 'Your first sync. Your first step. Commemorative patch.',
    category: 'patches',
    basePrice: 800, // $8
    variants: [
      { id: 'patch-firstsync-os', name: 'Standard', sku: 'SOB-PATCH-SYNC', price: 800, inStock: true },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    unlocksDigitalItem: 'badge-first-sync-patch',
    limitedEdition: false,
    tags: ['patches', 'beginner', 'sync'],
    releaseDate: '2024-01-01',
    active: true,
  },
  {
    id: 'patch-guild-founder',
    name: 'Guild Founder Patch',
    description: 'For those who lead. Guild founder exclusive.',
    category: 'patches',
    basePrice: 1500,
    variants: [
      { id: 'patch-guildfounder-os', name: 'Standard', sku: 'SOB-PATCH-FOUNDER', price: 1500, inStock: true },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    unlocksDigitalItem: 'badge-guild-founder-patch',
    requiresAchievement: 'guild_founder',
    limitedEdition: false,
    tags: ['patches', 'guild', 'founder'],
    releaseDate: '2024-01-01',
    active: true,
  },

  // Contributor exclusive
  {
    id: 'patch-contributor-2024',
    name: '2024 Contributor Patch',
    description: 'Limited edition for code contributors. PRs merged in 2024.',
    category: 'patches',
    basePrice: 0, // Free for contributors
    variants: [
      { id: 'patch-contrib2024-os', name: 'Standard', sku: 'SOB-PATCH-CONTRIB24', price: 0, inStock: true },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    unlocksDigitalItem: 'badge-contributor-2024',
    requiresAchievement: 'contributor_2024',
    limitedEdition: true,
    tags: ['patches', 'contributor', 'limited', '2024'],
    releaseDate: '2024-01-01',
    active: true,
  },

  // Founder's reserve - genesis edition
  {
    id: 'patch-genesis-0814',
    name: 'Genesis Patch',
    description: 'The beginning of everything. Reserved for founders. Edition of 76.',
    category: 'patches',
    basePrice: 1976, // $19.76
    variants: [
      { id: 'patch-genesis-os', name: 'Standard', sku: 'SOB-GEN-0814-76', price: 1976, inStock: false, stockCount: 76 },
    ],
    imageUrls: [],
    thumbnailUrl: '',
    unlocksDigitalItem: 'badge-genesis',
    requiresAchievement: 'founder',
    limitedEdition: true,
    maxPerCustomer: 1,
    tags: ['patches', 'founder', 'genesis', 'limited'],
    releaseDate: '1976-08-14',  // Origin date
    active: false,  // Not publicly available
  },
];

// ============================================
// Utility Functions
// ============================================

/**
 * Get product by ID
 */
export function getProduct(id: string): MerchProduct | undefined {
  return INITIAL_PRODUCTS.find(p => p.id === id);
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: MerchCategory): MerchProduct[] {
  return INITIAL_PRODUCTS.filter(p => p.category === category && p.active);
}

/**
 * Check if player can purchase (achievement gated)
 */
export function canPurchase(
  product: MerchProduct,
  playerAchievements: string[]
): { canPurchase: boolean; reason?: string } {
  if (!product.active) {
    return { canPurchase: false, reason: 'Product not available' };
  }

  if (product.requiresAchievement) {
    if (!playerAchievements.includes(product.requiresAchievement)) {
      return {
        canPurchase: false,
        reason: `Requires achievement: ${product.requiresAchievement}`,
      };
    }
  }

  return { canPurchase: true };
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(
  items: Array<{ productId: string; variantId: string; quantity: number }>,
  shippingCost: number = 500, // $5 default
  taxRate: number = 0 // 0% default, calculated at checkout
): { subtotal: number; shipping: number; tax: number; total: number } {
  let subtotal = 0;

  for (const item of items) {
    const product = getProduct(item.productId);
    if (!product) continue;

    const variant = product.variants.find(v => v.id === item.variantId);
    if (!variant) continue;

    subtotal += variant.price * item.quantity;
  }

  const tax = Math.floor(subtotal * taxRate);
  const total = subtotal + shippingCost + tax;

  return { subtotal, shipping: shippingCost, tax, total };
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
