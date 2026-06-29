# Webiox Agency - Design System & Invoice Specifications

This document outlines the core design language, color palette, and structural constraints for the Webiox Agency invoice generator and output templates.

## 1. Brand Colors

The design relies on a carefully curated tri-color palette that conveys professionalism, modern tech aesthetics, and trust.

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Strong Teal/Blue** | `#0E5E64` | Primary brand color. Use for headers, primary buttons, major text highlights, and prominent UI borders. |
| **Mustard Yellow** | `#FFBF00` | Accent color. Use for call-to-actions, "Grand Total" highlighting, badges, and micro-animations to draw the eye. |
| **Light Gray** | `#F9FAFB` | Background color. Use for application backgrounds, subtle card backgrounds, and zebra-striping in tables. |

## 2. Typography

To maintain a premium and modern tech feel, stick to clean, geometric sans-serif fonts. 
* **Primary Font (Headings):** *Outfit*, *Space Grotesk*, or *Inter* (Bold/ExtraBold).
* **Secondary Font (Body/Data):** *Inter* or *Roboto* (Regular/Medium).
* Ensure high contrast against the `#F9FAFB` background using dark slate colors (e.g., `#1A202C`) for standard text.

## 3. Structural Layout Constraints (The Invoice Table)

Unlike standard retail or graphic design invoices, Webiox bills primarily for project milestones, flat-rate services, or custom web packages.

**CRITICAL CONSTRAINT:** The itemized billing table must **ONLY** contain the following two columns:
1. **Item Description** (Takes up 70-80% of the table width)
2. **Amount** (Right-aligned, takes up 20-30% of the table width)

*Do NOT include "Quantity" or "Unit Price" columns in the UI or the generated PDF.*

## 4. UI Aesthetics & Vibe

* **Glassmorphism:** Use subtle translucent backgrounds with background-blur for floating elements or sticky headers.
* **Shadows:** Use soft, highly diffused drop shadows (`box-shadow: 0 10px 30px rgba(14, 94, 100, 0.08)`) instead of harsh dark shadows.
* **Component Styling:** Input fields and cards should have generous padding (`12px` to `16px`), softly rounded corners (`8px` to `12px`), and border transitions that glow with the `#0E5E64` teal when focused.
* **Grand Total Emphasis:** The Grand Total section should be distinctly separated from the rest of the layout, possibly enclosed in a card with a `#0E5E64` background and `#FFBF00` text for maximum visibility.

## 5. Next Steps for Implementation
When implementing these designs in the Next.js application, update `app/create/invoice.module.css` and the React component state to remove the `qty` and `price` states, consolidating them strictly into `amount` and `desc`.
