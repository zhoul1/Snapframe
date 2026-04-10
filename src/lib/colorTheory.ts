/** Color theory utilities for generating harmonious theme backgrounds */
import type { ExtractedPalette } from '../types';

function hexToHSL(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const lit = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = lit > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hue = ((b - r) / d + 2) / 6; break;
      case b: hue = ((r - g) / d + 4) / 6; break;
    }
  }
  return [hue * 360, sat * 100, lit * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const sl = s / 100, ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * sl;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = ll - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface ThemeVariant {
  label: string;
  background: string;
  textColor: string;
  subtitleColor: string;
  accentColor: string;
  backgroundType: 'gradient' | 'mesh' | 'solid' | 'noise';
  isDark: boolean;
}

/**
 * Given an extracted color palette, generate 5 theme suggestions that are
 * readable, bold, and derive naturally from the screenshot's colors.
 */
export function generatePaletteThemes(palette: ExtractedPalette): ThemeVariant[] {
  const [vh, vs, vl] = hexToHSL(palette.vibrant);
  const [dh, ds] = hexToHSL(palette.dominant);
  const [mh, ms] = hexToHSL(palette.muted);
  const [lvh, lvs, lvl] = hexToHSL(palette.lightVibrant);

  // Ensure vibrant accent is bright enough to read
  const safeAccent = hslToHex(vh, Math.min(vs + 10, 100), Math.max(vl, 55));
  const safeLightAccent = hslToHex(lvh, Math.min(lvs + 10, 100), Math.max(lvl, 65));

  return [
    // 1. Dark dominant — ultra-dark version of dominant hue, vibrant accent
    {
      label: 'From Photo',
      background: `linear-gradient(135deg, ${hslToHex(dh, Math.min(ds, 65), 5)} 0%, ${hslToHex(vh, Math.min(vs, 55), 9)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.68)',
      accentColor: safeAccent,
      backgroundType: 'gradient',
      isDark: true,
    },
    // 2. Muted deep — moody, sophisticated
    {
      label: 'Muted',
      background: `linear-gradient(150deg, ${hslToHex(mh, Math.min(ms, 45), 7)} 0%, ${hslToHex(dh, Math.min(ds, 40), 11)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.62)',
      accentColor: safeLightAccent,
      backgroundType: 'mesh',
      isDark: true,
    },
    // 3. Bold contrast — dark bg, light vibrant text, vibrant accent
    {
      label: 'Bold',
      background: `linear-gradient(135deg, ${hslToHex(vh, Math.min(vs, 70), 6)} 0%, ${hslToHex((vh + 35) % 360, Math.min(vs, 60), 9)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.72)',
      accentColor: hslToHex(lvh, Math.min(lvs + 15, 100), Math.max(lvl, 70)),
      backgroundType: 'noise',
      isDark: true,
    },
    // 4. Light clean — near-white tinted with dominant hue
    {
      label: 'Light',
      background: hslToHex(dh, Math.max(ds * 0.08, 4), 96),
      textColor: hslToHex(dh, Math.min(ds * 0.5, 45), 10),
      subtitleColor: hslToHex(dh, Math.min(ds * 0.3, 25), 38),
      accentColor: hslToHex(vh, Math.min(vs, 85), Math.min(vl, 42)),
      backgroundType: 'solid',
      isDark: false,
    },
    // 5. Warm mesh — vibrant gradient, ready-to-publish
    {
      label: 'Vivid',
      background: `linear-gradient(135deg, ${hslToHex(dh, Math.min(ds, 80), 8)} 0%, ${hslToHex(vh, Math.min(vs, 85), 12)} 50%, ${hslToHex((vh + 25) % 360, Math.min(vs, 70), 9)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.7)',
      accentColor: safeAccent,
      backgroundType: 'gradient',
      isDark: true,
    },
  ];
}

/**
 * Given an accent hex color, generate 6 beautiful background theme variants
 * using color harmony rules.
 */
export function generateThemeVariants(accentHex: string): ThemeVariant[] {
  const [h, s, l] = hexToHSL(accentHex);

  // Clamp saturation for generating dark backgrounds
  const darkS = Math.min(s, 80);

  const comp = (h + 180) % 360;     // complementary
  const ana1 = (h + 30) % 360;      // analogous +30
  const ana2 = (h - 30 + 360) % 360; // analogous -30
  const tri1 = (h + 120) % 360;     // triadic
  const split = (h + 150) % 360;    // split complementary

  return [
    // 1. Deep Monochromatic — very dark shade of the accent hue
    {
      label: 'Deep Mono',
      background: `linear-gradient(135deg, ${hslToHex(h, darkS, 6)} 0%, ${hslToHex(h, darkS, 14)} 50%, ${hslToHex(h, darkS * 0.7, 9)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.65)',
      accentColor: hslToHex(h, Math.min(s + 10, 100), Math.max(l, 60)),
      backgroundType: 'gradient',
      isDark: true,
    },
    // 2. Complementary — accent hue + opposite hue
    {
      label: 'Complement',
      background: `linear-gradient(135deg, ${hslToHex(h, darkS, 8)} 0%, ${hslToHex(comp, darkS * 0.8, 10)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.65)',
      accentColor: hslToHex(comp, Math.min(s + 10, 100), 65),
      backgroundType: 'mesh',
      isDark: true,
    },
    // 3. Analogous Warm — slide hue slightly to warm
    {
      label: 'Analogous',
      background: `linear-gradient(135deg, ${hslToHex(ana2, darkS, 7)} 0%, ${hslToHex(h, darkS, 11)} 50%, ${hslToHex(ana1, darkS * 0.8, 8)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.68)',
      accentColor: hslToHex(ana1, Math.min(s + 15, 100), 65),
      backgroundType: 'gradient',
      isDark: true,
    },
    // 4. Triadic — hue + 120° gives vibrant contrast
    {
      label: 'Triadic',
      background: `linear-gradient(135deg, ${hslToHex(h, darkS, 7)} 0%, ${hslToHex(tri1, darkS, 10)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.65)',
      accentColor: hslToHex(tri1, Math.min(s + 10, 100), 65),
      backgroundType: 'noise',
      isDark: true,
    },
    // 5. Split Complement — dark + split complementary
    {
      label: 'Split',
      background: `linear-gradient(135deg, ${hslToHex(h, darkS * 0.6, 9)} 0%, ${hslToHex(split, darkS * 0.7, 11)} 100%)`,
      textColor: '#ffffff',
      subtitleColor: 'rgba(255,255,255,0.65)',
      accentColor: hslToHex(split, Math.min(s + 15, 100), 65),
      backgroundType: 'gradient',
      isDark: true,
    },
    // 6. Light Clean — very light version for clean look
    {
      label: 'Light',
      background: hslToHex(h, Math.max(s * 0.08, 5), 97),
      textColor: hslToHex(h, darkS * 0.4, 12),
      subtitleColor: hslToHex(h, darkS * 0.3, 38),
      accentColor: hslToHex(h, Math.min(s, 90), Math.min(l, 45)),
      backgroundType: 'solid',
      isDark: false,
    },
  ];
}
