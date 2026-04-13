# SnapFrame JSON Schema Reference

SnapFrame projects are plain JSON files. You can create or edit them by hand, generate them with an AI tool, or export an existing project from the **JSON Editor** (toolbar → `JSON` button) and modify it.

---

## Table of Contents

1. [Top-Level Structure](#1-top-level-structure)
2. [meta](#2-meta)
3. [theme](#3-theme)
   - [Background](#31-background)
   - [Typography](#32-typography)
   - [Layout](#33-layout)
   - [Device](#34-device)
   - [Pills](#35-pills)
   - [Per-Resolution Overrides](#36-per-resolution-overrides)
4. [slides](#4-slides)
   - [Text Content](#41-text-content)
   - [Images](#42-images)
   - [Display Options](#43-display-options)
   - [Font Scale Fine-Tuning](#44-font-scale-fine-tuning)
   - [Slide-Level Overrides](#45-slide-level-overrides)
5. [Reference Tables](#5-reference-tables)
   - [Preset Themes](#51-preset-themes)
   - [Resolution IDs](#52-resolution-ids)
   - [Font Pairings](#53-font-pairings)
   - [Layout Modes](#54-layout-modes)
6. [Hello World Example](#6-hello-world-example)
7. [Multi-Slide Example](#7-multi-slide-example)
8. [Tips for AI Generation](#8-tips-for-ai-generation)

---

## 1. Top-Level Structure

```json
{
  "version": "1.1",
  "meta": { ... },
  "theme": { ... },
  "slides": [ ... ]
}
```

| Field    | Type     | Required | Description |
|----------|----------|----------|-------------|
| `version` | `string` | Yes | Always `"1.1"`. |
| `meta`   | object   | Yes | App metadata and export settings. |
| `theme`  | object   | Yes | Global visual theme applied to all slides. |
| `slides` | array    | Yes | One or more slide objects. Maximum 10 slides. |

---

## 2. `meta`

Controls app identity and which resolutions are exported.

```json
"meta": {
  "appName": "My App",
  "iconDataUrl": null,
  "platform": ["ios"],
  "resolutionPresets": ["iphone-69"],
  "customResolution": { "width": 1080, "height": 1920 }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `appName` | `string` | Yes | App name displayed in the toolbar and used for the exported filename. |
| `iconDataUrl` | `string \| null` | Yes | Base64 data URL of the app icon (e.g. `"data:image/png;base64,..."`). Set `null` to show no icon. |
| `platform` | `array` | Yes | Platforms to target. Values: `"ios"`, `"android"`. Can include both: `["ios", "android"]`. |
| `resolutionPresets` | `array` | Yes | One or more [Resolution IDs](#52-resolution-ids). At least one is required. |
| `customResolution` | `object \| undefined` | No | Required only when `"custom"` is in `resolutionPresets`. Object with `width` and `height` as integers. |

---

## 3. `theme`

The global theme drives background, colors, typography, layout, and the device frame for all slides unless a slide overrides it.

### 3.1 Background

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `background` | `string` | Yes | Any valid CSS color or gradient string. See examples below. |
| `backgroundType` | `string` | Yes | Rendering mode. One of: `"solid"`, `"gradient"`, `"mesh"`, `"noise"`. |

**`background` examples:**

```
"#1a1a2e"                                                    ← solid hex
"rgba(10, 10, 30, 1)"                                        ← solid rgba
"linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)"  ← gradient
```

**`backgroundType` values:**

| Value | Effect |
|-------|--------|
| `"solid"` | Plain fill using the `background` value. |
| `"gradient"` | CSS linear/radial gradient. Renders the `background` string as-is. |
| `"mesh"` | Adds animated blob shapes on top of the `background` color using the `accentColor`. |
| `"noise"` | Adds a subtle grain texture on top of the `background` value. |

---

### 3.2 Typography

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `textColor` | `string` | Yes | CSS color for the headline and eyebrow text. |
| `subtitleColor` | `string` | Yes | CSS color for feature bullets and subheadline text. |
| `accentColor` | `string` | Yes | CSS color for pills, icons, and decorative elements. |
| `fontPairing` | `string` | Yes | One of the [Font Pairing IDs](#53-font-pairings). |
| `headlineWeight` | `number` | No | Font weight for the headline. One of: `400`, `500`, `600`, `700`, `800`, `900`. Default: `700`. |
| `headlineItalic` | `boolean` | No | Italicize the headline. Default: `false`. |
| `shadowStyle` | `string` | Yes | CSS `box-shadow` value applied to the device frame. |

---

### 3.3 Layout

| Field | Type | Required | Range | Default | Description |
|-------|------|----------|-------|---------|-------------|
| `layoutMode` | `string` | Yes | — | `"header-above"` | See [Layout Modes](#54-layout-modes). |
| `textAlign` | `string` | Yes | — | `"center"` | Text alignment. One of: `"left"`, `"center"`, `"right"`. |
| `paddingTop` | `number` | Yes | `0.02–0.15` | `0.05` | Top padding as a fraction of card height. |
| `paddingBottom` | `number` | Yes | `0.02–0.15` | `0.04` | Bottom padding as a fraction of card height. |
| `contentGap` | `number` | Yes | `0.01–0.08` | `0.02` | Gap between text block and device as a fraction of card height. |

---

### 3.4 Device

| Field | Type | Required | Range | Default | Description |
|-------|------|----------|-------|---------|-------------|
| `deviceFrameStyle` | `string` | Yes | — | `"dark"` | Frame color. One of: `"dark"`, `"light"`, `"black"`, `"white"`. |
| `deviceSizeScale` | `number` | Yes | `0.38–0.75` | `0.58` | Device width as a fraction of the card width. |
| `deviceOffsetX` | `number` | Yes | `-0.25–0.25` | `0` | Horizontal offset as a fraction of card width. Positive = right. |
| `deviceOffsetY` | `number` | Yes | `-0.25–0.25` | `0` | Vertical offset as a fraction of card height. Positive = down. |
| `showDeviceSensor` | `boolean` | No | — | `true` | Show or hide the notch/Dynamic Island/punch-hole sensor cutout. |

---

### 3.5 Pills

Floating feature pills appear beside the device frame. They display the `featureBullets` from each slide.

| Field | Type | Required | Range | Default | Description |
|-------|------|----------|-------|---------|-------------|
| `pillSpread` | `number` | Yes | `0.0–1.0` | `0.6` | How far apart the pills spread vertically around the device. |
| `pillEdgeInset` | `number` | Yes | `0.02–0.12` | `0.04` | Side margin of pills from the card edge as a fraction of card width. |

---

### 3.6 Per-Resolution Overrides

Any theme field can be overridden for a specific resolution. This lets you adjust, for example, `deviceSizeScale` for iPad while keeping everything else the same.

```json
"resolutionOverrides": {
  "ipad-pro-13": {
    "deviceSizeScale": 0.65,
    "layoutMode": "device-above"
  }
}
```

The key is a [Resolution ID](#52-resolution-ids). The value is a partial `theme` object — only the fields you want to override.

---

## 4. `slides`

Each slide is one screenshot card. The array is ordered — slide 1 is first in the exported set.

```json
"slides": [
  {
    "id": "unique-id",
    "imageDataUrl": null,
    "header": "Your Headline",
    "eyebrow": "Introducing",
    "featureBullets": "Bullet one\nBullet two\nBullet three",
    "badges": "No Login, Offline, Free",
    "overrideBackground": null,
    "overrideTextColor": null,
    "extractedPalette": null,
    "deviceFrame": true,
    "pillMode": "pills",
    "fontScale": 1
  }
]
```

### 4.1 Text Content

| Field | Type | Required | Limit | Description |
|-------|------|----------|-------|-------------|
| `id` | `string` | Yes | — | Any unique string per slide. Use a short random string or a slug. |
| `header` | `string` | Yes | ~60 chars | Main headline displayed prominently. |
| `eyebrow` | `string` | Yes | ~50 chars | Small label above the headline (e.g. `"Introducing"`, `"New in v2"`). |
| `featureBullets` | `string` | Yes | 3 lines max | Newline-separated feature items. Shown as floating pills (`pillMode: "pills"`) or as a subheadline block (`pillMode: "subheadline"`). |
| `badges` | `string` | Yes | 5 badges max | Comma-separated short labels shown at the bottom of the card (e.g. `"100% Offline, No Login"`). Leave empty string `""` to hide. |

---

### 4.2 Images

All images are stored as base64 data URLs. For AI-generated projects leave them `null` — a placeholder will be shown and you can upload real screenshots in the UI.

| Field | Type | Description |
|-------|------|-------------|
| `imageDataUrl` | `string \| null` | The main screenshot image. Used for all device types unless a specific override is set. |
| `deviceImages` | `object \| undefined` | Per-device screenshot overrides. Keys: `"iphone"`, `"ipad"`, `"android-phone"`, `"android-tablet"`. Each value is a data URL string or `null`. Falls back to `imageDataUrl` if missing. |
| `extractedPalette` | `object \| null` | Auto-extracted color palette (written by the app when an image is uploaded). Set to `null` in generated JSON. |

**`deviceImages` example:**
```json
"deviceImages": {
  "iphone": "data:image/png;base64,...",
  "ipad": "data:image/png;base64,..."
}
```

---

### 4.3 Display Options

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `deviceFrame` | `boolean` | Yes | `true` | Show the device bezel around the screenshot. Set `false` to show a raw floating screenshot. |
| `pillMode` | `string` | Yes | `"pills"` | How to render `featureBullets`. `"pills"` = floating pills beside the device. `"subheadline"` = a text block below the headline. |
| `overrideBackground` | `string \| null` | Yes | `null` | Override the global `theme.background` for this slide only. Any CSS color string, or `null` to use the global theme. |
| `overrideTextColor` | `string \| null` | Yes | `null` | Override the global `theme.textColor` for this slide only. |

---

### 4.4 Font Scale Fine-Tuning

All scale values are multipliers. `1.0` = default size. These are applied on top of the theme's base font sizing.

| Field | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `fontScale` | `number` | `1.0` | `0.7–1.5` | Global font scale multiplier for the entire slide. |
| `eyebrowScale` | `number` | `1.0` | `0.5–2.0` | Scale for the eyebrow text only. |
| `headlineScale` | `number` | `1.0` | `0.5–2.0` | Scale for the headline only. |
| `sublineScale` | `number` | `1.0` | `0.5–2.0` | Scale for feature bullets / subheadline block only. |
| `pillScale` | `number` | `1.0` | `0.5–2.0` | Scale for floating pill text only. |
| `badgeScale` | `number` | `1.0` | `0.5–2.0` | Scale for bottom badge text only. |

---

### 4.5 Slide-Level Overrides

#### `themeOverrides`

Override any `theme` field for this slide only. Merged on top of the global theme.

```json
"themeOverrides": {
  "background": "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)",
  "backgroundType": "gradient",
  "textColor": "#1a1a1a"
}
```

#### `resolutionOverrides`

Override slide-specific properties (like font scale) for a particular resolution.

```json
"resolutionOverrides": {
  "ipad-pro-13": {
    "fontScale": 1.2,
    "header": "Same app, bigger screen"
  }
}
```

---

## 5. Reference Tables

### 5.1 Preset Themes

Pass the `id` as `theme.id`. Using a preset ID as a starting point and then overriding individual fields gives predictable results.

| ID | Name | Style |
|----|------|-------|
| `midnight` | Midnight | Dark purple gradient — classic App Store look |
| `aurora` | Aurora | Dark green/purple mesh — ethereal, cool |
| `vibrant` | Vibrant | Hot pink to violet gradient — bold and energetic |
| `carbon` | Carbon | Dark navy noise — techy, data-focused |
| `obsidian` | Obsidian | Near-black gradient with gold accents — premium |
| `ocean` | Ocean | Deep teal mesh — calm, professional |
| `frosted` | Frosted | Light blue-white solid — clean, minimal |
| `neon` | Neon | Near-black with bright pink accents — cyberpunk |
| `sage` | Sage | Dark green gradient — natural, health/wellness |
| `royal` | Royal | Deep indigo mesh with gold — luxury |
| `clean-light` | Clean | Light solid white — simple and universal |
| `sunrise` | Sunrise | Soft peach/orange gradient — warm, lifestyle |
| `custom` | Custom | Use this when fully overriding all colors. |

---

### 5.2 Resolution IDs

Use in `meta.resolutionPresets`. The first entry in the array is used for the live preview in the JSON editor.

| ID | Label | Platform | Width × Height |
|----|-------|----------|----------------|
| `iphone-69` | iPhone 6.9" | iOS | 1320 × 2868 px |
| `iphone-65` | iPhone 6.5" | iOS | 1284 × 2778 px |
| `iphone-55` | iPhone 5.5" | iOS | 1242 × 2208 px |
| `ipad-pro-13` | iPad Pro 13" | iOS | 2064 × 2752 px |
| `android-phone` | Android Phone | Android | 1080 × 1920 px |
| `android-tablet` | Android Tablet 7" | Android | 1200 × 1920 px |
| `custom` | Custom Size | Both | Defined by `meta.customResolution` |

> **App Store requirement:** `iphone-69` is required for iOS submissions. Always include it.

---

### 5.3 Font Pairings

| ID | Heading Font | Body Font | Character |
|----|-------------|-----------|-----------|
| `sora-inter` | Sora | Inter | Friendly, modern — good default |
| `playfair-dm` | Playfair Display | DM Sans | Elegant, editorial |
| `space-inter` | Space Grotesk | Inter | Technical, geometric |
| `inter-inter` | Inter | Inter | Clean, neutral — works everywhere |

---

### 5.4 Layout Modes

Controls how text and the device image are stacked.

| Value | Description |
|-------|-------------|
| `"header-above"` | Text block on top, device in the lower half, badges at the bottom. Default. |
| `"device-above"` | Device fills the top, text below it, badges at the bottom. Good for iPad. |
| `"overlay"` | Device is centered and fills most of the card. Text overlays the background at the top and bottom with a gradient fade. |

---

## 6. Hello World Example

A minimal, complete project file you can paste directly into the JSON Editor and hit **Apply & Close**.

```json
{
  "version": "1.1",
  "meta": {
    "appName": "Hello World",
    "iconDataUrl": null,
    "platform": ["ios"],
    "resolutionPresets": ["iphone-69"]
  },
  "theme": {
    "id": "midnight",
    "name": "Midnight",
    "background": "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    "backgroundType": "gradient",
    "textColor": "#ffffff",
    "subtitleColor": "rgba(255,255,255,0.7)",
    "accentColor": "#6C63FF",
    "shadowStyle": "0 20px 60px rgba(108,99,255,0.3)",
    "fontPairing": "sora-inter",
    "layoutMode": "header-above",
    "textAlign": "center",
    "paddingTop": 0.05,
    "paddingBottom": 0.04,
    "contentGap": 0.02,
    "deviceFrameStyle": "dark",
    "deviceSizeScale": 0.58,
    "deviceOffsetX": 0,
    "deviceOffsetY": 0,
    "pillSpread": 0.6,
    "pillEdgeInset": 0.04,
    "headlineWeight": 700,
    "headlineItalic": false
  },
  "slides": [
    {
      "id": "slide-1",
      "imageDataUrl": null,
      "header": "Hello, World",
      "eyebrow": "Welcome",
      "featureBullets": "Fast & lightweight\nWorks offline\nNo account needed",
      "badges": "Free, No Ads",
      "overrideBackground": null,
      "overrideTextColor": null,
      "extractedPalette": null,
      "deviceFrame": true,
      "pillMode": "pills",
      "fontScale": 1
    }
  ]
}
```

---

## 7. Multi-Slide Example

Three slides with per-slide background overrides and a mix of layout modes.

```json
{
  "version": "1.1",
  "meta": {
    "appName": "Focus Timer",
    "iconDataUrl": null,
    "platform": ["ios", "android"],
    "resolutionPresets": ["iphone-69", "android-phone"]
  },
  "theme": {
    "id": "carbon",
    "name": "Carbon",
    "background": "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    "backgroundType": "noise",
    "textColor": "#e2e8f0",
    "subtitleColor": "rgba(226,232,240,0.65)",
    "accentColor": "#38bdf8",
    "shadowStyle": "0 20px 60px rgba(56,189,248,0.25)",
    "fontPairing": "space-inter",
    "layoutMode": "header-above",
    "textAlign": "center",
    "paddingTop": 0.05,
    "paddingBottom": 0.04,
    "contentGap": 0.02,
    "deviceFrameStyle": "black",
    "deviceSizeScale": 0.58,
    "deviceOffsetX": 0,
    "deviceOffsetY": 0,
    "pillSpread": 0.6,
    "pillEdgeInset": 0.04,
    "headlineWeight": 600
  },
  "slides": [
    {
      "id": "slide-intro",
      "imageDataUrl": null,
      "header": "Deep Work, Simplified",
      "eyebrow": "Focus Timer",
      "featureBullets": "Pomodoro & custom timers\nFocus analytics\nDistraction blocker",
      "badges": "No Subscription, Offline",
      "overrideBackground": null,
      "overrideTextColor": null,
      "extractedPalette": null,
      "deviceFrame": true,
      "pillMode": "pills",
      "fontScale": 1
    },
    {
      "id": "slide-analytics",
      "imageDataUrl": null,
      "header": "See Your Progress",
      "eyebrow": "Analytics",
      "featureBullets": "Daily & weekly streaks\nHeatmap calendar\nExport to CSV",
      "badges": "",
      "overrideBackground": "linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)",
      "overrideTextColor": null,
      "extractedPalette": null,
      "deviceFrame": true,
      "pillMode": "subheadline",
      "fontScale": 1,
      "headlineScale": 1.1
    },
    {
      "id": "slide-widget",
      "imageDataUrl": null,
      "header": "Always in Reach",
      "eyebrow": "Home Screen Widget",
      "featureBullets": "Live timer on your home screen\nOne-tap to start\nSmall, medium & large",
      "badges": "iOS 17+, iPadOS 17+",
      "overrideBackground": null,
      "overrideTextColor": null,
      "extractedPalette": null,
      "deviceFrame": true,
      "pillMode": "pills",
      "fontScale": 0.95,
      "themeOverrides": {
        "layoutMode": "device-above",
        "deviceSizeScale": 0.62
      }
    }
  ]
}
```

---

## 8. Tips for AI Generation

When asking an AI (Claude, ChatGPT, etc.) to generate or modify a SnapFrame JSON:

**Effective prompts:**
- *"Add a third slide about the analytics feature using the same theme. Use `pillMode: subheadline`."*
- *"Change the theme to a warm sunrise palette. Keep all slides unchanged."*
- *"Create 4 slides for a meditation app. Use the `sage` theme. Each slide should highlight a different feature."*
- *"Make slide 2 have a different background — a coral-to-yellow gradient — while keeping the global theme."*

**Rules the AI must follow:**
- `version` must always be `"1.1"`.
- `meta.resolutionPresets` must contain at least one valid Resolution ID.
- `slides` must have at least 1 item and no more than 10.
- `featureBullets` uses `\n` (newline character) to separate items — not commas.
- `badges` uses `, ` (comma + space) to separate items — not newlines.
- `imageDataUrl` and `iconDataUrl` should be `null` unless you have actual base64 data.
- All numeric fraction values (padding, scale, offset) should stay within the documented ranges.
- `id` values in `slides` must be unique strings within the array.
- Every required field must be present — missing `version`, `meta`, `theme`, or `slides` will cause an import error.
