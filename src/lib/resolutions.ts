import type { Resolution, ResolutionId } from '../types';

export const RESOLUTIONS: Resolution[] = [
  {
    id: 'iphone-69',
    label: 'iPhone 6.9" (required)',
    platform: 'ios',
    width: 1320,
    height: 2868,
    aspectRatio: '9:19.5',
  },
  {
    id: 'iphone-65',
    label: 'iPhone 6.5"',
    platform: 'ios',
    width: 1284,
    height: 2778,
    aspectRatio: '9:19.5',
  },
  {
    id: 'iphone-55',
    label: 'iPhone 5.5"',
    platform: 'ios',
    width: 1242,
    height: 2208,
    aspectRatio: '9:16',
  },
  {
    id: 'ipad-pro-13',
    label: 'iPad Pro 13"',
    platform: 'ios',
    width: 2064,
    height: 2752,
    aspectRatio: '3:4',
  },
  {
    id: 'android-phone',
    label: 'Android Phone',
    platform: 'android',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
  },
  {
    id: 'android-tablet',
    label: 'Android Tablet 7"',
    platform: 'android',
    width: 1200,
    height: 1920,
    aspectRatio: '10:16',
  },
  {
    id: 'custom',
    label: 'Custom Size',
    platform: 'both',
    width: 1080,
    height: 1920,
    aspectRatio: 'custom',
  },
];

export const getResolution = (id: ResolutionId): Resolution | undefined =>
  RESOLUTIONS.find((r) => r.id === id);

export function getResolutionWithCustom(
  id: ResolutionId,
  customDims?: { width: number; height: number }
): Resolution | undefined {
  if (id === 'custom') {
    const w = customDims?.width ?? 1080;
    const h = customDims?.height ?? 1920;
    return { id: 'custom', label: 'Custom Size', platform: 'both', width: w, height: h, aspectRatio: 'custom' };
  }
  return RESOLUTIONS.find((r) => r.id === id);
}

export const DEFAULT_RESOLUTION_ID: ResolutionId = 'iphone-69';
