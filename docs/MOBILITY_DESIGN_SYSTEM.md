# Urban mobility design system

**Purpose:** A mobile-first visual language for smart-city and mobility products—landing pages, in-app UI, dashboards, and feature marketing—rooted in **clarity, editorial structure, and calm confidence**. It should feel **premium and approachable**, not corporate-SaaS flat, not cyber-dark, and **not** derivative of parking-app clichés (no dominant teal + lime “parking UI” formula).

**Brand posture:** Urban utility meets lifestyle—**product truth** (maps, routes, status) layered with **human context** (street life, transit, time-of-day). Think campaign-quality blocks: strong color fields, generous type, realistic device frames, and **abstract map grammar** (grids, soft routes, circular masks) as decoration—not noisy illustration.

---

## 1. Core principles

| Principle | In practice |
|-----------|-------------|
| **App-first** | UI chrome, touch targets, and hierarchy read like a polished native app; marketing pages reuse the same tokens. |
| **Bold hierarchy** | Short headlines (few words), large display sizes on mobile, body copy restrained and high contrast. |
| **Breathing room** | Section padding scales up with viewport; avoid dense grids of micro-copy. |
| **Soft depth** | Cards and floating panels use **light, wide shadows**; corners **rounded** consistently (see radii). |
| **Motion is calm** | Fade/slide 200–320ms, ease-out; no aggressive bounces or gimmicky parallax. |

---

## 2. Color system

### 2.1 Palette (exact values)

| Token | Hex | Role |
|-------|-----|------|
| **Deep Plum** | `#5B245F` | Primary brand, headers on light, key actions |
| **Mulberry** | `#8E3A72` | Secondary brand, hover/active bridges, mid accents |
| **Warm Coral** | `#F05D7A` | Highlights, secondary CTAs, “live” or human moments—**use in smaller areas** |
| **Dust Rose** | `#F3B6C6` | Soft fills, chips, illustration accents, warmth without neon |
| **Dusk Blue** | `#5E7FA3` | Map/info accent, trust, wayfinding—**balances plum** so the brand isn’t “all magenta” |
| **Soft Ivory** | `#FAF8F6` | Default page background |
| **Mist Grey** | `#E9E6EA` | Surfaces, dividers, input backgrounds |
| **Graphite** | `#222126` | Primary text |
| **Cloud Grey** | `#B9B3BC` | Secondary text, placeholders, disabled |

### 2.2 Semantic mapping (product UI)

- **Primary action:** Deep Plum; **hover/active:** Mulberry or a slightly darkened Plum (not a jarring hue jump).
- **Secondary action:** Outlined or Mist surface + Graphite text; hover tint with **Dusk Blue** or **Plum** at low opacity.
- **Accent / emphasis:** Warm Coral in **badges, links, small buttons**—avoid full-width coral banners (reads as discount/alert).
- **Information / map-adjacent:** Dusk Blue for map legends, info banners, “route” or “transit” cues.
- **Surfaces:** Ivory base, Mist for raised fields; **white** (`#fff`) allowed for cards and modals for crisp separation.

### 2.3 Gradients (sparingly)

Use only for **hero bands, large key art, or empty states**—never for every button.

1. **Plum → Mulberry:** `#5B245F` → `#8E3A72`  
2. **Mulberry → Coral:** `#8E3A72` → `#F05D7A`  
3. **Plum → Dusk:** `#5B245F` → `#5E7FA3`  

**Rule:** Keep gradient **subtle** (long angle, soft stops) or **contained** inside a shape (circle, pill, card top stripe). Pair with **Soft Ivory** or white foreground text only when contrast passes **WCAG AA** (test Plum-on-Ivory and white-on-gradient).

### 2.4 What to avoid

- **Neon pink / magenta dominance** (especially full screens).
- **EasyPark-adjacent cues:** default teal/green-as-hero, parking “P” centric identity, stock “car + pin” tropes as the only visuals.
- **Cyber noir** and heavy glassmorphism stacks.

---

## 3. Typography

### 3.1 Typefaces

Choose **one** primary family (all weights from the same stack):

- **Plus Jakarta Sans** (default in code tokens)—rounded, modern, good for UI + marketing.  
- Alternates: **Manrope**, **Inter** (less round but very legible), **General Sans** (if licensed).

**Load:** variable font where possible; subset Latin; `font-display: swap`.

### 3.2 Scale (mobile-first)

Use **clamp()** for fluid display type. Suggested scale (base 16px):

| Role | Mobile | Desktop (guideline) | Weight |
|------|--------|---------------------|--------|
| Display / hero | clamp(2rem, 7vw, 3.25rem) | up to ~3.25rem | 700–800 |
| H2 / section | clamp(1.5rem, 4vw, 2rem) | — | 700 |
| H3 / card title | 1.125–1.25rem | — | 600–700 |
| Body | 1rem | — | 400–500 |
| Small / meta | 0.8125–0.875rem | — | 500 |

**Headlines:** short (2–5 words when possible), **tight line-height** (~1.1–1.2), slight **negative letter-spacing** on large sizes.  
**Body:** line-height **1.5–1.65**, max line length **~65ch** on wide layouts.

---

## 4. Layout & composition

### 4.1 Landing / marketing

- **Section-based** scroll: hero → social proof or metric strip → feature blocks → deep dive → CTA/footer.
- **Hero:** full-bleed or large **brand block** (plum or gradient shape) + **single primary CTA**; optional **device mockup** offset (asymmetry with balance).
- **Editorial rhythm:** alternate **full-width color bands** with **Ivory + card** sections; use **asymmetry** (e.g. 40/60 split, mockup breaking the grid) but keep **one focal point** per section.
- **Spacing:** section padding **clamp(2.5rem, 8vw, 5rem)** vertical; consistent horizontal **1.25rem–1.5rem** mobile, **2rem+** tablet+.

### 4.2 App & dashboard

- **Sticky top bar** or bottom nav with **44px minimum** touch height.
- **Cards** as primary content containers; **one column** on mobile, **two** only when content is light.
- **Tables / lists:** zebra or divider using **Mist**; avoid heavy borders—prefer spacing + soft shadow.

---

## 5. UI components

### 5.1 Buttons

- **Primary:** filled Deep Plum, white text, **large radius** (`14–20px` or `9999px` pill for main CTA).
- **Secondary:** Mist or white stroke, Graphite text; hover **Plum outline** or light Plum tint.
- **Tertiary / text:** Graphite with Dusk Blue or Plum underline on press.
- **Touch:** min height **44px**, min horizontal padding **1.25rem**; clear `:focus-visible` ring (Dusk Blue or Plum).

### 5.2 Cards & surfaces

- Background: **white** or **Ivory**; border **1px** Mist or transparent; shadow **soft, diffuse** (low opacity, larger blur).
- **Radius:** `12px` compact, `16–20px` hero cards and bottom sheets.

### 5.3 Forms

- Inputs: **min 48px** height, **16px** font on mobile (prevents iOS zoom); Mist background; Plum or Dusk focus ring.
- Labels above fields; errors in **coral or accessible red**, not plum (reserve plum for brand).

### 5.4 Icons

- **Simple line icons** (1.5–2px stroke), rounded caps where possible; default **Graphite** or **Cloud**; active **Plum** or **Dusk**.

### 5.5 Micro-interactions

- Hover: **2–4px lift** (`translateY`) + shadow deepen (subtle).  
- Press: scale **0.98** or darken fill **~6%**.  
- Duration **180–240ms**, `ease-out`.

---

## 6. Graphic language

- **Abstract map layers:** faint grid, curved “route” strokes, **circular crops** over photography; opacity **low** so type stays king.
- **Organic blobs** behind mockups (Ivory + Dust Rose + Dusk at **5–12%** opacity).
- **Product in context:** phone UI comped onto **real street/transit** photos; **single** strong light source.
- **Depth:** layered cards + soft shadow; optional **very slow** drift on hero shapes (CSS or Lottie)—no busy loops.

---

## 7. Imagery & campaigns

- **Photography:** natural light, diverse urban settings, **motion implied** (walking, waiting, transit)—avoid sterile stock office.
- **Mockups:** realistic bezel, **one** screen story per composition; show **real UI** from the product.
- **Copy tone:** confident, short, human; pair utility (“Save routes”) with outcome (“Move through the city with less friction”).

---

## 8. Accessibility

- Text on **Ivory**: primary text **Graphite**; muted **Cloud** only above **~#76707d** equivalent if used for body (prefer darker secondary for long copy).
- **Focus states** always visible; gradient heroes need **overlay scrim** or **text on solid** if contrast fails.
- Respect **prefers-reduced-motion**: replace transforms with opacity-only or disable decorative motion.

---

## 9. Implementation in this repo

- **CSS tokens:** `frontend/src/styles/mobility-design-system.css` defines palette, semantic app variables, radii, shadows, typography, gradients, and touch-friendly form hints.
- **Global styles:** `frontend/src/index.css` imports the token file and retains component/layout rules; semantic names (`--color-primary`, etc.) map to this system so existing screens pick up the new direction.

---

## 10. Differentiation checklist (vs. generic parking / EasyPark-like patterns)

- [ ] **Hero color story** is **Plum + Dusk + Ivory**, not teal/green-first.  
- [ ] **Coral** is an accent, not the field color.  
- [ ] **Map aesthetic** references **abstract** layers, not a cliché “pin on car” stock scene as the only visual.  
- [ ] **Typography** is rounded sans, **editorial spacing**, not dense dashboard default.  
- [ ] **Motion** is calm; **shadows** are soft, not hard Material elevation stacks.

This system is intended to scale from **App Store screenshots** to **city partner decks** without looking like a template—or a clone of an existing mobility brand.
