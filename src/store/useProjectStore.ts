import { create, useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { get, set as idbSet, del } from 'idb-keyval';
import type { ProjectStore, ProjectMeta, Slide, ExtractedPalette, ResolutionId, Theme, ThemeTemplate, ProjectFile } from '../types';
import { DEFAULT_THEME } from '../lib/themes';
import { buildGradientFromPalette } from '../lib/colorExtractor';

function makeSlide(): Slide {
  return {
    id: Math.random().toString(36).slice(2),
    imageDataUrl: null,
    header: 'Your Feature Here',
    eyebrow: 'Introducing',
    featureBullets: 'Fast & offline\nNo account needed\nPrivate by default',
    badges: '100% Offline, No Login, No Subscription',
    overrideBackground: null,
    overrideTextColor: null,
    extractedPalette: null,
    deviceFrame: true,
    pillMode: 'pills',
    fontScale: 1.0,
  };
}

const DEFAULT_META: ProjectMeta = {
  appName: 'My App',
  iconDataUrl: null,
  platform: ['ios'],
  resolutionPresets: ['iphone-69'],
};

/**
 * Migrate a legacy theme that uses `textPosition` to the new `layoutMode` system.
 */
function migrateTheme(theme: Partial<Theme> & { textPosition?: string }): Theme {
  const base = { ...DEFAULT_THEME, ...theme };

  // If the theme already has layoutMode, it's already migrated
  if (theme.layoutMode) return base as Theme;

  // Migrate from old textPosition
  const tp = theme.textPosition ?? 'top';
  switch (tp) {
    case 'bottom':
      base.layoutMode = 'device-above';
      base.paddingTop = 0.04;
      base.paddingBottom = 0.05;
      base.contentGap = 0.02;
      break;
    case 'split':
      base.layoutMode = 'header-above';
      base.paddingTop = 0.04;
      base.paddingBottom = 0.05;
      base.contentGap = 0.03;
      break;
    default: // 'top'
      base.layoutMode = 'header-above';
      base.paddingTop = 0.05;
      base.paddingBottom = 0.04;
      base.contentGap = 0.02;
      break;
  }

  // Remove deprecated field
  delete base.textPosition;
  return base as Theme;
}

// Custom IndexedDB storage handler for persist
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useProjectStore = create<ProjectStore>()(
  temporal(
    persist(
      (set, get: () => ProjectStore) => ({
        meta: DEFAULT_META,
        theme: DEFAULT_THEME,
        slides: [makeSlide()],
        activeSlideId: null,
        selectedResolutions: ['iphone-69'] as ResolutionId[],
        activeResolutionScope: 'global',
        themeScope: 'slide' as 'global' | 'slide',

        setMeta: (meta) =>
          set((s) => ({
            meta: { ...s.meta, ...meta },
            ...(meta.resolutionPresets ? { selectedResolutions: meta.resolutionPresets } : {}),
          })),

        setTheme: (theme) =>
          set((s) => ({ theme: { ...s.theme, ...theme } })),

        setThemeScope: (scope) => set({ themeScope: scope }),

        setActiveResolutionScope: (scope) => set({ activeResolutionScope: scope }),

        addSlide: () =>
          set((s) => {
            const slide = makeSlide();
            return { slides: [...s.slides, slide], activeSlideId: slide.id };
          }),
  updateSlide: (id, data) =>
    set((s) => ({
      slides: s.slides.map((sl) => (sl.id === id ? { ...sl, ...data } : sl)),
    })),

  removeSlide: (id) =>
    set((s) => {
      const slides = s.slides.filter((sl) => sl.id !== id);
      const activeSlideId =
        s.activeSlideId === id ? (slides[0]?.id ?? null) : s.activeSlideId;
      return { slides, activeSlideId };
    }),

  reorderSlides: (from, to) =>
    set((s) => {
      const slides = [...s.slides];
      const [moved] = slides.splice(from, 1);
      slides.splice(to, 0, moved);
      return { slides };
    }),

  setActiveSlide: (id) => set({ activeSlideId: id }),

  importProject: (json: ProjectFile) => {
    // Migrate legacy theme if needed
    const theme = migrateTheme(json.theme as Partial<Theme> & { textPosition?: string });
    set({
      meta: json.meta,
      theme,
      slides: json.slides,
      activeSlideId: json.slides[0]?.id ?? null,
      selectedResolutions: json.meta.resolutionPresets,
    });
  },

  exportProject: () => {
    const { meta, theme, slides } = get();
    return { version: '1.1', meta, theme, slides };
  },

  applyPaletteToTheme: (palette: ExtractedPalette) => {
    const gradient = buildGradientFromPalette(palette);
    set((s) => ({
      theme: {
        ...s.theme,
        id: 'custom',
        name: 'From Screenshot',
        background: gradient,
        backgroundType: 'gradient',
        textColor: palette.isDark ? '#ffffff' : '#0f0f0f',
        subtitleColor: palette.isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.6)',
        accentColor: palette.vibrant,
        shadowStyle: `0 20px 60px ${palette.vibrant}55`,
      },
    }));
  },

  importThemeTemplate: (template: ThemeTemplate) => {
    const incoming = template.theme;
    set((s) => ({
      theme: {
        ...s.theme,
        ...incoming,
        id: 'custom' as const,
        name: template.name || 'Imported Theme',
      },
    }));
  },

  exportThemeTemplate: (): ThemeTemplate => {
    const { theme } = get();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = theme;
    return {
      name: theme.name,
      description: `Exported from SnapFrame`,
      theme: rest,
    };
  },

  setSlideTheme: (slideId: string, overrides: Partial<Theme>) =>
    set((s) => ({
      slides: s.slides.map((sl) =>
        sl.id === slideId
          ? { ...sl, themeOverrides: { ...(sl.themeOverrides ?? {}), ...overrides } }
          : sl
      ),
    })),

  applyThemeToAllSlides: () =>
    set((s) => {
      const activeSlide = s.slides.find((sl) => sl.id === s.activeSlideId);
      const overrides = activeSlide?.themeOverrides ?? {};
      return {
        slides: s.slides.map((sl) => ({
          ...sl,
          themeOverrides: { ...overrides },
        })),
      };
    }),

  clearSlideTheme: (slideId: string) =>
    set((s) => ({
      slides: s.slides.map((sl) =>
        sl.id === slideId ? { ...sl, themeOverrides: undefined } : sl
      ),
    })),

  createNewProject: () => {
    const firstSlide = makeSlide();
    set(() => ({
      meta: { ...DEFAULT_META, resolutionPresets: [...DEFAULT_META.resolutionPresets] },
      theme: { ...DEFAULT_THEME },
      slides: [firstSlide],
      activeSlideId: firstSlide.id,
      selectedResolutions: [...DEFAULT_META.resolutionPresets],
      activeResolutionScope: 'global',
      themeScope: 'slide',
    }));
  },
      }),
      {
        name: 'snapframe-project',
        storage: createJSONStorage(() => idbStorage),
      }
    ),
    {
      limit: 20,
      partialize: (state: ProjectStore) => {
        const { activeResolutionScope, selectedResolutions, themeScope, ...rest } = state;
        return rest;
      },
    }
  )
);

export const useTemporalStore = <T,>(
  selector: (state: any) => T,
) => useStore(useProjectStore.temporal, selector);
