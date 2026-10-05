# Yaazhi Feature Inventory & Architecture Specification

> **Source of Truth**: Derived from deep inspection of `Invenaro` (`local_boutique` branch) and `BillFlow` (`vjay-12/billflow`), synthesized according to `Yaazhi_Implementation_Plan.md`.

---

## 1. Executive Summary & Design Synthesis

**Yaazhi** is a purpose-built inventory management and point-of-sale platform tailored exclusively for boutique retail businesses (saree emporiums, bespoke tailoring houses, designer apparel studios, and ethnic wear boutiques).

### Architectural Philosophy
- **Functionality Source (Invenaro `local_boutique`)**: Robust domain entities, multi-location stock tracking, GST tax compliance, bespoke tailoring measurement profiles, vendor management, and purchase order lifecycles.
- **UX Source (BillFlow)**: Minimalist operational speed, single-click additions, clear cart hierarchy, quick payment modal, tactile quantity adjustments, and zero unnecessary friction.
- **Yaazhi Identity**: Warm editorial boutique aesthetic. Replaces generic dark/neon SaaS cards with warm cream/ivory canvases (`#FDFBF7`), heritage silk crimson (`#8B263E`), antique brass gold accents (`#C59B4E`), bespoke serif headlines, and high-readability sans-serif numerical/tabular displays.

---

## 2. Invenaro `local_boutique` Functional Analysis

### 2.1 Core Navigation & Modules Discovered
1. **Overview / Dashboard**: Operational snapshot (today's revenue, active bills, low stock alerts, pending orders, recent movements).
2. **Product Catalog (`/products`)**:
   - Fields: Name, SKU, Barcode, Category, UOM (pcs, box, kg, meters), Cost Price, Selling Price, HSN Code, GST Rate (0%, 5%, 18%, 40%), Reorder Point, Max Stock, Variant Attributes (Fabric, Weave, Color, Size, Border Type).
   - Capabilities: Quick search, category filters, stock status badges, barcode label generation modal, Excel import/export.
3. **Inventory & Movements (`/inventory`, `/adjustments`, `/transfers`)**:
   - Stock balances by warehouse/counter.
   - Adjustments with mandatory reason codes: `audit`, `damage`, `loss`, `miscount`, `return`.
   - Transfers between locations/counters with tracking status.
4. **Boutique Bespoke Measurements (`/customers/:id/measurements`)**:
   - Profile templates (e.g., Blouse, Chudidar/Salwar, Lehenga, Silk Shirt).
   - Versioned customer measurement cards (retains historic fittings without losing past alterations).
   - Unit toggle (inches `in` / centimeters `cm`).
5. **Purchasing & Vendors (`/purchases`, `/vendors`)**:
   - Vendor directory (GSTIN, contact, phone, address, payment terms).
   - Purchase Order lifecycle: `draft` → `pending` → `received` → `cancelled`.
   - Direct stock receiving workflow with automated inventory ledger update.
6. **Billing & POS (`/billing`)**:
   - Fast counter sales.
   - Barcode scanning / rapid search.
   - Multi-item cart with discount overrides and tax breakdown.
   - Payment modes: Cash, UPI, Card, Credit / Store Credit.
   - Immediate receipt & GST invoice issuance.
7. **Sales Orders (`/sales/orders`)**:
   - Structured orders with fulfillment status: `draft` → `dispatched` → `invoiced` → `paid` / `void`.
8. **Reports & Ledger (`/reports`, `/ledger`)**:
   - Inventory valuation, dead stock, best-selling saree/apparel categories, GST tax summary (CGST/SGST/IGST).
9. **Settings & Boutique Profile (`/settings`)**:
   - Boutique legal name, GSTIN, PAN, registered address, invoice prefixes, counter/store settings.

---

## 3. BillFlow UX Analysis & Key Lessons

1. **Lightning Fast Counter Billing**:
   - Product list with visual category pills and stock availability indicators.
   - Cart is always visible on desktop/tablet side, and docked as a sticky drawer on mobile.
   - Numerical quantity controls (`+` / `-` / direct input) with instantaneous line recalculation.
2. **Low-Friction Payment Dialog**:
   - Big quick-cash denomination buttons (e.g., Exact, +₹100, +₹500, +₹2000).
   - UPI QR display with instant confirmation button.
   - Zero multi-step wizard delays—one modal to finalize and print.
3. **Keyboard Shortcuts**:
   - `/` or `F2` to focus product search.
   - `F4` to clear cart.
   - `Space` or `Enter` on payment to complete.
4. **Thermal / Paper Receipt Preview**:
   - Clean 58mm / 80mm format or A4/A5 GST invoice.
   - Immediate WhatsApp share link generation and print trigger.

---

## 4. Yaazhi Design System & Brand Identity

### 4.1 Brand Meaning
*Yaazhi* (யாழி) is the mythical guardian creature from Dravidian temple architecture and silk weaving heritage—signifying majesty, strength, timeless elegance, and precision craftsmanship.

### 4.2 Color System Tokens
```css
:root {
  /* Canvas & Surfaces */
  --yz-bg-canvas: #F9F6F0;           /* Warm Sand / Ivory Cream */
  --yz-bg-surface: #FFFFFF;          /* Pure White Card Surface */
  --yz-bg-subtle: #F3EFEA;           /* Soft Linen Neutral */
  --yz-bg-sidebar: #1E1716;          /* Deep Espresso Noir */
  --yz-bg-sidebar-hover: #2D2322;
  --yz-bg-sidebar-active: #3C2E2D;

  /* Brand Accents */
  --yz-primary: #8B263E;             /* Heritage Silk Crimson */
  --yz-primary-hover: #751F33;
  --yz-primary-active: #5E1828;
  --yz-primary-subtle: #FDF2F4;
  --yz-gold: #C59B4E;                /* Antique Temple Brass */
  --yz-gold-hover: #B0883E;
  --yz-gold-subtle: #FAF6ED;

  /* Typography */
  --yz-text-primary: #1C1917;        /* Rich Black Warm */
  --yz-text-secondary: #57534E;      /* Warm Slate / Stone */
  --yz-text-muted: #8F8880;          /* Sand Stone */
  --yz-text-inverse: #F9F6F0;

  /* Operational Status Colors */
  --yz-status-in-stock: #15803D;
  --yz-status-in-stock-bg: #DCFCE7;
  --yz-status-low-stock: #B45309;
  --yz-status-low-stock-bg: #FEF3C7;
  --yz-status-out-stock: #B91C1C;
  --yz-status-out-stock-bg: #FEE2E2;

  /* Borders & Shadows */
  --yz-border: #E6E0D6;
  --yz-border-focus: #8B263E;
  --yz-shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.05);
  --yz-shadow-md: 0 4px 6px -1px rgba(28, 25, 23, 0.07);
}
```

### 4.3 Typography
- **Display / Brand / Headers**: `Outfit`, `Cinzel`, or `Playfair Display` (Warm, stately, artisanal).
- **Body / Interface**: `Plus Jakarta Sans` or `DM Sans` (Exceptional legibility at small sizes, friendly and clear).
- **Numbers / Prices / SKUs**: `JetBrains Mono` or tabular `Plus Jakarta Sans` figures (`font-variant-numeric: tabular-nums`).

---

## 5. Domain Models & Schema Specification

```typescript
export type BoutiqueCategory = 
  | 'Kanchipuram Silk'
  | 'Cotton Handloom'
  | 'Banarasi Silk'
  | 'Designer Chudidar'
  | 'Anarkali Set'
  | 'Kurtis & Tunics'
  | 'Designer Blouse'
  | 'Ethnic Menswear'
  | 'Kids Ethnic'
  | 'Dupattas & Shawls'
  | 'Fabrics & Unstitched'
  | 'Accessories';

export interface ProductVariant {
  id: string;
  sku: string;
  color: string;
  size?: string;
  fabric?: string;
  additionalPrice: number;
  stock: number;
  barcode: string;
}

export interface YaazhiProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: BoutiqueCategory;
  fabric?: string;
  craft?: string; // e.g. Handloom, Zari, Embroidered, Kalamkari
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  reorderPoint: number;
  maxStock?: number;
  unitOfMeasure: 'pcs' | 'meters' | 'sets';
  hsnCode: string;
  gstRate: number; // 0, 5, 12, 18
  locationStock: Record<string, number>;
  variants: ProductVariant[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Implementation Phases Roadmap

1. **Phase 1: Project Architecture & Setup** (Current)
   - Vite + React 19 + TypeScript + modern CSS tokens.
   - Clean modular directory layout (`components`, `features`, `services`, `types`, `mocks`, `styles`).
2. **Phase 2: Design System & Shell**
   - Brand logo & wordmark, header with quick search & boutique status, responsive collapsible sidebar.
   - Toast system, modals, badge components, tabular data tables, empty & error states.
3. **Phase 3: Mock Data & Service Layer**
   - Centralized repository pattern with local persistence (`localStorage` sync) ensuring realistic Indian boutique mock data.
4. **Phase 4: Product Management Foundation**
   - Product list with filtering, searching, stock indicators, and SKU detail views.
   - Product creation & edit forms with pricing, GST slabs, and boutique variant attributes.
5. **Phase 5: Inventory & Stock Movements**
   - Live stock valuation, low-stock alerts, stock adjustments with reason codes, and audit movement logs.
6. **Phase 6: Billing & POS Experience (Next Phase)**
   - High-speed product search, cart with instant taxes/discounts, quick payment modal, thermal/PDF receipt.
