# SnapFrame — App Store Screenshot Builder
### Product Specification & Claude Code Development Guide
> Version 1.0 · Open Source · Self-Hostable

---

## 1. Project Overview

**SnapFrame** is a locally-runnable, open-source web application that turns raw app screenshots into polished, App Store / Google Play-ready marketing assets — in minutes, not hours.

Developers and indie makers upload their raw screenshots, provide a headline and subtitle, and SnapFrame outputs professionally-styled screenshot cards with device frames, beautiful backgrounds, and typography — ready to export at any platform's required resolution.

### Core Philosophy
- **Zero cloud dependency** — runs entirely in the browser or on localhost
- **Zero lock-in** — export as PNG/JPG, own your assets
- **Opinionated but flexible** — sensible defaults, full customization available
- **Open source** — MIT licensed, community-driven

---

## 2. Target Users

| User | Pain Point |
|---|---|
| Indie developers (solo founders) | No design team; Figma templates are tedious |
| Mobile app studios | Need to generate assets for multiple apps quickly |
| Startup founders | App store screenshots are an afterthought |
| Open source developers | Need polished assets without paid tools |

---

## 3. Feature Scope (v1.0)

### 3.1 Project Setup
- App name input
- App icon upload (PNG, used in header badge)
- Platform selection: **iOS App Store** / **Google Play** / **Both**

### 3.2 Screenshot Slots
- Add up to **10 screenshot slots** (one per store screenshot)
- Per slot:
  - Raw screenshot upload (PNG/JPG/WebP)
  - Header text (e.g. "Edit PDFs Offline")
  - Subtitle text (e.g. "No account. No internet. Just your files.")
  - Optional: override background color/gradient for this slide

### 3.3 Resolution Presets
User selects one or more output sizes:

| Platform | Size | Aspect Ratio |
|---|---|---|
| iPhone 6.9" (required) | 1320 × 2868 | 9:19.5 |
| iPhone 6.5" | 1284 × 2778 | 9:19.5 |
| iPhone 5.5" | 1242 × 2208 | 9:16 |
| iPad Pro 13" | 2064 × 2752 | 3:4 |
| Android Phone | 1080 × 1920 | 9:16 |
| Android Tablet 7" | 1200 × 1920 | — |
| Custom | user-defined W × H | — |

### 3.4 Styling System
- **Theme selector**: 6–8 built-in themes (dark gradient, light clean, vibrant, minimal white, midnight, aurora)
- **Background options**: solid color, linear gradient, mesh gradient, subtle noise texture
- **Device frame**: optional phone/tablet frame overlay on the screenshot
- **Text position**: top / bottom / split (header top, subtitle bottom)
- **Font pairing**: 3–4 curated pairings (e.g. Sora + Inter, Playfair + DM Sans)
- **Accent color**: single brand color picker used for highlights

### 3.5 Export
- Export **individual** slide as PNG
- Export **all slides** as a ZIP (organized by platform/size)
- Export at selected resolution preset(s)
- Lossless PNG by default; optional JPG quality slider

### 3.6 Persistence
- **Project save/load** via JSON file (import/export project config)
- No database, no backend — everything is browser-side

---

## 4. Technical Architecture

### 4.1 Stack

```
Frontend:          React 18 + TypeScript
Styling:           Tailwind CSS v3
Canvas Rendering:  Konva.js (React-Konva) OR html-to-image + DOM canvas
Export:            html-to-image / canvas.toBlob → FileSaver.js
ZIP:               JSZip
State:             Zustand (lightweight, no boilerplate)
Routing:           None (single-page app)
Build:             Vite
Package Manager:   pnpm
```

> **Why Konva vs html-to-image?**  
> Use **html-to-image** approach (render real DOM → capture). It's simpler, CSS-driven, and lets you use standard React components for the canvas. Konva is overkill unless you need drag-and-drop canvas editing (v2 feature).

### 4.2 Rendering Strategy

```
ScreenshotCard (React component)
  └── BackgroundLayer     (CSS gradient / solid / mesh)
      └── DeviceFrame     (SVG or PNG overlay, optional)
          └── AppScreen   (user's raw screenshot, fitted)
      └── TextBlock
          ├── HeaderText
          └── SubtitleText
      └── AppBadge        (icon + app name, optional)
```

The `ScreenshotCard` component renders at **screen size** for preview, then re-renders at **full export resolution** off-screen using a hidden high-res DOM node before capture.

### 4.3 Project File Format

```json
{
  "version": "1.0",
  "meta": {
    "appName": "RevPDF",
    "iconDataUrl": "data:image/png;base64,...",
    "platform": ["ios", "android"],
    "resolutionPresets": ["iphone-69", "android-phone"]
  },
  "theme": {
    "id": "midnight",
    "accentColor": "#6C63FF",
    "fontPairing": "sora-inter",
    "textPosition": "bottom",
    "backgroundType": "gradient",
    "backgroundValue": "linear-gradient(135deg, #0f0c29, #302b63, #24243e)"
  },
  "screenshots": [
    {
      "id": "slide-1",
      "imageDataUrl": "data:image/png;base64,...",
      "header": "Edit PDFs Offline",
      "subtitle": "No account. No internet. Just your files.",
      "overrideBackground": null
    }
  ]
}
```

---

## 5. Folder Structure

```
snapframe/
├── public/
│   ├── frames/                  # Device frame PNGs (phone, tablet)
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx      # Left panel: project config + slides list
│   │   │   ├── Canvas.tsx       # Center: live preview
│   │   │   └── Toolbar.tsx      # Top bar: export, theme, resolution
│   │   ├── editor/
│   │   │   ├── SlideEditor.tsx  # Per-slide config panel
│   │   │   ├── ThemePicker.tsx  # Theme + color + font selectors
│   │   │   └── ResolutionPicker.tsx
│   │   ├── preview/
│   │   │   ├── ScreenshotCard.tsx   # THE core render component
│   │   │   ├── BackgroundLayer.tsx
│   │   │   ├── DeviceFrame.tsx
│   │   │   └── TextBlock.tsx
│   │   └── ui/                  # Reusable primitives (Button, Input, etc.)
│   ├── store/
│   │   └── useProjectStore.ts   # Zustand store (entire app state)
│   ├── hooks/
│   │   ├── useExport.ts         # Export logic (html-to-image + JSZip)
│   │   └── useProjectIO.ts      # Save/load JSON project file
│   ├── lib/
│   │   ├── themes.ts            # Theme definitions
│   │   ├── resolutions.ts       # Resolution preset definitions
│   │   ├── fonts.ts             # Font pairing definitions
│   │   └── frameAssets.ts       # Device frame metadata
│   ├── types/
│   │   └── index.ts             # All TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── README.md
├── LICENSE                      # MIT
└── CONTRIBUTING.md
```

---

## 6. Key Component Specs

### 6.1 `ScreenshotCard.tsx`
The most important component. Must:
- Accept a `slide` object + `theme` object + `resolution` as props
- Render entirely with CSS (no canvas API) for the preview
- Support a `scale` prop to render at preview size vs export size
- Be **self-contained**: no external data fetching, pure render

```tsx
interface ScreenshotCardProps {
  slide: Slide;
  theme: Theme;
  resolution: Resolution;
  scale?: number;       // 1 = full export size, 0.25 = preview
  showFrame?: boolean;
}
```

### 6.2 `useExport.ts`
```ts
// Renders the hidden full-res ScreenshotCard, captures via html-to-image
// Returns PNG Blob per slide, then ZIPs all for bulk export
exportSlide(slideId: string): Promise<Blob>
exportAll(): Promise<void>   // triggers ZIP download
```

### 6.3 `useProjectStore.ts` (Zustand)
```ts
interface ProjectStore {
  meta: ProjectMeta;
  theme: Theme;
  slides: Slide[];
  activeSlideId: string | null;
  selectedResolutions: ResolutionId[];

  // Actions
  setMeta(meta: Partial<ProjectMeta>): void;
  setTheme(theme: Partial<Theme>): void;
  addSlide(): void;
  updateSlide(id: string, data: Partial<Slide>): void;
  removeSlide(id: string): void;
  reorderSlides(from: number, to: number): void;
  setActiveSlide(id: string): void;
  importProject(json: ProjectFile): void;
  exportProject(): ProjectFile;
}
```

---

## 7. Built-in Themes (v1.0)

| ID | Name | Style |
|---|---|---|
| `midnight` | Midnight | Deep navy-to-black gradient, white text |
| `aurora` | Aurora | Purple-green mesh gradient, glassmorphism |
| `clean-light` | Clean Light | White background, dark text, minimal |
| `vibrant` | Vibrant | Bold saturated gradient (brand-colored) |
| `carbon` | Carbon | Dark gray with subtle noise texture |
| `sunrise` | Sunrise | Warm peach-to-pink, soft shadow text |

Each theme exposes: `background`, `textColor`, `subtitleColor`, `accentColor`, `shadowStyle`.

---

## 8. Device Frame Assets

Store as transparent PNG overlays in `public/frames/`:
- `iphone-15-pro.png` — portrait
- `iphone-15-pro-landscape.png`
- `android-pixel8.png`
- `ipad-pro-13.png`

Source: Use open-source device frames from [Facebook Design Device Images](https://design.facebook.com/toolsandresources/devices/) or similar CC0 sources. Document the source in `ATTRIBUTIONS.md`.

---

## 9. Export Behavior

1. User clicks "Export All"
2. For each selected resolution preset:
   - For each slide:
     - Render `ScreenshotCard` into a hidden off-screen `div` at exact pixel dimensions
     - Capture with `html-to-image` → PNG Blob
     - Add to ZIP as `{resolution}/{slide-index}-{slide-header-slug}.png`
3. Trigger ZIP download as `{appName}-screenshots.zip`

---

## 10. Self-Hosting & Running Locally

```bash
# Clone
git clone https://github.com/yourusername/snapframe.git
cd snapframe

# Install dependencies
pnpm install

# Dev server
pnpm dev
# → http://localhost:5173

# Production build (static files, host anywhere)
pnpm build
# → dist/ folder, deployable to Netlify / Vercel / Nginx / GitHub Pages
```

No environment variables required. No backend. No database.

---

## 11. Open Source Guidelines

### License
MIT — fully permissive. Users can self-host, modify, redistribute.

### README Must Include
- What it is (1 sentence)
- Screenshot of the UI
- Quick start (4 commands)
- Features list
- Contributing guide link
- License

### CONTRIBUTING.md Must Include
- Code style: ESLint + Prettier config included
- Commit convention: Conventional Commits (`feat:`, `fix:`, `docs:`)
- How to add a new theme (point to `src/lib/themes.ts`)
- How to add a new device frame
- PR checklist

### `.gitignore`
```
node_modules/
dist/
.DS_Store
*.local
```

---

## 12. v2 Roadmap (Post-Launch)

- [ ] Drag-to-reorder slides
- [ ] Text position drag handles on canvas
- [ ] Custom font upload
- [ ] AI headline suggestions (local Ollama or Claude API, opt-in)
- [ ] Batch mode: import CSV of headlines, auto-generate all slides
- [ ] Figma plugin version
- [ ] Dark/light mode for the editor UI itself
- [ ] Animation preview (simulated swipe between slides)
- [ ] Template marketplace (community-submitted themes)

---

## 13. Claude Code Prompt Scaffolding

When you pass this to Claude Code, use this as the kickoff prompt:

```
You are building "SnapFrame" — a self-hostable React + TypeScript web app for 
generating App Store / Google Play screenshot assets.

Read SNAPFRAME_SPEC.md fully before writing any code.

Start with:
1. Scaffold the Vite + React + TypeScript + Tailwind + pnpm project
2. Set up Zustand store with all types from the spec
3. Build the ScreenshotCard component first — it is the core
4. Add the Sidebar and ThemePicker
5. Implement export with html-to-image + JSZip

Use the folder structure exactly as defined in Section 5.
Use TypeScript strictly (no `any`).
Prefer named exports.
Keep components small and single-responsibility.
Write comments for non-obvious logic.
```

---

*SnapFrame Spec v1.0 — authored for open-source release*
