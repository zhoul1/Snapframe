import { useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { extractPaletteFromDataUrl } from '../../lib/colorExtractor';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Upload, Trash2, Smartphone, Image, Tablet } from 'lucide-react';
import type { Slide, DeviceKind } from '../../types';

interface SlideEditorProps {
  slide: Slide;
}

export function SlideEditor({ slide }: SlideEditorProps) {
  const { updateSlide, removeSlide, slides, selectedResolutions, activeResolutionScope } =
    useProjectStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const tabletFileRef = useRef<HTMLInputElement>(null);
  const iPadFileRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      updateSlide(slide.id, { imageDataUrl: dataUrl });
      try {
        const palette = await extractPaletteFromDataUrl(dataUrl);
        updateSlide(slide.id, { extractedPalette: palette });
      } catch {
        // extraction is best-effort
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleDeviceImageUpload(kind: DeviceKind, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateSlide(slide.id, {
        deviceImages: { ...slide.deviceImages, [kind]: dataUrl },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function clearDeviceImage(kind: DeviceKind) {
    const next = { ...slide.deviceImages };
    delete next[kind];
    updateSlide(slide.id, { deviceImages: next });
  }

  let editingSlide = slide;
  if (activeResolutionScope !== 'global' && slide.resolutionOverrides?.[activeResolutionScope]) {
    editingSlide = { ...slide, ...slide.resolutionOverrides[activeResolutionScope] };
  }

  function handleSlideChange(changes: Partial<Slide>) {
    if (activeResolutionScope !== 'global') {
      const currentOverrides = slide.resolutionOverrides || {};
      changes = {
        resolutionOverrides: {
          ...currentOverrides,
          [activeResolutionScope]: {
            ...(currentOverrides[activeResolutionScope] || {}),
            ...changes
          }
        }
      };
    }
    updateSlide(slide.id, changes);
  }

  const needsIPad = selectedResolutions.includes('ipad-pro-13')
    || selectedResolutions.includes('ipad-pro-13-landscape');
  const needsAndroidTablet = selectedResolutions.includes('android-tablet')
    || selectedResolutions.includes('android-tablet-landscape');

  return (
    <div className="flex flex-col gap-4">

      {/* ═══════════ SCREENSHOT UPLOAD ═══════════ */}
      <div>
        <p className="text-xs text-white/45 font-semibold uppercase tracking-wider mb-2">Screenshot</p>
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
            slide.imageDataUrl
              ? 'border-white/10 hover:border-white/20'
              : 'border-dashed border-white/20 hover:border-violet-500/50'
          }`}
          style={{ height: 160, aspectRatio: '9/19.5' }}
        >
          {slide.imageDataUrl ? (
            <>
              <img src={slide.imageDataUrl} alt="" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Upload className="w-5 h-5 text-white" />
                <span className="text-sm text-white font-medium">Replace</span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center">
                <Image className="w-6 h-6 text-white/40" />
              </div>
              <div className="text-center">
                <p className="text-sm text-white/50">Click to upload</p>
                <p className="text-xs text-white/25 mt-1">PNG · JPG · WebP</p>
              </div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="hidden" />
      </div>

      {/* ═══════════ DEVICE-SPECIFIC UPLOADS ═══════════ */}
      {(needsIPad || needsAndroidTablet) && (
        <div className="flex flex-col gap-3">
          {needsIPad && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Tablet className="w-3.5 h-3.5 text-violet-400" />
                  <p className="text-[11px] text-white/50 font-medium">iPad Screenshot</p>
                </div>
                {slide.deviceImages?.['ipad'] && (
                  <button
                    onClick={() => clearDeviceImage('ipad')}
                    className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div
                onClick={() => iPadFileRef.current?.click()}
                className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  slide.deviceImages?.['ipad']
                    ? 'border-white/10 hover:border-white/20'
                    : 'border-dashed border-white/15 hover:border-violet-500/40'
                }`}
                style={{ aspectRatio: '3/4', height: 100 }}
              >
                {slide.deviceImages?.['ipad'] ? (
                  <>
                    <img src={slide.deviceImages['ipad']} alt="" className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4 text-white" />
                      <span className="text-xs text-white font-medium">Replace</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <Image className="w-5 h-5 text-white/25" />
                    <p className="text-[10px] text-white/35">Upload iPad screenshot</p>
                  </div>
                )}
              </div>
              <input ref={iPadFileRef} type="file" accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleDeviceImageUpload('ipad', e)} className="hidden" />
            </div>
          )}
          {needsAndroidTablet && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Tablet className="w-3.5 h-3.5 text-green-400" />
                  <p className="text-[11px] text-white/50 font-medium">Android Tablet Screenshot</p>
                </div>
                {slide.deviceImages?.['android-tablet'] && (
                  <button
                    onClick={() => clearDeviceImage('android-tablet')}
                    className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div
                onClick={() => tabletFileRef.current?.click()}
                className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  slide.deviceImages?.['android-tablet']
                    ? 'border-white/10 hover:border-white/20'
                    : 'border-dashed border-white/15 hover:border-green-500/40'
                }`}
                style={{ aspectRatio: '10/16', height: 100 }}
              >
                {slide.deviceImages?.['android-tablet'] ? (
                  <>
                    <img src={slide.deviceImages['android-tablet']} alt="" className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4 text-white" />
                      <span className="text-xs text-white font-medium">Replace</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <Image className="w-5 h-5 text-white/25" />
                    <p className="text-[10px] text-white/35">Upload tablet screenshot</p>
                  </div>
                )}
              </div>
              <input ref={tabletFileRef} type="file" accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleDeviceImageUpload('android-tablet', e)} className="hidden" />
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TEXT CONTENT ═══════════ */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-white/45 font-semibold uppercase tracking-wider">Text Content</p>

        <Input
          id={`eyebrow-${slide.id}`}
          label="Eyebrow (small text above headline)"
          value={slide.eyebrow}
          onChange={(e) => updateSlide(slide.id, { eyebrow: e.target.value })}
          placeholder="Your PDF. Your Device."
          maxLength={50}
        />

        <Input
          id={`header-${slide.id}`}
          label="Headline"
          value={slide.header}
          onChange={(e) => updateSlide(slide.id, { header: e.target.value })}
          placeholder="Edit. Offline. Private."
          maxLength={60}
        />

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-white/50 font-medium">
            Feature bullets <span className="text-white/25">(1 per line, max 3)</span>
          </label>
          <textarea
            value={slide.featureBullets}
            onChange={(e) => updateSlide(slide.id, { featureBullets: e.target.value })}
            placeholder={"Fast & offline\nNo account needed\nPrivate by default"}
            rows={3}
            className="bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 resize-none transition-colors font-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-white/50 font-medium">
            Bottom badges <span className="text-white/25">(comma separated, max 5)</span>
          </label>
          <input
            value={slide.badges}
            onChange={(e) => updateSlide(slide.id, { badges: e.target.value })}
            placeholder="100% Offline, No Login, No Subscription"
            className="bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 transition-colors"
          />
        </div>
      </div>

      {/* ═══════════ DISPLAY OPTIONS ═══════════ */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-white/45 font-semibold uppercase tracking-wider">Display Options</p>

        {/* Device frame toggle */}
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-white/40" />
            <span className="text-[11px] text-white/50">Device frame</span>
          </div>
          <button
            onClick={() => updateSlide(slide.id, { deviceFrame: !slide.deviceFrame })}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
              slide.deviceFrame ? 'bg-violet-600' : 'bg-white/15'
            }`}
          >
            <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${
              slide.deviceFrame ? 'left-[19px]' : 'left-[3px]'
            }`} />
          </button>
        </div>

        {/* Font size — global + per-element fine-tune */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Global Font Scale</span>
            <span className="text-[10px] text-white/35 font-mono">{Math.round((editingSlide.fontScale ?? 1.0) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.7}
            max={1.5}
            step={0.05}
            value={editingSlide.fontScale ?? 1.0}
            onChange={(e) => handleSlideChange({ fontScale: parseFloat(e.target.value) })}
            className="w-full"
          />

          {/* Per-element fine-tune */}
          <details className="group">
            <summary className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer select-none flex items-center gap-1 mt-1">
              <span className="group-open:rotate-90 transition-transform inline-block text-[8px]">▶</span>
              Fine-tune individual sizes
            </summary>
            <div className="flex flex-col gap-2 mt-2 pl-1 border-l-2 border-white/6">
              {([
                { key: 'eyebrowScale', label: 'Eyebrow' },
                { key: 'headlineScale', label: 'Headline' },
                { key: 'sublineScale', label: 'Subheadline / Bullets' },
                { key: 'pillScale', label: 'Floating Pills' },
                { key: 'badgeScale', label: 'Bottom Badges' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40">{label}</span>
                    <span className="text-[9px] text-white/30 font-mono">
                      {Math.round(((editingSlide as any)[key] ?? 1.0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={(editingSlide as any)[key] ?? 1.0}
                    onChange={(e) => handleSlideChange({ [key]: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              ))}
              <button
                onClick={() => handleSlideChange({
                  eyebrowScale: 1.0,
                  headlineScale: 1.0,
                  sublineScale: 1.0,
                  pillScale: 1.0,
                  badgeScale: 1.0,
                })}
                className="text-[10px] text-white/30 hover:text-white/50 cursor-pointer transition-colors self-start mt-0.5"
              >
                Reset fine-tuning
              </button>
            </div>
          </details>
          
          {activeResolutionScope !== 'global' && slide.resolutionOverrides?.[activeResolutionScope] && (
            <button
              onClick={() => {
                const nextOverrides = { ...slide.resolutionOverrides };
                delete nextOverrides[activeResolutionScope];
                updateSlide(slide.id, { resolutionOverrides: nextOverrides });
              }}
              className="text-[10px] text-white/35 hover:text-white/60 cursor-pointer transition-colors mt-2 self-start border border-white/10 px-2 py-1 rounded-md"
            >
              Clear screen typography override
            </button>
          )}
        </div>

        {/* Pill mode toggle */}
        <div>
          <span className="text-[11px] text-white/50 mb-1 block">Feature bullets display</span>
          <div className="flex gap-1">
            {(['pills', 'subheadline'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateSlide(slide.id, { pillMode: mode })}
                className={`flex-1 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                  (slide.pillMode ?? 'pills') === mode
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/8 text-white/60 hover:bg-white/12'
                }`}
              >
                {mode === 'pills' ? 'Floating Pills' : 'Subheadline'}
              </button>
            ))}
          </div>
        </div>

        {/* Override background */}
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[11px] text-white/50">Override background</span>
          <div className="flex items-center gap-2">
            {slide.overrideBackground && (
              <button onClick={() => updateSlide(slide.id, { overrideBackground: null })}
                className="text-xs text-white/35 hover:text-white/60 cursor-pointer">
                Clear
              </button>
            )}
            <input
              type="color"
              value={slide.overrideBackground ?? '#6c63ff'}
              onChange={(e) => updateSlide(slide.id, { overrideBackground: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-white/10 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* ═══════════ DELETE ═══════════ */}
      {slides.length > 1 && (
        <Button variant="danger" size="sm" onClick={() => removeSlide(slide.id)} className="w-full justify-center mt-1">
          <Trash2 className="w-3.5 h-3.5" />
          Remove Slide
        </Button>
      )}
    </div>
  );
}
