# Moni Design System - Color Palette

This document defines the color palette used across the application, specifically aligned with the "New UI" warm/brown aesthetic.

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
