# Moni Design System - Design Guidelines

This document defines the design standards, color palette, and layout guidelines for the application, specifically aligned with the "New UI" warm/brown aesthetic.

## 🎨 Core Colors

### Backgrounds
- **Main Dashboard Background**: `#fafaf9` (Stone 50) - Used as the primary background for the app.
- **Secondary Background**: `#f5f0ee` (Warm Beige) - Used for bottom gradients or section backgrounds.
- **Card Background**: `#ffffff` (White) or `#fafaf9` - Used for widgets and cards.

### Primary Accents (Browns)
- **Primary Text / Icons**: `#8D6E63` (Warm Coffee Brown) - Used for key icons (Wallet, Banknote) and primary action text.
- **Darker Text**: `#5D4037` - Used for strong text contrast (e.g., inside badges).
- **Soft Accent**: `#F5F0EE` - Used for button backgrounds (e.g., "Ver Todo", "Nueva Meta") and icon containers.
- **Borders**: `#EBE5E2` or `#e3ddd9` - Used for subtle borders on cards and badges.

## 📐 Layout Standards

### Page Structure
- **Max Width**: `max-w-5xl mx-auto`
  - All main page content must be constrained to this width to ensure consistency across large screens.
  - Example: `<main className="max-w-5xl mx-auto p-4 ...">`

### Page Backgrounds
- **Base Color**: `bg-[#fafaf9]` (Stone 50)
- **Header Gradient**: `bg-gradient-to-b from-[#f5f0ee] to-transparent`
  - This specific gradient should be used at the top of pages to provide a warm, subtle header effect.

### Headings & Numeric Scores

- **Main Page Headings (H1-style)**
  - Color: use **Darker Text** brown `#5D4037`.
  - Weight: `font-black`.
  - Size (responsive):
    - Mobile: `text-xl`.
    - Large screens (`md:` and up): `text-2xl`.
  - Examples: page titles such as "Resumen financiero", "Score Moni", "Mis Metas".

- **Section Subheadings (H2-style)**
  - Color: `#5D4037` or `#8D6E63` depending on hierarchy (darker for main section labels, lighter for secondary labels).
  - Weight: `font-bold`.
  - Size (recommended): `text-lg` on desktop, `text-base` on mobile.

- **Numeric Scores / Key Figures**
  - Color: use a **much darker brown** than standard headings for emphasis, e.g. `#3E2723` (very dark coffee brown).
  - Weight: `font-bold`.
  - Size (responsive, for primary KPIs):
    - Mobile: `text-4xl`.
    - Large screens (`md:` and up): `text-5xl`.
  - Apply to key metrics like Score Moni numbers, main balance amounts, or big percentage scores.


### ✨ Standard Page Classes (Recommended)

Use these CSS classes (defined in `src/index.css`) for consistent page layouts:

#### `.page-standard` - Background + Gradient
```tsx
<div className="page-standard min-h-screen pb-20">
  {/* Your page content */}
</div>
```
Includes:
- Background color: `#fafaf9`
- Gradient overlay via `::before` pseudo-element
- Proper z-index layering
- `overflow-x: hidden`

#### `.page-container` - Max-Width Content Container
```tsx
<div className="page-standard min-h-screen pb-20">
  <div className="page-container">
    {/* Constrained content */}
  </div>
</div>
```
Includes:
- `max-width: 64rem` (1024px / max-w-5xl)
- Centered with `margin: auto`
- Horizontal padding (`px-4`)
- Extra left padding on desktop for sidebar nav

## 🌈 Gradients

### Page Backgrounds
- **Notification History**:
  - Start: `#e6d5c3` (Rich Warm Brown)
  - Middle: `#e6d5c3` (via 25%)
  - End: `#f5f0ee` (Light Beige)
  - Class: `bg-gradient-to-b from-[#e6d5c3] via-[#e6d5c3] via-25% to-[#f5f0ee]`

### UI Elements
- **Subtle Overlays**: `bg-gradient-to-br from-gray-50/80 to-[#8D6E63]/10` - Used for Notification Banner background.
- **Neutral Icons**: `bg-gradient-to-br from-[#F5F0EE] to-[#EBE5E2]` - Used for notification icon backgrounds.

## 🏷️ Status & Badges

- **Standard Badge ("NUEVO", "Tip")**:
  - Background: `#EBE5E2`
  - Text: `#5D4037`
  - Border: `#e3ddd9`

## 📱 Semantic Usage

| Element | Color | Tailwind Class |
|---------|-------|----------------|
| **App Background** | Warm Stone | `bg-[#fafaf9]` |
| **Header Gradient** | Warm Beige Fade | `bg-gradient-to-b from-[#f5f0ee] to-transparent` |
| **Primary Action Button** | Warm Beige | `bg-[#F5F0EE] text-[#5D4037]` |
| **Active Icon** | Coffee Brown | `text-[#8D6E63]` |
| **Secondary Text** | Gray | `text-gray-500` or `text-gray-400` |
| **Link / Action Text** | Coffee Brown | `text-[#8D6E63]` |

## 🧩 Tailwind Configuration Reference (Suggested)

You can extend your `tailwind.config.js` with these colors:

```javascript
theme: {
  extend: {
    colors: {
      moni: {
        bg: '#fafaf9',
        warm: '#f5f0ee',
        primary: '#8D6E63',
        dark: '#5D4037',
        border: '#EBE5E2',
      }
    }
  }
}
```
