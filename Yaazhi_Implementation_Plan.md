# Yaazhi

## Boutique Inventory Management & Billing Platform

> Production implementation plan for building Yaazhi as a frontend-first boutique inventory management and billing product.

---

# 1. Product Overview

## Product Name

**Yaazhi**

## Product Type

Boutique-focused:

- Inventory Management
- Product Management
- Purchase Management
- Sales Management
- Billing / POS
- Customer Management
- Vendor Management
- Stock Tracking
- Inventory Movement
- Reports
- Team & Role Management

## Current Scope

This phase is **frontend-first**.

The backend, database, authentication APIs, external integrations, and server-side business logic should not be implemented yet.

The frontend should nevertheless be structured as if it will eventually connect to a production backend.

That means:

- No hardcoded UI-only architecture that blocks API integration later.
- Use clear domain models/types.
- Keep API/service boundaries separate from UI.
- Use realistic mock data only through a centralized data layer.
- Keep business rules isolated from presentation components.
- Do not couple pages directly to mock objects.

---

# 2. Source Repositories

## Functional Source

Use:

`https://github.com/vjay-12/Invenaro/tree/local_boutique`

This branch is the primary source for:

- Existing features
- Business flows
- Inventory concepts
- Boutique-specific functionality
- Existing data structures
- Existing navigation
- Existing forms
- Existing states
- Existing business terminology

Do not blindly copy the UI.

Inspect the branch first and extract the actual product requirements.

---

## UI/UX Reference

Use:

`https://github.com/vjay-12/BillFlow`

BillFlow should primarily influence:

- Billing workflow
- POS interaction
- Product selection
- Cart behavior
- Quantity controls
- Search
- Checkout flow
- Information hierarchy
- Minimal UI philosophy
- Button placement
- Form simplicity
- Spacing
- Table/list interaction
- Responsive behavior

Do not clone BillFlow.

The goal is:

> BillFlow's simplicity + Invenaro's boutique functionality + Yaazhi's own visual identity.

---

# 3. Repository Strategy

Create a completely new repository:

`Yaazhi`

Do not modify the existing Invenaro repository.

Do not modify BillFlow.

Recommended repository:

```text
Yaazhi
```

Recommended initial branch:

```text
main
```

Development branch:

```text
development
```

Feature branches can later follow:

```text
feature/inventory
feature/billing
feature/products
feature/customers
feature/purchases
feature/reports
```

---

# 4. First Step: Repository Inspection

Before writing new UI code, inspect both source repositories thoroughly.

## Invenaro Inspection

Inspect:

```text
local_boutique branch
```

Identify:

### Navigation

Document:

- Sidebar items
- Sub-navigation
- Page hierarchy
- User/account controls
- Settings
- Reports

### Modules

Create an inventory of every existing module.

For each module document:

```text
Module
Purpose
Pages
Primary actions
Secondary actions
Forms
Tables
Filters
Statuses
Empty states
Validation
Dependencies
```

### Business Entities

Identify entities such as:

```text
Product
SKU
Category
Variant
Size
Color
Customer
Vendor
Purchase
Purchase Order
Sales Order
Bill
Invoice
Payment
Stock
Warehouse
Stock Movement
Team
Role
User
Notification
```

Do not assume every entity exists.

Only include entities actually relevant to the source product.

---

# 5. BillFlow Inspection

Inspect BillFlow specifically for:

## Billing

Document:

- Product search
- Product selection
- Cart
- Quantity adjustment
- Remove item
- Price calculation
- Discount
- Tax
- Subtotal
- Total
- Customer selection
- Payment method
- Payment state
- Invoice generation
- Success state

## UX Patterns

Study:

- How many clicks are required
- How information is grouped
- Which controls are primary
- Which controls are secondary
- How lists behave
- How search behaves
- How forms behave
- How errors are displayed
- How responsive layouts work

The goal is to preserve the **low-friction feeling**, not the exact visual design.

---

# 6. Product Design Direction

Yaazhi should feel like a product designed specifically for boutique owners.

It should not look like:

- Generic SaaS admin
- AI dashboard
- Enterprise ERP
- Developer dashboard
- Finance software
- Template marketplace

The visual language should communicate:

- Practical
- Elegant
- Warm
- Professional
- Retail-focused
- Fast
- Organized
- Premium but not luxury-fashion cliché

---

# 7. Visual Identity

## Design Principle

Use:

> Editorial retail interface + operational simplicity.

Avoid:

- Excessive gradients
- Glassmorphism
- Neon
- Purple/black AI aesthetic
- Decorative blobs
- Floating orbs
- Excessive rounded cards
- Excessive shadows
- Pastel-heavy UI
- Rainbow accents
- Sparkle icons
- AI-generated illustrations

---

# 8. Typography

Do not use:

- Inter
- Geist
- Space Grotesk
- Generic SaaS fonts

Choose a readable production font with personality.

The font should work well for:

- Product names
- Prices
- Tables
- Forms
- Numbers
- Billing screens

Typography hierarchy should be clear.

Recommended hierarchy:

```text
Page title
Section title
Product title
Supporting information
Metadata
Labels
Numerical values
Helper text
```

Avoid oversized headings.

This is an operational application, not a marketing site.

---

# 9. Color System

Create a proper semantic color system.

Example structure:

```text
Background
Surface
Surface elevated
Border
Text primary
Text secondary
Text muted

Primary
Primary hover
Primary active

Success
Warning
Error
Info

Inventory status
Low stock
Out of stock
Available

Payment status
Paid
Pending
Partial
Cancelled
```

Do not randomly select colors per component.

All colors must come from design tokens.

---

# 10. Iconography

Do not use random default icons.

Every icon should communicate a real action or object.

Examples:

```text
Products
Inventory
Billing
Purchases
Sales
Customers
Vendors
Reports
Settings
Users
Notifications
Search
Filter
Sort
Print
Download
Edit
Delete
Add
Back
Forward
Payment
Stock movement
```

Icons must be:

- Consistent
- Visually balanced
- Correctly sized
- Accessible
- Semantically meaningful

Avoid decorative icons.

---

# 11. Application Shell

Create a reusable application shell.

Structure:

```text
---------------------------------------------------
| Sidebar | Header                                |
|         |---------------------------------------|
|         |                                       |
|         | Main Content                          |
|         |                                       |
|         |                                       |
---------------------------------------------------
```

## Sidebar

Include:

- Yaazhi logo/wordmark
- Main navigation
- Section grouping
- Active state
- Collapsed state
- User/account section

The sidebar should not dominate the interface.

---

# 12. Sidebar Behavior

Desktop:

```text
Expanded
Collapsed
```

Collapsed mode should still allow navigation.

The collapse button must have a clear visual position.

Avoid generic hamburger styling.

Mobile:

Use an appropriate mobile navigation pattern.

Do not simply shrink the desktop sidebar.

---

# 13. Header

Header should provide:

- Current page context
- Search where appropriate
- Notifications
- User/profile access
- Contextual actions

Do not overload the header.

Every screen should have a clear primary action.

---

# 14. Main Navigation

Recommended initial structure:

```text
Overview

Sales
  Billing
  Sales Orders

Inventory
  Products
  Stock
  Stock Movements

Purchasing
  Purchase Orders
  Vendors

Customers

Reports

Settings
```

Adjust this based on actual features discovered in the Invenaro branch.

Do not introduce modules merely because they are common in ERP software.

---

# 15. Dashboard / Overview

Create an operational overview rather than a decorative analytics dashboard.

Useful information:

```text
Today's Sales
Today's Bills
Low Stock
Pending Payments
Recent Sales
Recent Purchases
Top Products
Stock Alerts
```

The dashboard should help the boutique owner answer:

- How much did I sell today?
- What needs attention?
- What is running low?
- What happened recently?

Avoid unnecessary charts.

---

# 16. Product Management

Products are central to Yaazhi.

The product model should support boutique-specific products.

Example:

```text
Product
SKU
Category
Brand
Selling Price
Cost Price
Stock
Size
Color
Fabric
Design
Status
```

Only include fields that are supported by the source requirements.

---

# 17. Boutique Product Examples

Use realistic data.

Examples:

```text
Kanchipuram Silk Saree
Cotton Handloom Saree
Designer Chudidar Set
Anarkali Chudidar
Cotton Kurti
Printed Kurti
Men's Linen Shirt
Kids Ethnic Set
Designer Blouse
Leggings
Dupatta
Cotton Palazzo
```

Avoid generic demo products such as:

```text
Product 1
Product 2
Test Product
Demo Item
Sample Product
```

---

# 18. Product List

The product list should support:

- Search
- Category filtering
- Stock status
- Price filtering
- Sorting
- Pagination
- Add product
- Edit product
- View product
- Delete/archive where supported

Table/list information should prioritize:

```text
Product
SKU
Category
Price
Stock
Status
Actions
```

Do not show every field by default.

---

# 19. Product Creation

Product form should be simple.

Group fields logically:

## Basic Information

```text
Product Name
SKU
Category
Description
```

## Pricing

```text
Cost Price
Selling Price
Discount
Tax
```

## Inventory

```text
Opening Stock
Low Stock Threshold
```

## Variants

If supported:

```text
Size
Color
Variant SKU
Variant Price
Variant Stock
```

---

# 20. Product Details

Product details should provide a clear operational view.

Include:

```text
Product information
Current stock
Pricing
Variants
Recent sales
Recent purchases
Stock movement
```

Do not create unnecessary tabs unless the information becomes difficult to scan.

---

# 21. Inventory

Inventory should be one of the most important sections.

Provide:

```text
Total products
Available stock
Low-stock products
Out-of-stock products
Inventory value
```

Main inventory list:

```text
Product
SKU
Available
Reserved
Low-stock threshold
Status
```

---

# 22. Stock Status

Use clear states:

```text
In Stock
Low Stock
Out of Stock
Inactive
```

Statuses must not rely only on color.

Use:

```text
Color + text
```

for accessibility.

---

# 23. Stock Movement

Track inventory changes.

Examples:

```text
Purchase
Sale
Return
Adjustment
Manual Update
Transfer
```

Movement information:

```text
Date
Product
Type
Quantity
Reference
User
Previous stock
New stock
```

---

# 24. Purchasing

Implement the purchasing flow from the Invenaro boutique branch.

Core flow:

```text
Create Purchase Order
        ↓
Select Vendor
        ↓
Add Products
        ↓
Set Quantities
        ↓
Review
        ↓
Confirm
        ↓
Receive Stock
```

Frontend should visually distinguish:

```text
Draft
Ordered
Partially Received
Received
Cancelled
```

---

# 25. Vendors

Vendor management should remain simple.

Fields may include:

```text
Vendor Name
Phone
Email
Address
GST information
Notes
```

Use only fields supported by the source project.

Vendor page:

```text
Vendor information
Purchase history
Outstanding amount
Recent purchase orders
```

---

# 26. Customers

Customer management should support quick billing.

Fields:

```text
Customer Name
Phone
Email
Address
```

The billing flow should make customer selection optional where appropriate.

Avoid forcing users through unnecessary forms.

---

# 27. Billing / POS

This is the most important UX area.

The billing screen should be optimized for speed.

Suggested layout:

```text
-----------------------------------------------------
| Search products                                   |
-----------------------------------------------------
| Product list                 | Current Bill       |
|                              |                    |
| Product                      | Item               |
| Price                        | Qty                |
| Stock                        | Price              |
| Add                          |                    |
|                              | Subtotal           |
|                              | Discount           |
|                              | Tax                |
|                              | Total              |
|                              |                    |
|                              | Pay                |
-----------------------------------------------------
```

---

# 28. Billing Product Search

Search should support:

```text
Product name
SKU
Barcode
```

Search results should show:

```text
Product
Variant
Price
Available stock
```

The user should be able to add an item quickly.

---

# 29. Billing Cart

Cart interaction must be extremely simple.

Example:

```text
Millet Curd Rice       −  1  +       ₹60
₹60 each
```

For boutique products:

```text
Kanchipuram Silk Saree
₹8,500 each

−  1  +
₹8,500
```

Quantity controls must be easy to tap.

Prevent quantity from exceeding available stock where the business rule requires it.

---

# 30. Bill Summary

Show:

```text
Subtotal
Discount
Tax
Round Off
Total
```

Total should have strong visual hierarchy.

Do not make the entire screen visually heavy.

---

# 31. Payment

Support the payment options already defined in the source application.

Potential examples:

```text
Cash
UPI
Card
Other
```

Do not invent payment methods if they are not part of the source requirements.

Payment states:

```text
Paid
Pending
Partial
```

---

# 32. Billing Success

After completing payment:

Show a clean success state.

Provide actions such as:

```text
New Bill
View Bill
Print
Download
Share
```

Do not use oversized celebratory animations.

---

# 33. Sales Orders

Sales Orders should follow the business flow from Invenaro.

Possible lifecycle:

```text
Draft
Confirmed
Processing
Dispatched
Completed
Cancelled
```

Only use statuses supported by the actual implementation.

---

# 34. Sales Order Creation

Flow:

```text
Select Customer
       ↓
Add Products
       ↓
Set Quantity
       ↓
Review
       ↓
Confirm
```

The same product selector should ideally be reusable with billing.

---

# 35. Reports

Reports should focus on useful boutique information.

Potential reports:

```text
Sales
Purchases
Inventory
Stock Movement
Product Performance
Customer Sales
```

Do not create meaningless charts.

Every report should answer a business question.

---

# 36. Tables

Tables must be designed for actual use.

Required capabilities where applicable:

```text
Search
Filter
Sort
Pagination
Column visibility
Row actions
Bulk actions
```

Table states:

```text
Loading
Empty
No search results
Error
Loaded
```

---

# 37. Forms

All forms must support:

```text
Initial state
Focused state
Filled state
Validation error
Disabled state
Loading state
Success
Server/API error
```

Validation messages must explain:

```text
What went wrong
How to fix it
```

Avoid generic:

```text
Invalid input
Something went wrong
```

where a better message is possible.

---

# 38. Loading States

Do not use unnecessary full-page spinners.

Prefer:

- Skeletons
- Inline loading
- Button loading states
- Section loading states

Example:

```text
Saving product...
Creating bill...
Updating inventory...
```

Buttons must prevent duplicate submissions.

---

# 39. Empty States

Every major page needs a meaningful empty state.

Example:

```text
No products yet

Add your first product to start managing inventory.

[Add Product]
```

Do not use:

```text
No data
Nothing here
Coming soon
```

without useful context.

---

# 40. Error States

Errors must be understandable.

Example:

```text
Unable to load products

We couldn't retrieve your products right now.

[Try again]
```

Do not expose raw stack traces to users.

---

# 41. Confirmation Dialogs

Use confirmation only when the action is destructive or difficult to undo.

Examples:

```text
Delete product
Cancel purchase order
Void bill
Remove customer
```

Dialog should explain the consequence.

Avoid unnecessary confirmation for harmless actions.

---

# 42. Delete vs Void

Follow the business behavior already defined by Invenaro.

Do not treat every record as simply deletable.

For financial/business records:

```text
Void
Cancel
Archive
```

may be more appropriate than deletion.

Preserve auditability.

---

# 43. Responsive Design

Desktop is important because boutique staff may use laptops/desktops.

But the application must also work on:

```text
Desktop
Laptop
Tablet
Mobile
```

Billing requires especially strong responsive behavior.

Do not merely shrink desktop layouts.

At smaller widths:

- Tables can become cards/list rows where appropriate.
- Billing should prioritize product search and cart.
- Forms should become single-column.
- Sidebar should become mobile navigation.
- Actions should remain accessible.

---

# 44. Accessibility

Implement:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Proper labels
- ARIA only where required
- Sufficient contrast
- Screen-reader-friendly buttons
- Accessible dialogs
- Accessible form errors

Never rely on color alone.

---

# 45. Component Architecture

Build reusable components.

Suggested structure:

```text
src/
  app/
  components/
    layout/
    navigation/
    forms/
    tables/
    dialogs/
    feedback/
    billing/
    products/
    inventory/
    purchases/
    sales/
    customers/
    vendors/
  features/
    billing/
    products/
    inventory/
    purchases/
    sales/
    customers/
    vendors/
    reports/
  lib/
  services/
  types/
  hooks/
  mocks/
  styles/
```

Adapt this to the chosen framework rather than forcing the exact structure.

---

# 46. Domain Separation

Do not put business logic directly inside UI components.

Bad:

```text
BillingPage.tsx
  1000 lines
  API calls
  calculations
  validation
  UI
  state management
```

Prefer:

```text
BillingPage
BillingCart
BillingSummary
ProductSearch
PaymentPanel

billing.service
billing.types
billing.utils
billing.validation
```

---

# 47. Mock Data Architecture

Because backend is not being implemented yet, create a mock data layer.

Example:

```text
mocks/
  products.ts
  customers.ts
  vendors.ts
  sales.ts
  purchases.ts
  inventory.ts
```

Components should consume a service/repository abstraction.

Example conceptual structure:

```text
UI
 ↓
Feature Hook
 ↓
Service
 ↓
Mock Repository
```

Later:

```text
UI
 ↓
Feature Hook
 ↓
Service
 ↓
API
 ↓
Backend
```

This allows backend integration without rewriting the UI.

---

# 48. Type Safety

Define proper TypeScript types.

Example:

```text
Product
ProductVariant
Customer
Vendor
Sale
SaleItem
Purchase
PurchaseItem
InventoryItem
StockMovement
Payment
```

Avoid:

```typescript
any
```

unless there is a justified technical reason.

---

# 49. State Management

Do not introduce a large state-management library simply because it is popular.

Use:

- Local component state where appropriate
- Context where genuinely useful
- Query/cache solution if API integration later requires it
- Centralized state only for genuinely shared state

Keep state ownership clear.

---

# 50. Routing

Every real application screen should have a stable route.

Example:

```text
/
 /billing
 /sales
 /sales/orders
 /inventory
 /inventory/products
 /inventory/products/:id
 /inventory/stock
 /inventory/movements
 /purchases
 /purchases/orders
 /vendors
 /customers
 /reports
 /settings
```

Adjust routes based on the actual Invenaro feature set.

No dead routes.

No placeholder routes.

---

# 51. Page Titles

Every route should have a meaningful browser title.

Examples:

```text
Yaazhi | Billing
Yaazhi | Products
Yaazhi | Inventory
Yaazhi | Purchase Orders
Yaazhi | Customers
```

Never:

```text
Vite
React App
localhost
Untitled
```

---

# 52. Metadata

Implement:

```text
title
description
canonical
Open Graph
Twitter/X metadata
```

Even though this is an authenticated/product application, the metadata should still be correct.

Do not create misleading SEO content.

---

# 53. Favicon

Create a proper Yaazhi favicon.

Requirements:

- Distinctive
- Simple
- Recognizable at small size
- Consistent with brand
- No generic framework logo

---

# 54. Robots

Create:

```text
robots.txt
```

Since this is an application rather than a public marketing site, determine appropriate indexing behavior.

Do not expose private application routes unnecessarily to search engines.

---

# 55. Sitemap

Create:

```text
sitemap.xml
```

Only include meaningful public routes if applicable.

Do not blindly include authenticated/private application routes.

---

# 56. llms.txt

Create:

```text
llms.txt
```

Provide concise information about the public product where appropriate.

Do not expose private implementation details.

---

# 57. Open Graph

Define appropriate social sharing metadata.

Example conceptual information:

```text
Yaazhi
Boutique Inventory & Billing
```

Use a real product image/brand asset when available.

Do not generate a fake marketing illustration.

---

# 58. Structured Data

Only implement schema where relevant.

Do not add fake:

```text
LocalBusiness
Reviews
Ratings
Offers
Testimonials
```

If Yaazhi has a legitimate public business/product page later, add the appropriate schema then.

---

# 59. SEO Principle

This is primarily an application.

Do not sacrifice product UX to add unnecessary SEO content.

SEO should never result in:

- Hidden keyword blocks
- Fake content
- Duplicate headings
- Misleading schema
- Marketing copy inside operational screens

---

# 60. Performance

Before completion:

Inspect bundle size.

Remove:

- Unused packages
- Duplicate packages
- Unused assets
- Unused CSS
- Dead components
- Development-only dependencies accidentally used in production

Avoid importing entire libraries when a smaller import is possible.

---

# 61. Images and Assets

Only use assets that serve a purpose.

Optimize:

- SVGs
- PNGs
- JPGs
- WebP
- Product images

Do not fill the interface with decorative images.

Boutique product images should feel realistic.

---

# 62. Animation

Animation should be subtle.

Use it for:

- Sidebar transitions
- Dialog opening
- Cart updates
- Toasts
- Page transitions where appropriate
- Loading states

Do not use:

- Constant floating elements
- Excessive hover effects
- Bouncing UI
- Decorative motion
- Attention-grabbing animations

---

# 63. Billing Interaction Principles

Billing should optimize for:

```text
Search
Select
Adjust quantity
Review
Pay
Finish
```

The user should not need to navigate through multiple pages for a simple bill.

---

# 64. Product Selection UX

The product selector should be reusable.

It should support:

```text
Search
Recent products
Categories
Stock availability
Variants
Price
Quick add
```

The UI should make it obvious when a product is:

```text
Available
Low stock
Out of stock
```

---

# 65. Keyboard UX

For desktop billing, consider useful keyboard shortcuts where appropriate.

Examples:

```text
Search
Add item
Increase quantity
Decrease quantity
Remove item
Focus payment
Complete bill
```

Do not introduce shortcuts that conflict with browser behavior.

---

# 66. Notifications

Use toast notifications for short-lived feedback.

Examples:

```text
Product created
Bill completed
Purchase order saved
Customer updated
```

Errors requiring user action should not disappear immediately.

---

# 67. Destructive Actions

Destructive actions should be visually distinguishable without turning the entire UI red.

Examples:

```text
Delete
Void
Cancel
Remove
```

Use appropriate confirmation.

---

# 68. Realistic Boutique Data

Create realistic seed/mock data.

Example categories:

```text
Sarees
Chudidar
Kurtis
Kids Wear
Blouses
Dupattas
Bottom Wear
Accessories
```

Example customers:

```text
Lakshmi Textiles
Meena Boutique
Anitha
Priya
```

Use realistic Tamil Nadu-oriented data where relevant.

Do not overdo regional branding.

---

# 69. Data Consistency

Mock data must be internally consistent.

For example:

If:

```text
Product stock = 10
```

and a sales order sells:

```text
3
```

the mock inventory should not still claim:

```text
10
```

unless the order is only a draft.

Similarly:

- Purchase quantities
- Sales quantities
- Stock movements
- Inventory balances

should make logical sense.

---

# 70. Business Rules

Extract actual rules from Invenaro before implementation.

Document rules such as:

```text
Can an out-of-stock item be billed?
Can quantity exceed stock?
When does stock decrease?
When does purchase stock increase?
When can an order be cancelled?
When can a bill be voided?
Can paid bills be edited?
Can customer be optional?
```

Do not invent rules casually.

---

# 71. Frontend-Only Architecture

At this stage:

```text
Frontend
  ↓
Typed service layer
  ↓
Mock repository
```

No:

```text
Database
API server
Prisma
PostgreSQL
Authentication backend
```

unless required by the existing frontend architecture.

The goal is to establish the UI architecture first.

---

# 72. Backend Preparation

Even though backend is deferred, prepare interfaces.

Example:

```typescript
interface ProductService {
  list(): Promise<Product[]>
  get(id: string): Promise<Product>
  create(input: CreateProductInput): Promise<Product>
  update(id: string, input: UpdateProductInput): Promise<Product>
  delete(id: string): Promise<void>
}
```

The implementation can initially use mock data.

Later it can use HTTP/API.

---

# 73. Security Preparation

Do not implement fake frontend authentication.

If authentication is not being built yet:

- Keep protected-route architecture easy to introduce later.
- Do not store fake passwords.
- Do not implement fake login security.
- Do not imply that frontend-only authentication is secure.

---

# 74. Error Boundary

Implement application-level error handling.

A runtime component failure should not result in a completely blank screen.

Provide:

```text
Something went wrong.

Try refreshing the page.

[Refresh]
```

Development diagnostics can remain available during development.

---

# 75. Browser Console

Before completion:

Check:

```text
Console errors
Console warnings
React warnings
Hydration warnings
Accessibility warnings
Network failures
404 assets
```

Resolve all production-relevant errors.

---

# 76. Routing Validation

Test every route.

Verify:

```text
Direct navigation
Refresh
Back
Forward
Invalid route
Deep links
Mobile navigation
```

No route should produce an unexpected blank screen.

---

# 77. Form Testing

Test:

```text
Valid input
Missing required input
Invalid values
Long values
Duplicate SKU
Zero quantity
Negative quantity
Large quantity
Slow submission
Double submission
Cancel
Reset
```

---

# 78. Billing Testing

Test at minimum:

```text
Add one product
Add multiple products
Increase quantity
Decrease quantity
Remove product
Add same product twice
Out-of-stock product
Low-stock product
Discount
Tax
Customer selection
Payment
Complete bill
Cancel bill
Start new bill
```

---

# 79. Inventory Testing

Test:

```text
Create product
Edit product
Stock update
Purchase receipt
Sale deduction
Stock movement
Low-stock threshold
Out-of-stock state
Search
Filter
Pagination
```

---

# 80. Responsive Testing

Test at:

```text
320px
375px
390px
768px
1024px
1280px
1440px+
```

Check:

- Sidebar
- Header
- Tables
- Forms
- Billing
- Dialogs
- Buttons
- Product cards/list
- Overflow
- Horizontal scrolling

---

# 81. Accessibility Testing

Check:

```text
Keyboard navigation
Tab order
Focus visibility
Form labels
Button names
Dialog accessibility
Color contrast
Screen reader semantics
```

---

# 82. Production Build

Run the project's actual build commands.

At minimum:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

Use the project's existing scripts where they differ.

Do not blindly add scripts if equivalent checks already exist.

---

# 83. TypeScript Check

Resolve:

```text
Type errors
Implicit any
Unused imports
Incorrect props
Incorrect route types
Invalid API models
```

Do not suppress errors with:

```typescript
// @ts-ignore
```

unless there is a documented and unavoidable reason.

---

# 84. Lint Check

Resolve:

- Unused variables
- React warnings
- Hook dependency issues
- Accessibility violations
- Incorrect imports
- Dead code

Do not disable lint rules merely to make the build pass.

---

# 85. Production Source Maps

Do not ship unnecessary production source maps.

If the chosen framework generates them automatically, configure appropriately based on the deployment/debugging strategy.

Do not compromise debugging capability blindly.

---

# 86. Dependency Audit

After implementation:

Check:

```bash
npm outdated
npm audit
```

Do not automatically upgrade every package.

Only change dependencies when it improves:

- Security
- Compatibility
- Performance
- Maintainability

---

# 87. Unused Code Cleanup

Before completion remove:

- Unused components
- Old demo components
- Framework starter content
- Unused images
- Unused CSS
- Dead routes
- Duplicate utilities
- Unused dependencies
- Placeholder data

Do not delete code that is intentionally part of future API architecture without understanding its purpose.

---

# 88. No Demo Content

Do not leave:

```text
Welcome to React
Vite logo
Get started
Lorem ipsum
Test product
Demo customer
Sample dashboard
```

The final product must feel like an actual boutique application.

---

# 89. No Fake Marketing

Do not create:

- Landing page
- Testimonials
- Pricing
- Fake customer logos
- Fake statistics
- Fake reviews

These are explicitly out of scope.

---

# 90. Design Review

After implementation, inspect every screen as a product designer.

Ask:

### Does this look AI-generated?

If yes, simplify.

### Is there unnecessary decoration?

Remove it.

### Is the primary action obvious?

If not, fix hierarchy.

### Is there too much information?

Reduce visual noise.

### Does the interface feel boutique-specific?

If not, improve product terminology and workflows.

### Can a shop employee use it quickly?

If not, reduce friction.

---

# 91. UX Review

For every workflow ask:

```text
What does the user want?
What is the fastest path?
What information do they need?
What can be hidden?
What should be remembered?
What can be automated?
```

Do not optimize for visual novelty.

Optimize for usability.

---

# 92. Implementation Order

Follow this sequence.

## Phase 1: Discovery

1. Clone Invenaro.
2. Checkout `local_boutique`.
3. Inspect all routes.
4. Inspect all components.
5. Inspect data structures.
6. Inspect business flows.
7. Clone/inspect BillFlow.
8. Document useful UI patterns.
9. Create Yaazhi feature inventory.

Deliverable:

```text
YAAZHI_FEATURE_INVENTORY.md
```

---

# 93. Phase 2: Architecture

1. Create Yaazhi repository.
2. Select/retain appropriate frontend stack.
3. Configure TypeScript.
4. Configure linting.
5. Configure formatting.
6. Establish directory structure.
7. Establish design tokens.
8. Establish typography.
9. Establish icon system.
10. Establish routing.
11. Establish mock service architecture.

Deliverable:

```text
Working application shell
```

---

# 94. Phase 3: Core Shell

Build:

1. Sidebar
2. Header
3. Responsive navigation
4. Page layout
5. Breadcrumbs where useful
6. Toast system
7. Dialog system
8. Loading states
9. Error states
10. Empty states

Do not build every page immediately.

First make the shell production quality.

---

# 95. Phase 4: Products

Implement:

```text
Product list
Product creation
Product editing
Product details
Product search
Product filtering
Product states
```

Use realistic boutique data.

---

# 96. Phase 5: Inventory

Implement:

```text
Inventory overview
Stock list
Stock status
Stock movement
Inventory filters
Low-stock states
Out-of-stock states
```

Ensure mock data is consistent.

---

# 97. Phase 6: Customers & Vendors

Implement:

```text
Customers
Customer details
Customer selection

Vendors
Vendor details
Vendor selection
```

Keep workflows lightweight.

---

# 98. Phase 7: Purchasing

Implement:

```text
Purchase order list
Create purchase order
Purchase order details
Purchase states
Receive stock
```

Reuse product selection components.

---

# 99. Phase 8: Sales

Implement:

```text
Sales order list
Create sales order
Sales order details
Status changes
```

Reuse:

```text
Customer selector
Product selector
Quantity controls
Summary components
```

---

# 100. Phase 9: Billing

Build billing only after the shared product/customer components are stable.

Implement:

```text
Billing screen
Product search
Cart
Quantity
Customer
Discount
Tax
Payment
Success
Receipt/bill view
```

Billing should receive the highest UX attention.

---

# 101. Phase 10: Reports

Implement only useful reports from the source requirements.

Do not create unnecessary analytics.

---

# 102. Phase 11: Settings

Implement settings required by the source product.

Avoid creating large configuration areas without real requirements.

---

# 103. Phase 12: Production Polish

Perform:

```text
Responsive review
Accessibility review
UX review
Visual consistency review
Console cleanup
Build cleanup
Dependency cleanup
Asset cleanup
SEO metadata
Favicon
robots.txt
sitemap.xml
llms.txt
Open Graph
```

---

# 104. Phase 13: QA

Run complete manual testing.

Create a checklist:

```text
[ ] Navigation
[ ] Product CRUD UI
[ ] Inventory
[ ] Stock movement
[ ] Customers
[ ] Vendors
[ ] Purchase orders
[ ] Sales orders
[ ] Billing
[ ] Payment
[ ] Reports
[ ] Settings
[ ] Search
[ ] Filters
[ ] Pagination
[ ] Loading states
[ ] Empty states
[ ] Error states
[ ] Dialogs
[ ] Responsive
[ ] Accessibility
[ ] Browser console
[ ] Build
[ ] TypeScript
[ ] Lint
```

---

# 105. Definition of Done

Yaazhi frontend is considered complete only when:

### Product

- [ ] Yaazhi branding is implemented.
- [ ] No landing page exists.
- [ ] Product feels boutique-specific.
- [ ] UI does not look AI-generated.
- [ ] No placeholder/demo content remains.

### Functionality

- [x] All required Invenaro boutique features are represented.
- [x] Billing workflow is complete.
- [ ] Inventory workflow is complete.
- [ ] Purchase workflow is complete.
- [ ] Sales workflow is complete.
- [ ] Customer workflow is complete.
- [ ] Vendor workflow is complete.
- [ ] Reports required by the source are represented.

### UI

- [ ] Consistent design system.
- [ ] Proper icons.
- [ ] Consistent spacing.
- [ ] Clear typography.
- [ ] Clear hierarchy.
- [ ] Minimal visual noise.
- [ ] Responsive layouts.
- [ ] Accessible interactions.

### UX

- [ ] Loading states.
- [ ] Empty states.
- [ ] Error states.
- [ ] Success states.
- [ ] Disabled states.
- [ ] Form validation.
- [ ] Confirmation flows.
- [ ] Fast billing workflow.

### Technical

- [ ] TypeScript passes.
- [ ] Lint passes.
- [ ] Build passes.
- [ ] No production console errors.
- [ ] No broken routes.
- [ ] No missing assets.
- [ ] No unnecessary dependencies.
- [ ] No dead starter code.

### Web

- [ ] Page titles.
- [ ] Meta descriptions.
- [ ] Canonical metadata.
- [ ] Favicon.
- [ ] robots.txt.
- [ ] sitemap.xml.
- [ ] llms.txt.
- [ ] Open Graph metadata.
- [ ] Appropriate structured data.
- [ ] Meaningful alt text.

---

# 106. Important Engineering Rules

## Rule 1

Do not rewrite working functionality without a reason.

## Rule 2

Do not copy the Invenaro UI blindly.

Extract the functionality and improve the UX.

## Rule 3

Do not copy BillFlow visually.

Use it as a UX reference.

## Rule 4

Do not add features just because they are common in inventory software.

Only implement features justified by the source requirements.

## Rule 5

Do not build the backend in this phase.

Prepare clean service boundaries instead.

## Rule 6

Do not use fake functionality.

If something is frontend-only, make the mock behavior internally consistent.

## Rule 7

Do not hide bugs with error suppression.

Fix the root cause.

## Rule 8

Do not add visual effects just to make the product look modern.

Usability comes first.

## Rule 9

Do not use generic SaaS design patterns everywhere.

Yaazhi should have its own identity.

## Rule 10

Every component should have a reason to exist.

---

# 107. Git Commit Strategy

Use meaningful commits.

Examples:

```text
chore: initialize Yaazhi frontend
feat: add application shell
feat: add boutique design system
feat: add product management UI
feat: add inventory management UI
feat: add customer management UI
feat: add vendor management UI
feat: add purchase order workflow
feat: add sales order workflow
feat: add billing experience
feat: add reports
fix: improve responsive billing layout
fix: resolve product form validation
perf: optimize application bundle
chore: remove unused assets
chore: finalize production metadata
```

Avoid:

```text
update
changes
fix stuff
final
final2
new UI
```

---

# 108. Final Product Principle

Yaazhi should feel like software that a real boutique owner could open every morning and immediately understand.

The core experience should be:

```text
Open Yaazhi
      ↓
See what needs attention
      ↓
Manage products and stock
      ↓
Create purchase/sales orders
      ↓
Bill customers quickly
      ↓
Understand sales and inventory
```

The interface should remain calm and practical.

The product should feel designed, not decorated.

---

# 109. Final Instruction to the Implementer

Before implementing anything:

1. Inspect `Invenaro/local_boutique`.
2. Inspect `BillFlow`.
3. Extract all relevant features.
4. Identify reusable business concepts.
5. Identify existing bugs or inconsistencies.
6. Create a feature inventory.
7. Create the Yaazhi application architecture.
8. Create the design system.
9. Build the application shell.
10. Implement modules incrementally.
11. Reuse shared components.
12. Keep frontend/backend boundaries clean.
13. Use realistic boutique data.
14. Test every workflow.
15. Test responsive behavior.
16. Test accessibility.
17. Run TypeScript.
18. Run lint.
19. Run production build.
20. Check browser console.
21. Check routes.
22. Check assets.
23. Check metadata.
24. Remove unused code.
25. Perform a final human UX review.

Do not consider the project finished simply because the application builds.

The final standard is:

> **If a real boutique owner could use Yaazhi without being reminded that it was generated from a template, the frontend is ready.**
