export type Platform = 'ios' | 'android';
export type BackgroundType = 'solid' | 'gradient' | 'mesh' | 'noise';
export type LayoutMode = 'header-above' | 'device-above' | 'overlay';
/** @deprecated — kept for backward-compat migration of old project files */
export type TextPosition = 'top' | 'bottom' | 'split';
export type FontPairingId = 'sora-inter' | 'playfair-dm' | 'space-inter' | 'inter-inter';
export type DeviceKind = 'iphone' | 'android-phone' | 'ipad' | 'android-tablet';
export type ThemeId =
  | 'midnight'
  | 'aurora'
  | 'clean-light'
  | 'vibrant'
  | 'carbon'
  | 'sunrise'
  | 'obsidian'
  | 'ocean'
  | 'frosted'
  | 'neon'
  | 'sage'
  | 'royal';
export type ResolutionId =
  | 'iphone-69'
  | 'iphone-65'
  | 'iphone-55'
  | 'ipad-pro-13'
  | 'ipad-pro-13-landscape'
  | 'android-phone'
  | 'android-tablet'
  | 'android-tablet-landscape'
  | 'custom';

export interface Resolution {
  id: ResolutionId;
  label: string;
  platform: Platform | 'both';
  width: number;
  height: number;
  aspectRatio: string;
}

export interface FontPairing {
  id: FontPairingId;
  label: string;
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  bodyWeight: number;
}

export interface Theme {
  id: ThemeId | 'custom';
  name: string;
  background: string;
  backgroundType: BackgroundType;
  textColor: string;
  subtitleColor: string;
  accentColor: string;
  shadowStyle: string;
  fontPairing: FontPairingId;

  // ── Layout ──
  layoutMode: LayoutMode;              // replaces old textPosition
  paddingTop: number;                  // 0.02–0.15, fraction of card height
  paddingBottom: number;               // 0.02–0.15, fraction of card height
  contentGap: number;                  // 0.01–0.08, fraction of H between text & device
  textAlign: 'center' | 'left' | 'right'; // text alignment (default 'center')

  // ── Device ──
  deviceFrameType?: 'realistic' | 'generic';
  deviceSizeScale: number;             // 0.38–0.75, fraction of card width
  deviceFrameStyle: 'dark' | 'light' | 'black' | 'white';
  deviceOffsetX: number;               // -0.25 to 0.25, fraction of W
  deviceOffsetY: number;               // -0.25 to 0.25, fraction of H

  // ── Per-Resolution Overrides ──
  resolutionOverrides?: Partial<Record<string, Partial<Omit<Theme, 'id' | 'resolutionOverrides'>>>>;

  // ── Sensor ──
  showDeviceSensor?: boolean;          // true to render notch/punch-hole, false to hide

  // ── Pills ──
  pillSpread: number;                  // 0.0–1.0, vertical spread of pills
  pillEdgeInset: number;               // 0.02–0.12, side inset as fraction of W

  // ── Headline ──
  headlineWeight?: number;             // 400/500/600/700/800/900
  headlineItalic?: boolean;

  // ── Backward compat — old field, only on legacy imports ──
  /** @deprecated — use layoutMode instead */
  textPosition?: TextPosition;
}

export interface ExtractedPalette {
  dominant: string;
  vibrant: string;
  muted: string;
  darkVibrant: string;
  lightVibrant: string;
  isDark: boolean;
}

export interface Slide {
  id: string;
  imageDataUrl: string | null;
  /** Per-device alternate screenshots (keyed by DeviceKind). Falls back to imageDataUrl. */
  deviceImages?: Partial<Record<DeviceKind, string>>;
  /** Big headline shown at top */
  header: string;
  /** Eyebrow / tagline shown above headline */
  eyebrow: string;
  /** Floating feature pills — one per line, up to 3 */
  featureBullets: string;
  /** Bottom pill badges (e.g. "100% Offline", "No Login") — comma separated */
  badges: string;
  overrideBackground: string | null;
  overrideTextColor: string | null;
  extractedPalette: ExtractedPalette | null;
  deviceFrame: boolean;
  pillMode: 'pills' | 'subheadline';
  fontScale: number;           // global multiplier, 0.7 to 1.5, default 1.0
  eyebrowScale?: number;       // per-element multiplier, default 1.0
  headlineScale?: number;      // per-element multiplier, default 1.0
  sublineScale?: number;       // per-element multiplier (bullets/subheadline), default 1.0
  pillScale?: number;          // per-element multiplier (floating pill text), default 1.0
  badgeScale?: number;         // per-element multiplier (bottom badges), default 1.0
  
  /** Per-resolution overrides for slide-specific properties (like scale) */
  resolutionOverrides?: Partial<Record<string, Partial<Slide>>>;
  
  /** Per-slide theme overrides — merged on top of global theme */
  themeOverrides?: Partial<Theme>;
}

export interface ProjectMeta {
  appName: string;
  iconDataUrl: string | null;
  platform: Platform[];
  resolutionPresets: ResolutionId[];
  customResolution?: { width: number; height: number };
}

export interface ProjectFile {
  version: string;
  meta: ProjectMeta;
  theme: Theme;
  slides: Slide[];
}

/** JSON theme template — importable / exportable for AI-generated themes */
export interface ThemeTemplate {
  name: string;
  description?: string;
  theme: Omit<Theme, 'id'> & { id?: string };
}

export interface ProjectStore {
  meta: ProjectMeta;
  theme: Theme;
  slides: Slide[];
  activeSlideId: string | null;
  selectedResolutions: ResolutionId[];
  activeResolutionScope: 'global' | string;
  themeScope: 'global' | 'slide';

  setMeta: (meta: Partial<ProjectMeta>) => void;
  setThemeScope: (scope: 'global' | 'slide') => void;
  setTheme: (theme: Partial<Theme>) => void;
  setActiveResolutionScope: (scope: 'global' | string) => void;
  addSlide: () => void;
  updateSlide: (id: string, data: Partial<Slide>) => void;
  removeSlide: (id: string) => void;
  reorderSlides: (from: number, to: number) => void;
  setActiveSlide: (id: string) => void;
  importProject: (json: ProjectFile) => void;
  exportProject: () => ProjectFile;
  applyPaletteToTheme: (palette: ExtractedPalette) => void;
  importThemeTemplate: (template: ThemeTemplate) => void;
  exportThemeTemplate: () => ThemeTemplate;
  /** Update theme overrides for a specific slide */
  setSlideTheme: (slideId: string, overrides: Partial<Theme>) => void;
  /** Copy current theme + active slide's overrides to all slides */
  applyThemeToAllSlides: () => void;
  /** Clear theme overrides from a specific slide (revert to global) */
  clearSlideTheme: (slideId: string) => void;
  /** Reset the entire project to defaults */
  createNewProject: () => void;
}
