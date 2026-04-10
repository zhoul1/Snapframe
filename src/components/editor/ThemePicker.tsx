import { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { THEMES, THEME_TEMPLATE_JSON } from '../../lib/themes';
import { FONT_PAIRINGS } from '../../lib/fonts';
import { generateThemeVariants, generatePaletteThemes } from '../../lib/colorTheory';
import { buildGradientFromPalette } from '../../lib/colorExtractor';
import type { LayoutMode, FontPairingId, BackgroundType, ExtractedPalette, ThemeTemplate } from '../../types';
import { Palette, Sparkles, Upload, Download, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';

const LAYOUT_MODES: { id: LayoutMode; label: string; desc: string }[] = [
  { id: 'header-above', label: 'Header Above', desc: 'Title on top, device below' },
  { id: 'device-above', label: 'Device Above', desc: 'Device on top, title below' },
  { id: 'overlay', label: 'Overlay', desc: 'Device centered, text overlaid' },
];

const BG_TYPES: { id: BackgroundType; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'mesh', label: 'Mesh' },
  { id: 'noise', label: 'Noise' },
];

const FRAME_STYLES: { id: 'dark' | 'light' | 'black' | 'white'; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
];

const TEXT_ALIGNS: { id: 'left' | 'center' | 'right'; label: string }[] = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
];

function SectionHeader({ 
  label, isOpen, onToggle 
}: { 
  label: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-1.5 cursor-pointer group"
    >
      <p className="text-xs text-white/45 font-semibold uppercase tracking-wider">{label}</p>
      {isOpen
        ? <ChevronUp className="w-3.5 h-3.5 text-white/25 group-hover:text-white/50 transition-colors" />
        : <ChevronDown className="w-3.5 h-3.5 text-white/25 group-hover:text-white/50 transition-colors" />}
    </button>
  );
}

function SliderRow({
  label, value, min, max, step, suffix, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  suffix?: string; onChange: (v: number) => void;
}) {
  const displayVal = suffix === '%' ? Math.round(value * 100) : value.toFixed(2);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50">{label}</span>
        <span className="text-[10px] text-white/35 font-mono">{displayVal}{suffix ?? ''}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

interface ThemePickerProps {
  extractedPalette?: ExtractedPalette | null;
  view: 'design' | 'device';
}

export function ThemePicker({ extractedPalette, view }: ThemePickerProps) {
  const {
    theme, setTheme,
    importThemeTemplate, exportThemeTemplate,
    slides, activeSlideId,
    setSlideTheme,
    activeResolutionScope, themeScope
  } = useProjectStore();

  const [showTemplate, setShowTemplate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    presets: true,
    colors: true,
    layout: true,
    typography: true,
    device: true,
    pills: true,
    json: false,
  });

  const activeSlide = slides.find((s) => s.id === activeSlideId);
  // Effective theme for display: merge global + per-slide overrides
  let effectiveTheme = activeSlide?.themeOverrides
    ? { ...theme, ...activeSlide.themeOverrides }
    : theme;

  const realEffectiveTheme = effectiveTheme;
  if (activeResolutionScope !== 'global' && effectiveTheme.resolutionOverrides?.[activeResolutionScope]) {
    effectiveTheme = { ...effectiveTheme, ...effectiveTheme.resolutionOverrides[activeResolutionScope] };
  }


  // Route theme changes to the right target
  function handleThemeChange(changes: Record<string, any>) {
    if (activeResolutionScope !== 'global') {
      const currentOverrides = realEffectiveTheme.resolutionOverrides || {};
      changes = {
        resolutionOverrides: {
          ...currentOverrides,
          [activeResolutionScope]: {
            ...(currentOverrides[activeResolutionScope] || {}),
            ...changes
          }
        }
      };
    } else {
      // 🚀 Global Numeric Shift Override
      // If the user drags a global scale/offset but explicit overrides exist on specific phones,
      // intelligently shift the children proportionally instead of ignoring them.
      const currentOverrides = { ...(realEffectiveTheme.resolutionOverrides || {}) };
      let overridesChanged = false;

      const continuousKeys = ['deviceSizeScale', 'deviceOffsetX', 'deviceOffsetY'];
      
      for (const key of continuousKeys) {
        if (key in changes && typeof changes[key] === 'number') {
          const oldVal = (realEffectiveTheme as any)[key] ?? 0;
          const delta = changes[key] - oldVal;
          
          if (delta !== 0) {
            for (const res in currentOverrides) {
              const rId = res as keyof typeof currentOverrides;
              const resOverride = currentOverrides[rId];
              if (resOverride && key in resOverride && typeof (resOverride as any)[key] === 'number') {
                currentOverrides[rId] = {
                  ...resOverride,
                  [key]: (resOverride as any)[key] + delta,
                };
                overridesChanged = true;
              }
            }
          }
        }
      }

      if (overridesChanged) {
        changes.resolutionOverrides = currentOverrides;
      }
    }

    if (themeScope === 'slide' && activeSlideId) {
      setSlideTheme(activeSlideId, changes);
    } else {
      setTheme(changes);
    }
  }

  const smartVariants = generateThemeVariants(effectiveTheme.accentColor);
  const palette = extractedPalette;

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleImportTheme() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string) as ThemeTemplate;
          if (!json.theme) {
            setJsonError('Invalid theme file: missing "theme" object');
            return;
          }
          importThemeTemplate(json);
          setJsonError(null);
        } catch {
          setJsonError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleExportTheme() {
    const template = exportThemeTemplate();
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(effectiveTheme.name || 'theme').toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyTemplate() {
    navigator.clipboard.writeText(THEME_TEMPLATE_JSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1">


      {/* ═══════════ EFFECTIVE SCREEN OVERRIDE INDICATOR ═══════════ */}
      {activeResolutionScope !== 'global' && realEffectiveTheme.resolutionOverrides?.[activeResolutionScope] && (
        <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-2 mb-1 flex flex-col gap-2 items-center text-center">
          <span className="text-[10px] text-violet-300 tracking-wide">
            Editing {activeResolutionScope.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')} Overrides
          </span>
          <button
            onClick={() => {
              const nextOverrides = { ...realEffectiveTheme.resolutionOverrides };
              delete nextOverrides[activeResolutionScope];
              if (themeScope === 'slide' && activeSlideId) {
                setSlideTheme(activeSlideId, { resolutionOverrides: nextOverrides });
              } else {
                setTheme({ resolutionOverrides: nextOverrides });
              }
            }}
            className="text-[10px] text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10 px-3 py-1 rounded-md cursor-pointer"
          >
            Reset to Global Settings
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          DETECTED PALETTE (from screenshot)
          ═══════════════════════════════════════════ */}
      {palette && (
        <div className="rounded-xl bg-white/5 border border-white/8 p-3 flex flex-col gap-2.5 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-white/60 font-medium">Colors from Screenshot</span>
            </div>
            <Button size="sm" variant="primary" onClick={() => {
              const gradient = buildGradientFromPalette(palette);
              handleThemeChange({
                id: 'custom',
                name: 'From Screenshot',
                background: gradient,
                backgroundType: 'gradient',
                textColor: palette.isDark ? '#ffffff' : '#0f0f0f',
                subtitleColor: palette.isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.6)',
                accentColor: palette.vibrant,
                shadowStyle: `0 20px 60px ${palette.vibrant}55`,
              });
            }}>
              <Palette className="w-3 h-3" />
              Apply
            </Button>
          </div>
          <div className="flex gap-1.5">
            {[palette.dominant, palette.vibrant, palette.muted, palette.darkVibrant, palette.lightVibrant].map((c, i) => (
              <div key={i} className="flex-1 h-5 rounded-md border border-white/10" style={{ background: c }} title={c} />
            ))}
          </div>
          <div>
            <p className="text-[10px] text-white/35 mb-1.5">Smart themes — click to apply</p>
            <div className="flex gap-2">
              {generatePaletteThemes(palette).map((v) => (
                <button
                  key={v.label}
                  title={v.label}
                  onClick={() => handleThemeChange({
                    id: 'custom',
                    name: v.label,
                    background: v.background,
                    backgroundType: v.backgroundType,
                    textColor: v.textColor,
                    subtitleColor: v.subtitleColor,
                    accentColor: v.accentColor,
                  })}
                  className="flex-1 h-9 rounded-xl border border-white/15 hover:scale-105 hover:border-white/30 transition-all cursor-pointer relative overflow-hidden"
                  style={{ background: v.background }}
                >
                  <span className="absolute bottom-0.5 inset-x-0 text-center text-[8px] font-medium"
                    style={{ color: v.textColor, opacity: 0.7 }}>
                    {v.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PRESET THEMES
          ═══════════════════════════════════════════ */}
      {view === 'design' && <SectionHeader label="Preset Themes" isOpen={expandedSections.presets ?? true} onToggle={() => toggleSection('presets')} />}
      {view === 'design' && expandedSections.presets && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t)}
              className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                effectiveTheme.id === t.id
                  ? 'border-violet-400 scale-105 shadow-lg shadow-violet-900/40'
                  : 'border-transparent hover:border-white/20'
              }`}
              style={{ background: t.background }}
              title={t.name}
            >
              <div className="absolute inset-0 flex items-end p-1.5">
                <span className="text-[9px] font-semibold drop-shadow leading-tight"
                  style={{ color: t.textColor }}>
                  {t.name}
                </span>
              </div>
            </button>
          ))}
          {effectiveTheme.id === 'custom' && (
            <div className="h-14 rounded-xl overflow-hidden border-2 border-violet-400 flex items-end p-1.5"
              style={{ background: effectiveTheme.background }}>
              <span className="text-[9px] font-semibold text-white/80">Custom</span>
            </div>
          )}
        </div>
      )}

      {view === 'design' && <div className="h-px bg-white/6" />}

      {/* ═══════════════════════════════════════════
          COLORS
          ═══════════════════════════════════════════ */}
      {view === 'design' && <SectionHeader label="Colors" isOpen={expandedSections.colors ?? true} onToggle={() => toggleSection('colors')} />}
      {view === 'design' && expandedSections.colors && (
        <div className="flex flex-col gap-3 mb-2">
          {/* Accent Color */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-white/50">Accent Color</span>
              <span className="text-[10px] text-white/30 font-mono">{effectiveTheme.accentColor}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={effectiveTheme.accentColor}
                onChange={(e) => handleThemeChange({ accentColor: e.target.value })}
                className="w-9 h-9 rounded-xl cursor-pointer border border-white/10 bg-transparent"
              />
              <div className="flex-1">
                <p className="text-[10px] text-white/35 mb-1">Smart Backgrounds</p>
                <div className="flex gap-1.5 flex-wrap">
                  {smartVariants.map((v) => (
                    <button
                      key={v.label}
                      title={v.label}
                      onClick={() => handleThemeChange({
                        id: 'custom',
                        name: v.label,
                        background: v.background,
                        backgroundType: v.backgroundType,
                        textColor: v.textColor,
                        subtitleColor: v.subtitleColor,
                        accentColor: v.accentColor,
                      })}
                      className="w-7 h-7 rounded-lg border border-white/15 hover:scale-110 transition-transform cursor-pointer flex-shrink-0 relative overflow-hidden"
                      style={{ background: v.background }}
                    >
                      <span className="sr-only">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Background Type */}
          <div>
            <span className="text-[11px] text-white/50 mb-1 block">Background Type</span>
            <div className="flex gap-1 flex-wrap">
              {BG_TYPES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleThemeChange({ backgroundType: b.id })}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    effectiveTheme.backgroundType === b.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/8 text-white/60 hover:bg-white/12'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          LAYOUT
          ═══════════════════════════════════════════ */}
      {view === 'device' && <SectionHeader label="Layout" isOpen={expandedSections.layout ?? true} onToggle={() => toggleSection('layout')} />}
      {view === 'device' && expandedSections.layout && (
        <div className="flex flex-col gap-3 mb-2">
          {/* Layout Mode */}
          <div>
            <span className="text-[11px] text-white/50 mb-1 block">Layout Mode</span>
            <div className="flex gap-1">
              {LAYOUT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleThemeChange({ layoutMode: mode.id })}
                  title={mode.desc}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    effectiveTheme.layoutMode === mode.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/8 text-white/60 hover:bg-white/12'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <span className="text-[11px] text-white/50 mb-1 block">Text Alignment</span>
            <div className="flex gap-1">
              {TEXT_ALIGNS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleThemeChange({ textAlign: a.id })}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    (effectiveTheme.textAlign ?? 'center') === a.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/8 text-white/60 hover:bg-white/12'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spacing Sliders */}
          <SliderRow
            label="Top Padding" value={effectiveTheme.paddingTop ?? 0.05}
            min={0.01} max={0.15} step={0.005} suffix="%"
            onChange={(v) => handleThemeChange({ paddingTop: v })}
          />
          <SliderRow
            label="Bottom Padding" value={effectiveTheme.paddingBottom ?? 0.04}
            min={0.01} max={0.15} step={0.005} suffix="%"
            onChange={(v) => handleThemeChange({ paddingBottom: v })}
          />
          <SliderRow
            label="Content Gap" value={effectiveTheme.contentGap ?? 0.02}
            min={0.005} max={0.08} step={0.005} suffix="%"
            onChange={(v) => handleThemeChange({ contentGap: v })}
          />
        </div>
      )}

      {view === 'design' && <div className="h-px bg-white/6" />}

      {/* ═══════════════════════════════════════════
          TYPOGRAPHY
          ═══════════════════════════════════════════ */}
      {view === 'design' && <SectionHeader label="Typography" isOpen={expandedSections.typography ?? true} onToggle={() => toggleSection('typography')} />}
      {view === 'design' && expandedSections.typography && (
        <div className="flex flex-col gap-3 mb-2">
          {/* Font Pairing */}
          <div>
            <span className="text-[11px] text-white/50 mb-1 block">Font Pairing</span>
            <div className="flex flex-col gap-1">
              {FONT_PAIRINGS.map((fp) => (
                <button
                  key={fp.id}
                  onClick={() => handleThemeChange({ fontPairing: fp.id as FontPairingId })}
                  className={`text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    effectiveTheme.fontPairing === fp.id
                      ? 'bg-violet-600/40 border border-violet-500/50 text-white'
                      : 'bg-white/6 border border-white/8 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {fp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Headline Weight */}
          <div>
            <span className="text-[11px] text-white/50 mb-1 block">Headline Weight</span>
            <div className="flex gap-1">
              {([
                { w: 400, label: 'Light' },
                { w: 600, label: 'Semi' },
                { w: 700, label: 'Bold' },
                { w: 900, label: 'Black' },
              ] as const).map((opt) => (
                <button
                  key={opt.w}
                  onClick={() => handleThemeChange({ headlineWeight: opt.w })}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    (effectiveTheme.headlineWeight ?? 700) === opt.w
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/8 text-white/60 hover:bg-white/12'
                  }`}
                  style={{ fontWeight: opt.w }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Italic Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Italic</span>
            <button
              onClick={() => handleThemeChange({ headlineItalic: !(effectiveTheme.headlineItalic ?? false) })}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                effectiveTheme.headlineItalic ? 'bg-violet-600' : 'bg-white/15'
              }`}
            >
              <div className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${
                effectiveTheme.headlineItalic ? 'left-[18px]' : 'left-[3px]'
              }`} />
            </button>
          </div>
        </div>
      )}

      {view === 'device' && <div className="h-px bg-white/6" />}

      {/* ═══════════════════════════════════════════
          DEVICE
          ═══════════════════════════════════════════ */}
      {view === 'device' && <SectionHeader label="Device" isOpen={expandedSections.device ?? true} onToggle={() => toggleSection('device')} />}
      {view === 'device' && expandedSections.device && (
        <div className="flex flex-col gap-3 mb-2">
          {/* Frame Style */}
          <div>
            <span className="text-[11px] text-white/50 mb-1 block">Frame Style</span>
            <div className="flex gap-1">
              {FRAME_STYLES.map((fs) => (
                <button
                  key={fs.id}
                  onClick={() => handleThemeChange({ deviceFrameStyle: fs.id })}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    (effectiveTheme.deviceFrameStyle ?? 'dark') === fs.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/8 text-white/60 hover:bg-white/12'
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Screen Notch/Punch-hole toggle */}
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[11px] text-white/50">Device sensors & notch</span>
            <button
              onClick={() => handleThemeChange({ showDeviceSensor: !(effectiveTheme.showDeviceSensor ?? true) })}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                (effectiveTheme.showDeviceSensor ?? true) ? 'bg-violet-600' : 'bg-white/15'
              }`}
            >
              <div className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${
                (effectiveTheme.showDeviceSensor ?? true) ? 'left-[18px]' : 'left-[3px]'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-0.5">
            <span className="text-[11px] text-white/50">Generic uniform outline</span>
            <button
              onClick={() => handleThemeChange({ deviceFrameType: (effectiveTheme.deviceFrameType ?? 'realistic') === 'generic' ? 'realistic' : 'generic' })}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                (effectiveTheme.deviceFrameType ?? 'realistic') === 'generic' ? 'bg-violet-600' : 'bg-white/15'
              }`}
            >
              <div className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${
                (effectiveTheme.deviceFrameType ?? 'realistic') === 'generic' ? 'left-[18px]' : 'left-[3px]'
              }`} />
            </button>
          </div>

          {/* Scale and Position Sliders */}
          <SliderRow
            label="Device Size"
            value={effectiveTheme.deviceSizeScale ?? 0.58}
            min={0.38} max={0.85} step={0.01} suffix="%"
            onChange={(v) => handleThemeChange({ deviceSizeScale: v })}
          />

          <SliderRow
            label="Offset X"
            value={effectiveTheme.deviceOffsetX ?? 0}
            min={-0.35} max={0.35} step={0.01} suffix="%"
            onChange={(v) => handleThemeChange({ deviceOffsetX: v })}
          />

          <SliderRow
            label="Offset Y"
            value={effectiveTheme.deviceOffsetY ?? 0}
            min={-0.35} max={0.35} step={0.01} suffix="%"
            onChange={(v) => handleThemeChange({ deviceOffsetY: v })}
          />

          {((effectiveTheme.deviceOffsetX ?? 0) !== 0 || (effectiveTheme.deviceOffsetY ?? 0) !== 0) && (
            <button
              onClick={() => handleThemeChange({ deviceOffsetX: 0, deviceOffsetY: 0 })}
              className="text-xs text-white/35 hover:text-white/60 cursor-pointer transition-colors self-start"
            >
              Reset position
            </button>
          )}
        </div>
      )}

      {view === 'device' && <div className="h-px bg-white/6" />}

      {/* ═══════════════════════════════════════════
          PILLS
          ═══════════════════════════════════════════ */}
      {view === 'device' && <SectionHeader label="Floating Pills" isOpen={expandedSections.pills ?? true} onToggle={() => toggleSection('pills')} />}
      {view === 'device' && expandedSections.pills && (
        <div className="flex flex-col gap-3 mb-2">
          <SliderRow
            label="Vertical Spread" value={effectiveTheme.pillSpread ?? 0.6}
            min={0.1} max={1.0} step={0.05} suffix="%"
            onChange={(v) => handleThemeChange({ pillSpread: v })}
          />
          <SliderRow
            label="Side Inset" value={effectiveTheme.pillEdgeInset ?? 0.04}
            min={0.0} max={0.12} step={0.005} suffix="%"
            onChange={(v) => handleThemeChange({ pillEdgeInset: v })}
          />
        </div>
      )}

      {view === 'design' && <div className="h-px bg-white/6" />}

      {/* ═══════════════════════════════════════════
          JSON THEME IMPORT / EXPORT
          ═══════════════════════════════════════════ */}
      {view === 'design' && <SectionHeader label="Custom Theme (JSON)" isOpen={expandedSections.json ?? false} onToggle={() => toggleSection('json')} />}
      {view === 'design' && expandedSections.json && (
        <div className="flex flex-col gap-2.5 mb-2">
          <p className="text-[10px] text-white/35 leading-relaxed">
            Import a theme from JSON or export the current theme. Share the template below with an AI to generate custom themes.
          </p>

          <div className="flex gap-1.5">
            <Button size="sm" onClick={handleImportTheme} className="flex-1 justify-center">
              <Upload className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button size="sm" onClick={handleExportTheme} className="flex-1 justify-center">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>

          {jsonError && (
            <p className="text-[10px] text-red-400">{jsonError}</p>
          )}

          <button
            onClick={() => setShowTemplate(!showTemplate)}
            className="text-[11px] text-violet-400 hover:text-violet-300 cursor-pointer transition-colors text-left"
          >
            {showTemplate ? 'Hide' : 'Show'} JSON Template
          </button>

          {showTemplate && (
            <div className="relative">
              <pre className="bg-black/40 border border-white/10 rounded-xl p-3 text-[9px] text-white/60 overflow-auto max-h-48 font-mono leading-relaxed whitespace-pre">
                {THEME_TEMPLATE_JSON}
              </pre>
              <button
                onClick={copyTemplate}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Copy template"
              >
                {copied
                  ? <Check className="w-3 h-3 text-green-400" />
                  : <Copy className="w-3 h-3 text-white/50" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
