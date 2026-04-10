import type { FontPairing, FontPairingId } from '../types';

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'sora-inter',
    label: 'Sora + Inter',
    headingFont: "'Sora', sans-serif",
    bodyFont: "'Inter', sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
  {
    id: 'playfair-dm',
    label: 'Playfair + DM Sans',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'DM Sans', sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
  {
    id: 'space-inter',
    label: 'Space Grotesk + Inter',
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Inter', sans-serif",
    headingWeight: 600,
    bodyWeight: 400,
  },
  {
    id: 'inter-inter',
    label: 'Inter (Both)',
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    headingWeight: 700,
    bodyWeight: 400,
  },
];

export const getFontPairing = (id: FontPairingId): FontPairing =>
  FONT_PAIRINGS.find((f) => f.id === id) ?? FONT_PAIRINGS[0];
