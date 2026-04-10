import type { ExtractedPalette } from '../types';

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function colorDistance(a: RGBColor, b: RGBColor): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2)
  );
}

function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

// Sample pixels from an ImageData using k-means style clustering
function sampleColors(imageData: ImageData, sampleSize = 64): RGBColor[] {
  const { data, width, height } = imageData;
  const colors: RGBColor[] = [];
  const step = Math.max(1, Math.floor((width * height) / sampleSize));

  for (let i = 0; i < width * height; i += step) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    // Skip transparent or near-white / near-black pixels
    if (a < 128) continue;
    colors.push({ r, g, b });
  }
  return colors;
}

// Cluster colors using a simplified median cut
function quantizeColors(colors: RGBColor[], numColors: number): RGBColor[] {
  if (colors.length === 0) return [];

  const buckets: RGBColor[][] = [colors];

  while (buckets.length < numColors) {
    // Find the bucket with the largest color range to split
    let maxRange = -1;
    let splitIdx = 0;
    buckets.forEach((bucket, i) => {
      const rs = bucket.map((c) => c.r);
      const gs = bucket.map((c) => c.g);
      const bs = bucket.map((c) => c.b);
      const range =
        Math.max(...rs) - Math.min(...rs) +
        (Math.max(...gs) - Math.min(...gs)) +
        (Math.max(...bs) - Math.min(...bs));
      if (range > maxRange) {
        maxRange = range;
        splitIdx = i;
      }
    });

    const bucket = buckets[splitIdx];
    const rs = bucket.map((c) => c.r);
    const gs = bucket.map((c) => c.g);
    const bs = bucket.map((c) => c.b);
    const rRange = Math.max(...rs) - Math.min(...rs);
    const gRange = Math.max(...gs) - Math.min(...gs);
    const bRange = Math.max(...bs) - Math.min(...bs);
    const sortKey: keyof RGBColor =
      rRange >= gRange && rRange >= bRange ? 'r' : gRange >= bRange ? 'g' : 'b';

    bucket.sort((a, b) => a[sortKey] - b[sortKey]);
    const mid = Math.floor(bucket.length / 2);
    buckets.splice(splitIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
  }

  return buckets.map((bucket) => {
    const avg = (key: keyof RGBColor) =>
      Math.round(bucket.reduce((sum, c) => sum + c[key], 0) / bucket.length);
    return { r: avg('r'), g: avg('g'), b: avg('b') };
  });
}

export async function extractPaletteFromDataUrl(dataUrl: string): Promise<ExtractedPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Downsample for performance
      const maxDim = 200;
      const scale = Math.min(maxDim / img.width, maxDim / img.height);
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const samples = sampleColors(imageData, 128);
      const clusters = quantizeColors(samples, 8);

      // Sort clusters by various criteria
      const withMeta = clusters.map((c) => ({
        ...c,
        luminance: getLuminance(c.r, c.g, c.b),
        saturation: getSaturation(c.r, c.g, c.b),
      }));

      // Dominant = most representative (largest bucket would be more accurate,
      // but approximated by median cluster)
      const dominant = withMeta[Math.floor(withMeta.length / 2)];

      // Vibrant = high saturation, mid luminance
      const vibrant =
        [...withMeta].sort(
          (a, b) =>
            b.saturation - a.saturation +
            Math.abs(0.5 - a.luminance) -
            Math.abs(0.5 - b.luminance)
        )[0] ?? dominant;

      // Muted = lower saturation
      const muted =
        [...withMeta].sort((a, b) => a.saturation - b.saturation)[0] ?? dominant;

      // Dark vibrant = dark + saturated, Light vibrant = bright + saturated
      const darkVibrant =
        [...withMeta]
          .filter((c) => c.luminance < 0.3)
          .sort((a, b) => b.saturation - a.saturation)[0] ?? withMeta[0];

      const lightVibrant =
        [...withMeta]
          .filter((c) => c.luminance > 0.6)
          .sort((a, b) => b.saturation - a.saturation)[0] ?? withMeta[withMeta.length - 1];

      const isDark = dominant.luminance < 0.4;

      resolve({
        dominant: rgbToHex(dominant.r, dominant.g, dominant.b),
        vibrant: rgbToHex(vibrant.r, vibrant.g, vibrant.b),
        muted: rgbToHex(muted.r, muted.g, muted.b),
        darkVibrant: rgbToHex(darkVibrant.r, darkVibrant.g, darkVibrant.b),
        lightVibrant: rgbToHex(lightVibrant.r, lightVibrant.g, lightVibrant.b),
        isDark,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/** Build a gradient background from extracted palette colors */
export function buildGradientFromPalette(palette: ExtractedPalette): string {
  const { darkVibrant, dominant, vibrant } = palette;
  // Ensure we have visually distinct stops
  const c1 = darkVibrant;
  const c2 = dominant;
  const c3 = vibrant;
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`;
}

/** Check if two colors are too similar (distance < threshold) */
export function colorsAreSimilar(hex1: string, hex2: string, threshold = 60): boolean {
  const parse = (hex: string): RGBColor => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  };
  return colorDistance(parse(hex1), parse(hex2)) < threshold;
}
