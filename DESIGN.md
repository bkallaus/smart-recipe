# Design System: The Editorial Kitchen



## 1. Overview & Creative North Star

**The Creative North Star: "The Modern Heirloom"**



This design system rejects the "utilitarian app" aesthetic in favor of a "High-End Editorial" experience. It is inspired by the tactile, immersive quality of luxury cookbooks and heritage culinary journals. We break the "template" look by treating the screen as a digital canvas—using intentional asymmetry, generous white space (macro-typography), and layered surfaces rather than rigid grids.



The vibe is **professional yet homey**: the precision of a Michelin-starred kitchen met with the warmth of a sun-drenched breakfast nook. We prioritize appetite appeal through sophisticated tonal depth, ensuring every recipe feels like a curated piece of art.



---



## 2. Colors & Surface Philosophy

The palette is built on a foundation of organic neutrals, punctuated by an appetizing "Saffron" primary and a "Garden Sage" secondary.



### The "No-Line" Rule

**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning content. Boundaries must be defined solely through background color shifts. Use `surface-container-low` for sections sitting on a `surface` background. This creates a soft, sophisticated transition that feels high-end and intentional rather than "engineered."



### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers—stacked sheets of fine, heavy-weight paper.

- **Layer 1 (The Table):** `surface` (#fff8f3) as the global canvas.

- **Layer 2 (The Plate):** `surface-container-low` (#faf2ec) for primary content areas.

- **Layer 3 (The Garnish):** `surface-container-lowest` (#ffffff) for high-focus cards or interactive elements to create a natural "lift."



### The "Glass & Gradient" Rule

To add "soul" to the UI:

- **Floating Elements:** Use `surface` colors at 80% opacity with a `backdrop-blur` of 12px for top navigation bars or floating action buttons.

- **Signature Textures:** For main CTAs and Hero backgrounds, use a subtle linear gradient transitioning from `primary` (#a83a19) to `primary-container` (#ffad96) at a 135-degree angle. This mimics the natural variation of organic ingredients.



---



## 3. Typography: The Editorial Voice

Our typography pairing is the heartbeat of the "Modern Heirloom" aesthetic.



* **Display & Headlines (Noto Serif):** The authoritative, elegant voice. Use `display-lg` for recipe titles to create a high-contrast editorial feel. The serif's stroke variation evokes a sense of tradition and "home."

* **Titles & Body (Manrope):** The functional, modern counterpart. Manrope’s geometric clarity ensures legibility during active cooking. Use `body-lg` for ingredients and instructions to maintain a clean, professional standard.



**Typographic Hierarchy:**

- **Hero Recipe Title:** `display-lg` / `on-surface`

- **Section Headers:** `headline-sm` / `primary`

- **Sub-headers:** `title-md` / `on-surface-variant`

- **Instructional Text:** `body-lg` / `on-surface`



---



## 4. Elevation & Depth

We move away from the "shadow-heavy" look of 2010s material design, opting for **Tonal Layering**.



* **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` card on a `surface-container-low` section. The subtle shift in hex code provides enough contrast for the eye without visual clutter.

* **Ambient Shadows:** If a "floating" effect is required (e.g., a modal or a primary action button), use an extra-diffused shadow: `box-shadow: 0 12px 32px rgba(54, 50, 44, 0.06);`. Notice the shadow is tinted with the `on-surface` color (#36322c) rather than black.

* **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use `outline-variant` (#b8b1a9) at 20% opacity. **Never use 100% opaque borders.**



---



## 5. Components



### Buttons

- **Primary:** Gradient-filled (`primary` to `primary-container`), `rounded-full` (9999px) for a soft, approachable feel. Typography: `label-md` in `on-primary`.

- **Secondary:** `surface-container-highest` background with `on-surface` text. No border.

- **Tertiary:** Text-only in `primary` weight, using `6` (1.5rem) horizontal padding to maintain a large hit area.



### Recipe Cards & Lists

- **Forbid Divider Lines:** Use `8` (2rem) of vertical white space from the Spacing Scale to separate list items.

- **Card Styling:** Use `lg` (1rem) corner radius. For ingredients, use a `surface-container-low` background with an asymmetrical layout (e.g., image bleeding off the left edge).



### Input Fields

- **Modern Input:** A solid background of `surface-container-highest` with a bottom-only "Ghost Border" (20% `outline`).

- **Interaction:** On focus, the bottom border transitions to 100% `primary` opacity.



### Selection Chips (Filters)

- **Unselected:** `surface-container-high` background with `on-surface-variant` text.

- **Selected:** `secondary` background with `on-secondary` text. The green (`secondary`) acts as a "fresh" signal for dietary filters (e.g., "Vegan," "Gluten-Free").



### Contextual Components: The "Cooking Mode" Timer

- Use a `glassmorphism` overlay (`surface` @ 70% + blur) that sits at the bottom of the screen.

- Large `display-sm` numerals to ensure visibility from a distance while the phone is on the counter.



---



## 6. Do's and Don'ts



### Do

* **Do** use asymmetrical spacing. A wider left margin (e.g., `10` or `12`) with a tighter right margin creates an editorial "magazine" feel.

* **Do** use `primary_fixed_dim` for subtle background accents behind food photography.

* **Do** prioritize "Breathing Room." If in doubt, increase the spacing by one step on the scale.



### Don't

* **Don't** use pure black (#000000) for text. Use `on-surface` (#36322c) to keep the vibe warm and accessible.

* **Don't** use standard 1px dividers between recipe instructions. Use `surface-container-low` blocks or simple whitespace.

* **Don't** use sharp corners. Everything should have at least a `DEFAULT` (0.5rem) radius to feel "homey."