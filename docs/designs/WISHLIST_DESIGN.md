# Wishlist / Save for Later - Design Specification 🎨

**Feature**: Persistent wishlist with cross-device sync, sharing, and notifications
**Priority**: P1 (Critical for engagement and repeat visits)
**Impact**: +30% return visits, drives sales conversions
**Design Date**: 2025-12-06
**Designer**: UI/UX Designer Agent

---

## 📋 Table of Contents

1. [Overview & Goals](#overview--goals)
2. [User Flows](#user-flows)
3. [Component Designs](#component-designs)
4. [Desktop Layouts](#desktop-layouts)
5. [Mobile Layouts](#mobile-layouts)
6. [Accessibility](#accessibility)
7. [Animations & Interactions](#animations--interactions)
8. [Technical Specifications](#technical-specifications)

---

## Overview & Goals

### Design Objectives

**Primary Goals:**
- Enable users to save products for later consideration
- Increase user engagement and repeat visits
- Facilitate gift giving and purchase planning
- Recover potential lost sales through notifications

**Key Features:**
- ❤️ Add/remove products from wishlist
- 🔄 Cross-device synchronization (logged-in users)
- 📤 Share wishlist via link/email/social
- 📉 Price drop notifications
- 🔔 Back-in-stock alerts
- 🛒 Move items between cart and wishlist
- 📊 Wishlist analytics for store owners

### Success Metrics

- Wishlist adoption rate: >20% of users
- Wishlist → Cart conversion: >25%
- Return visit rate from wishlist emails: >15%
- Average items per wishlist: 5-8 products

---

## User Flows

### Flow 1: Adding Product to Wishlist

```
Product Page/Listing
        ↓
Click Heart Icon (outlined)
        ↓
[Guest User]                     [Logged-in User]
        ↓                                ↓
Show signup prompt              Heart fills with animation
"Sign in to save"              Toast: "Added to wishlist"
        ↓                                ↓
User signs in/registers         Sync to server
        ↓                                ↓
Product added to wishlist       Update wishlist badge count
        ↓
Heart icon fills
```

### Flow 2: Viewing Wishlist

```
Click Wishlist Icon (header)
        ↓
Wishlist Page Loads
        ↓
[Empty State]                    [Has Items]
        ↓                              ↓
Show illustration              Display products grid
"Your wishlist is empty"       with actions
"Start browsing"                     ↓
        ↓                        User can:
Suggested products            - Add to cart
                              - Remove item
                              - Share wishlist
                              - Sort/filter
```

### Flow 3: Price Drop Notification

```
Product price decreases
        ↓
System detects change
        ↓
Email/Push notification sent
        ↓
User clicks notification
        ↓
Opens product page
        ↓
Shows price drop badge
"Price dropped 15%!"
        ↓
User adds to cart
```

---

## Component Designs

### 1. Wishlist Button/Icon

#### On Product Cards (Listing Page)

**Visual Design:**
```
┌──────────────────────┐
│                      │
│   Product Image      │
│                      │
│         ♡            │ ← Heart icon (top-right)
└──────────────────────┘
```

**Component Specification:**

```tsx
// Container (absolute positioning on product card)
className="absolute top-3 right-3 z-10"

// Button
className="group w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"

// Heart icon (empty state)
className="w-5 h-5 text-neutral-700 group-hover:text-primary-600 transition-colors"
- Icon: Heart (outline)

// Heart icon (filled state)
className="w-5 h-5 text-primary-600 fill-current"
- Icon: HeartFilled
- Animation: Scale bounce on add

// Tooltip on hover
className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
"Add to wishlist" / "Remove from wishlist"
```

#### On Product Detail Page

**Visual Design:**
```
┌─────────────────────────────────────┐
│ Product Name                  $99.99│
│ ★★★★☆ (124 reviews)                │
│                                     │
│ [− 1 +]  [Add to Cart]  [♡ Save]   │
└─────────────────────────────────────┘
```

**Component Specification:**

```tsx
// Save button (outline style when not saved)
className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-neutral-300 hover:border-primary-600 text-neutral-700 hover:text-primary-600 font-semibold rounded-lg transition-colors duration-200"

// Saved state
className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-50 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg"

// Icon + Text
<Heart className="w-5 h-5" /> {/* or HeartFilled */}
<span>{saved ? "Saved" : "Save"}</span>
```

### 2. Wishlist Page Header

**Visual Design:**

```
┌─────────────────────────────────────────────────────────┐
│ ♡ My Wishlist (8 items)                                 │
│                                                          │
│ [All Items ▾] [Sort by: Recent ▾]  [Share] [Clear All] │
│                                                          │
│ [󰍉 Grid]  [󰍉󰍉󰍉 List]                                   │
└─────────────────────────────────────────────────────────┘
```

**Component Specification:**

```tsx
// Header container
className="border-b border-neutral-200 dark:border-neutral-700 pb-6 mb-8"

// Title section
className="flex items-center justify-between mb-6"

// Title
className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-3"
- Icon: Heart (filled, primary color)
- Text: "My Wishlist"
- Count badge: className="text-lg font-normal text-neutral-600 dark:text-neutral-400"

// Action buttons (desktop)
className="flex items-center gap-3"

// Share button
className="flex items-center gap-2 px-4 py-2 border-2 border-neutral-300 dark:border-neutral-600 hover:border-primary-600 hover:text-primary-600 rounded-lg font-medium transition-colors"
- Icon: Share2
- Text: "Share"

// Clear all button (text only)
className="text-primary-600 dark:text-primary-400 hover:underline font-medium"

// Controls section
className="flex items-center justify-between"

// Filter dropdown
className="flex items-center gap-2"
- "All Items" / "Available Only" / "On Sale"

// Sort dropdown
className="flex items-center gap-2"
- "Recently Added" / "Price: Low to High" / "Price: High to Low" / "Name"

// View toggle (Grid/List)
className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
```

### 3. Wishlist Product Card (Grid View)

**Visual Design:**

```
┌─────────────────────────┐
│      [×]                │
│   ┌───────────────┐     │
│   │               │     │
│   │  Product Img  │     │
│   │               │     │
│   └───────────────┘     │
│                         │
│ Product Name            │
│ $99.99  ̶$̶1̶2̶9̶.̶9̶9̶        │
│                         │
│ ☑ In Stock              │
│ 🔔 Price alert ON       │
│                         │
│ [Add to Cart]           │
│ [View Details]          │
└─────────────────────────┘
```

**Component Specification:**

```tsx
// Card container
className="group relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-xl hover:border-primary-300 transition-all duration-300 overflow-hidden"

// Remove button
className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
- Icon: X size={16}
- Accessible label: "Remove from wishlist"

// Image container
className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800"

// Image
className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"

// Badge overlay (if on sale)
className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-md"
"15% OFF"

// Content section
className="p-4"

// Product name
className="font-semibold text-neutral-900 dark:text-neutral-50 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors"

// Price section
className="flex items-center gap-2 mb-3"

// Current price
className="text-xl font-bold text-neutral-900 dark:text-neutral-50"

// Original price (if on sale)
className="text-sm text-neutral-500 line-through"

// Price drop badge (if applicable)
className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full"
"↓ 15% off"

// Status indicators
className="space-y-1 mb-4"

// In stock indicator
className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
- Icon: CheckCircle size={16}
- Text: "In Stock"

// Out of stock indicator
className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
- Icon: AlertCircle size={16}
- Text: "Out of Stock"

// Price alert indicator
className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400"
- Icon: Bell (filled if active) size={16}
- Text: "Price alert ON" / "Price alert OFF"

// Action buttons
className="space-y-2"

// Add to cart button
className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
- Disabled if out of stock
- Icon: ShoppingCart size={18}
- Text: "Add to Cart" / "Out of Stock"

// View details link
className="w-full py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 text-sm font-medium text-center"
```

### 4. Wishlist Product Card (List View)

**Visual Design:**

```
┌────────────────────────────────────────────────────────────┐
│ [×]  [Img]  Product Name                    $99.99  ̶$̶1̶2̶9̶  │
│            Brief description...              ☑ In Stock    │
│            Size: M | Color: Blue             [Add to Cart] │
└────────────────────────────────────────────────────────────┘
```

**Component Specification:**

```tsx
// Container
className="flex items-center gap-6 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:shadow-lg hover:border-primary-300 transition-all group"

// Remove button
className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700"

// Image
className="flex-shrink-0 w-24 h-24 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800"

// Details section
className="flex-1 min-w-0"

// Product name
className="font-semibold text-lg text-neutral-900 dark:text-neutral-50 mb-1 group-hover:text-primary-600 transition-colors"

// Description
className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-1"

// Attributes
className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"
- Size, Color, etc. separated by |

// Price & Actions section
className="flex-shrink-0 flex flex-col items-end gap-3"

// Price
className="text-2xl font-bold text-neutral-900 dark:text-neutral-50"

// Stock status
className="text-sm text-green-600 dark:text-green-400"

// Add to cart button
className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
```

### 5. Empty Wishlist State

**Visual Design:**

```
┌─────────────────────────────────────┐
│                                     │
│            ♡                        │
│       (empty heart                  │
│        illustration)                │
│                                     │
│    Your Wishlist is Empty           │
│                                     │
│  Save items you love to view        │
│  them later and get notified        │
│  about price drops!                 │
│                                     │
│    [Start Shopping]                 │
│                                     │
│  ━━━ You Might Like ━━━             │
│                                     │
│  [Product] [Product] [Product]      │
└─────────────────────────────────────┘
```

**Component Specification:**

```tsx
// Container
className="flex flex-col items-center justify-center py-20 px-4"

// Empty state illustration/icon
className="w-32 h-32 text-neutral-300 dark:text-neutral-600 mb-6"
- Large outlined heart icon or custom illustration

// Title
className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-3"
"Your Wishlist is Empty"

// Description
className="text-neutral-600 dark:text-neutral-400 text-center max-w-md mb-8"
"Save items you love to view them later and get notified about price drops!"

// CTA button
className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
"Start Shopping"

// Suggestions section
className="mt-16 w-full max-w-6xl"

// Section title
className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-6 text-center"
"You Might Like"

// Product grid
className="grid grid-cols-2 md:grid-cols-4 gap-6"
```

### 6. Share Wishlist Modal

**Visual Design:**

```
┌──────────────────────────────────┐
│ Share Your Wishlist          ╳   │
├──────────────────────────────────┤
│                                  │
│ [󰇙 Link] Copy link to clipboard  │
│ ┌──────────────────────────────┐ │
│ │ https://store.com/wish/abc   │ │
│ │                      [Copy]  │ │
│ └──────────────────────────────┘ │
│                                  │
│ [✉ Email] Share via email        │
│ [f Facebook] Share on Facebook   │
│ [Twitter] Share on Twitter      │
│ [WhatsApp] Share on WhatsApp    │
│                                  │
│ ┌────────────────────────────┐   │
│ │ ☑ Allow others to view     │   │
│ │ ☐ Allow others to purchase │   │
│ │   for me (registry mode)   │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

**Component Specification:**

```tsx
// Modal container
className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"

// Modal content
className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl"

// Header
className="flex items-center justify-between mb-6"

// Title
className="text-xl font-bold text-neutral-900 dark:text-neutral-50"

// Close button
className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"

// Share options
className="space-y-3 mb-6"

// Each share option
className="flex items-center gap-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"

// Icon
className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"

// Label
className="flex-1 font-medium text-neutral-900 dark:text-neutral-50"

// Copy link input
className="flex gap-2 p-3 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg"

// Input field
className="flex-1 bg-transparent text-sm text-neutral-700 dark:text-neutral-300 outline-none"
readOnly

// Copy button
className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-md transition-colors"

// Permissions section
className="space-y-2"

// Checkbox options
className="flex items-start gap-3"
- Checkbox + Label with description
```

### 7. Price Drop / Back-in-Stock Notification Settings

**Visual Design:**

```
┌──────────────────────────────────┐
│ Notification Preferences     ╳   │
├──────────────────────────────────┤
│                                  │
│ Get notified when:               │
│                                  │
│ ☑ Price drops                    │
│   └─ Any price drop              │
│   └─ Drop by at least [10]%      │
│                                  │
│ ☑ Item comes back in stock       │
│                                  │
│ ☑ Item is on sale                │
│                                  │
│ Notification method:             │
│ ☑ Email                          │
│ ☑ Push notification              │
│ ☐ SMS (requires phone number)    │
│                                  │
│        [Cancel]  [Save Settings] │
└──────────────────────────────────┘
```

**Component Specification:**

```tsx
// Modal container (same as share modal)

// Checkbox groups
className="space-y-4 mb-6"

// Section
className="border-b border-neutral-200 dark:border-neutral-700 pb-4 last:border-0"

// Main checkbox
className="flex items-start gap-3"

// Nested options (indented)
className="ml-8 mt-2 space-y-2"

// Percentage input
className="w-20 px-3 py-1.5 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-sm"

// Footer buttons
className="flex justify-end gap-3 mt-6"
```

---

## Desktop Layouts

### Wishlist Page - Grid View (Desktop)

```
┌────────────────────────────────────────────────────────────┐
│ Header Navigation                       [Search] [Cart] [♡]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ♡ My Wishlist (8 items)                                   │
│                                                            │
│ [All Items ▾] [Sort: Recent ▾]     [Share] [Clear All]   │
│ [Grid] [List]                                             │
│                                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │   [×]    │ │   [×]    │ │   [×]    │ │   [×]    │     │
│ │          │ │          │ │          │ │          │     │
│ │  Product │ │  Product │ │  Product │ │  Product │     │
│ │   Image  │ │   Image  │ │   Image  │ │   Image  │     │
│ │          │ │          │ │          │ │          │     │
│ │          │ │          │ │          │ │          │     │
│ │ Name     │ │ Name     │ │ Name     │ │ Name     │     │
│ │ $99.99   │ │ $99.99   │ │ $99.99   │ │ $99.99   │     │
│ │ In Stock │ │ On Sale  │ │ In Stock │ │ Sold Out │     │
│ │          │ │          │ │          │ │          │     │
│ │ [Add >]  │ │ [Add >]  │ │ [Add >]  │ │[Notify]  │     │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ Products │ │ Products │ │ Products │ │ Products │     │
│ │   5-8    │ │   6-8    │ │   7-8    │ │   8-8    │     │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Grid Specifications:**

```tsx
// Container
className="container mx-auto px-4 py-8 max-w-7xl"

// Product grid
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"

// Responsive breakpoints:
// - Mobile (< 640px): 1 column
// - Tablet (640-1024px): 2-3 columns
// - Desktop (> 1024px): 4 columns
```

### Wishlist Page - List View (Desktop)

```
┌────────────────────────────────────────────────────────────┐
│ ♡ My Wishlist (8 items)                                   │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │[×] [Img] Product Name              $99  ̶$̶1̶2̶9̶  [Add >]││
│ │         Description text...        In Stock           ││
│ │         Size: M | Color: Blue      🔔 Price alert     ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │[×] [Img] Product Name              $199      [Add >]  ││
│ │         Description text...        In Stock           ││
│ │         Size: L | Color: Red                          ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ... (more products)                                       │
└────────────────────────────────────────────────────────────┘
```

---

## Mobile Layouts

### Wishlist Page (Mobile)

```
┌─────────────────────────┐
│ ←  Wishlist (8)     ⋮   │
├─────────────────────────┤
│                         │
│ [All ▾]  [Recent ▾]     │
│                         │
│ ┌─────────────────────┐ │
│ │      [×]            │ │
│ │  ┌───────────────┐  │ │
│ │  │  Product Img  │  │ │
│ │  └───────────────┘  │ │
│ │  Product Name       │ │
│ │  $99.99  ̶$̶1̶2̶9̶.̶9̶9̶    │ │
│ │  ☑ In Stock         │ │
│ │  [Add to Cart]      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │  Product Card 2     │ │
│ └─────────────────────┘ │
│                         │
│ ... (scroll)            │
│                         │
├─────────────────────────┤
│ [Share Wishlist]        │
└─────────────────────────┘
```

**Mobile Specifications:**

```tsx
// Container
className="min-h-screen bg-neutral-50 dark:bg-neutral-900"

// Header
className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3"

// Product grid (single column on mobile)
className="px-4 py-4 space-y-4"

// Sticky footer with share button
className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4"
```

### Mobile Mini-Wishlist (Header Dropdown)

```
┌─────────────────────────┐
│ ♡ Wishlist (3)      ╳   │
├─────────────────────────┤
│ [Img] Product Name      │
│       $99.99            │
│       [Add] [×]         │
├─────────────────────────┤
│ [Img] Product Name      │
│       $79.99            │
│       [Add] [×]         │
├─────────────────────────┤
│ [Img] Product Name      │
│       $59.99            │
│       [Add] [×]         │
├─────────────────────────┤
│ [View All (8 items)]    │
└─────────────────────────┘
```

**Component Specification:**

```tsx
// Dropdown container (triggered from header heart icon)
className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50"

// Header
className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700"

// Product list (max 3 items, scroll if more)
className="max-h-80 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-700"

// Each product item
className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800"

// Footer
className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"

// View all button
className="w-full py-2 text-primary-600 dark:text-primary-400 font-semibold text-center hover:underline"
```

---

## Accessibility

### WCAG 2.1 AA Compliance

**Keyboard Navigation:**

```tsx
// Wishlist button
tabIndex={0}
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    toggleWishlist();
  }
}}

// Remove button
aria-label="Remove [Product Name] from wishlist"

// Share button
aria-label="Share wishlist"
```

**Screen Reader Support:**

```tsx
// Wishlist button state
aria-pressed={isInWishlist}
aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}

// Wishlist count badge
aria-live="polite"
aria-atomic="true"
- Announces: "Wishlist updated, now 5 items"

// Product card
role="article"
aria-labelledby="product-name-{id}"

// Empty state
role="status"
aria-live="polite"
```

**Color Contrast:**

- Text on background: Minimum 4.5:1 ratio
- Icon buttons: 3:1 ratio
- Focus indicators: 3:1 ratio with 2px outline

**Focus Management:**

```tsx
// Focus trap in modals
- First focusable element receives focus on open
- Tab cycles through interactive elements
- Escape key closes modal and returns focus

// Focus visible styles
className="focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
```

---

## Animations & Interactions

### Add to Wishlist Animation

```tsx
// Heart fill animation
@keyframes heartFill {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

// Apply animation
className="animate-[heartFill_0.3s_ease-out]"

// Color transition
className="transition-colors duration-200"
```

### Toast Notification (Added/Removed)

```tsx
// Toast container
className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg shadow-xl animate-in slide-in-from-top-5 fade-in duration-300"

// Auto-dismiss after 3 seconds
useEffect(() => {
  const timer = setTimeout(() => setShow(false), 3000);
  return () => clearTimeout(timer);
}, []);

// Exit animation
className="animate-out slide-out-to-top-5 fade-out duration-200"
```

### Price Drop Badge Pulse

```tsx
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

className="animate-[pulse_2s_ease-in-out_infinite]"
```

### Hover Effects

```tsx
// Product card hover
className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300"

// Button hover
className="hover:bg-primary-700 hover:scale-105 transition-all duration-200"
```

---

## Technical Specifications

### Data Model

```typescript
interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string; // For products with variants
  addedAt: Date;
  priceWhenAdded: number;
  currentPrice: number;
  priceAlertEnabled: boolean;
  priceAlertThreshold?: number; // Percentage drop to trigger alert
  stockAlertEnabled: boolean;
  notes?: string; // Private notes
}

interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  isPublic: boolean;
  shareToken?: string; // For sharing
  allowPurchaseByOthers: boolean; // Registry mode
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

```typescript
// Add to wishlist
POST /api/v1/wishlist/items
Body: { productId, variantId?, priceAlertEnabled?, stockAlertEnabled? }

// Remove from wishlist
DELETE /api/v1/wishlist/items/{itemId}

// Get user's wishlist
GET /api/v1/wishlist
Response: { items: WishlistItem[], totalCount: number }

// Update item preferences
PATCH /api/v1/wishlist/items/{itemId}
Body: { priceAlertEnabled?, stockAlertEnabled?, notes? }

// Share wishlist
POST /api/v1/wishlist/share
Response: { shareUrl: string, token: string }

// Get shared wishlist (public)
GET /api/v1/wishlist/shared/{token}

// Move to cart
POST /api/v1/wishlist/items/{itemId}/move-to-cart

// Bulk operations
POST /api/v1/wishlist/items/bulk-add
DELETE /api/v1/wishlist/items/bulk-remove
```

### State Management (React)

```typescript
// Zustand store
interface WishlistStore {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addItem: (productId: string, options?: WishlistItemOptions) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<WishlistItem>) => Promise<void>;
  moveToCart: (itemId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;

  // Selectors
  isInWishlist: (productId: string) => boolean;
  getItemCount: () => number;
  getItemByProductId: (productId: string) => WishlistItem | undefined;
}

// Usage example
const { items, addItem, isInWishlist } = useWishlistStore();

const handleAddToWishlist = async () => {
  await addItem(product.id, {
    priceAlertEnabled: true,
    priceAlertThreshold: 10 // 10% drop
  });
  toast.success('Added to wishlist!');
};
```

### Local Storage (Guest Users)

```typescript
// For non-logged-in users, store in localStorage
const WISHLIST_STORAGE_KEY = 'guest_wishlist';

interface GuestWishlistItem {
  productId: string;
  addedAt: string;
}

// Save
const saveGuestWishlist = (items: GuestWishlistItem[]) => {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
};

// Load
const loadGuestWishlist = (): GuestWishlistItem[] => {
  const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Migrate on login
const migrateGuestWishlist = async (userId: string) => {
  const guestItems = loadGuestWishlist();
  if (guestItems.length > 0) {
    await api.post('/api/v1/wishlist/items/bulk-add', {
      items: guestItems.map(item => ({ productId: item.productId }))
    });
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  }
};
```

### Notification System

```typescript
// Price drop detection (backend cron job)
interface PriceDropAlert {
  checkPriceDrops: () => Promise<void>;
}

// Pseudo-code for backend job
async function checkPriceDrops() {
  const wishlistItems = await db.wishlistItems.find({
    priceAlertEnabled: true
  }).populate('product');

  for (const item of wishlistItems) {
    const currentPrice = item.product.price;
    const priceDrop = ((item.priceWhenAdded - currentPrice) / item.priceWhenAdded) * 100;

    if (priceDrop >= (item.priceAlertThreshold || 5)) {
      await sendNotification({
        userId: item.userId,
        type: 'PRICE_DROP',
        productId: item.productId,
        message: `Price dropped ${priceDrop.toFixed(0)}% on ${item.product.name}!`,
        link: `/products/${item.productId}`
      });

      // Update price tracking
      await db.wishlistItems.updateOne(
        { _id: item.id },
        { currentPrice, lastNotifiedAt: new Date() }
      );
    }
  }
}

// Run every 6 hours
cron.schedule('0 */6 * * *', checkPriceDrops);
```

### Performance Optimizations

```typescript
// Lazy load wishlist on demand
const Wishlist = lazy(() => import('./pages/Wishlist'));

// Prefetch wishlist data on hover
const prefetchWishlist = () => {
  queryClient.prefetchQuery(['wishlist'], fetchWishlist);
};

<Link
  to="/wishlist"
  onMouseEnter={prefetchWishlist}
  onFocus={prefetchWishlist}
>
  Wishlist
</Link>

// Optimistic updates
const addToWishlist = useMutation({
  mutationFn: (productId) => api.post('/wishlist/items', { productId }),
  onMutate: async (productId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['wishlist']);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['wishlist']);

    // Optimistically update
    queryClient.setQueryData(['wishlist'], (old) => ({
      ...old,
      items: [...old.items, { productId, addedAt: new Date() }]
    }));

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['wishlist'], context.previous);
  }
});
```

---

## Implementation Checklist

### Week 1: Core Functionality
- [ ] Create Wishlist data model and API endpoints
- [ ] Implement wishlist state management (Zustand)
- [ ] Design and build wishlist button component
- [ ] Add wishlist functionality to product cards
- [ ] Create wishlist page with grid/list views
- [ ] Implement add/remove animations
- [ ] Guest wishlist with localStorage

### Week 2: Advanced Features
- [ ] Price drop detection system (backend)
- [ ] Stock alert system (backend)
- [ ] Email notification templates
- [ ] Push notification setup
- [ ] User notification preferences
- [ ] Share wishlist functionality
- [ ] Cross-device sync

### Week 3: Polish & Testing
- [ ] Mobile responsive design
- [ ] Mini-wishlist dropdown
- [ ] Empty state design
- [ ] Loading states and skeletons
- [ ] Error handling
- [ ] Accessibility testing
- [ ] Performance optimization

### Week 4: Analytics & Monitoring
- [ ] Wishlist analytics dashboard (admin)
- [ ] Conversion tracking (wishlist → cart → purchase)
- [ ] Email open/click rates
- [ ] A/B testing setup
- [ ] User feedback collection

---

## Success Metrics & KPIs

**Adoption Metrics:**
- Wishlist button click rate: >15%
- Wishlist creation rate: >20% of users
- Average items per wishlist: 5-8 products

**Engagement Metrics:**
- Return visit rate from wishlist: >30%
- Wishlist → cart conversion: >25%
- Email open rate (price drop): >35%
- Email click-through rate: >15%

**Business Metrics:**
- Revenue from wishlist conversions
- Customer lifetime value increase
- Repeat purchase rate improvement
- Cart abandonment reduction

---

## Design Assets Needed

- [ ] Empty wishlist illustration (SVG)
- [ ] Heart icon (outline and filled states)
- [ ] Loading skeleton components
- [ ] Success/error toast icons
- [ ] Email notification templates (HTML)
- [ ] Push notification icons
- [ ] Social sharing preview images

---

**Next Steps:**
1. Review and approve this design specification
2. Create detailed component wireframes in Figma
3. Build component library in Storybook
4. Implement frontend components
5. Develop backend API and notification system
6. Conduct user testing
7. Launch MVP and monitor metrics

Would you like me to proceed with creating React component code for any of these designs?
