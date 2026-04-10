import { useRef, useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { SlideEditor } from '../editor/SlideEditor';
import { ThemePicker } from '../editor/ThemePicker';
import { ResolutionPicker } from '../editor/ResolutionPicker';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Plus, Layers, Palette, Smartphone, Monitor, Settings, Check, X } from 'lucide-react';

type Panel = 'slides' | 'design' | 'device' | 'resolution' | 'project';

export function Sidebar() {
  const { slides, activeSlideId, setActiveSlide, addSlide, meta, setMeta, createNewProject } = useProjectStore();
  const [panel, setPanel] = useState<Panel>('slides');
  const [confirmingReset, setConfirmingReset] = useState(false);
  const iconRef = useRef<HTMLInputElement>(null);

  const activeSlide = slides.find((s) => s.id === activeSlideId) ?? slides[0];

  function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMeta({ iconDataUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const navItems: { id: Panel; icon: React.ReactNode; label: string }[] = [
    { id: 'slides', icon: <Layers className="w-4 h-4" />, label: 'Slides' },
    { id: 'design', icon: <Palette className="w-4 h-4" />, label: 'Design' },
    { id: 'device', icon: <Smartphone className="w-4 h-4" />, label: 'Device' },
    { id: 'resolution', icon: <Monitor className="w-4 h-4" />, label: 'Export Size' },
    { id: 'project', icon: <Settings className="w-4 h-4" />, label: 'Project' },
  ];

  return (
    <aside className="w-72 flex-shrink-0 bg-[#0d0d18] border-r border-white/6 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Snapframe Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-white text-sm tracking-tight">SnapFrame</span>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex border-b border-white/6">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPanel(item.id)}
            title={item.label}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors cursor-pointer ${
              panel === item.id
                ? 'text-violet-400 border-b-2 border-violet-500'
                : 'text-white/35 hover:text-white/60 border-b-2 border-transparent'
            }`}
          >
            {item.icon}
            <span className="hidden">{item.label}</span>
          </button>
        ))}
      </div>



      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* SLIDES PANEL */}
        {panel === 'slides' && (
          <div className="flex flex-col gap-4">
            {/* Slide thumbnails */}
            <div className="flex flex-col gap-1.5">
              {slides.map((slide, idx) => {
                const isActive = (activeSlideId === slide.id) || (!activeSlideId && idx === 0);
                return (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlide(slide.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all cursor-pointer text-left ${
                      isActive
                        ? 'border-violet-500/50 bg-violet-600/10'
                        : 'border-white/6 hover:border-white/12 hover:bg-white/4'
                    }`}
                  >
                    {/* Mini thumbnail */}
                    <div className="w-8 h-14 rounded-lg overflow-hidden bg-white/5 border border-white/8 flex-shrink-0">
                      {slide.imageDataUrl && (
                        <img src={slide.imageDataUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-white/60'}`}>
                        {slide.header || 'Untitled'}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">Slide {idx + 1}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={addSlide}
              disabled={slides.length >= 10}
              className="w-full justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Slide
              <span className="text-white/30 text-[10px] ml-1">{slides.length}/10</span>
            </Button>

            {/* Active slide editor */}
            {activeSlide && (
              <>
                <div className="h-px bg-white/6" />
                <SlideEditor slide={activeSlide} />
              </>
            )}
          </div>
        )}

        {/* DESIGN PANEL */}
        {panel === 'design' && <ThemePicker view="design" extractedPalette={activeSlide?.extractedPalette} />}

        {/* DEVICE PANEL */}
        {panel === 'device' && <ThemePicker view="device" extractedPalette={activeSlide?.extractedPalette} />}

        {/* RESOLUTION PANEL */}
        {panel === 'resolution' && <ResolutionPicker />}

        {/* PROJECT PANEL */}
        {panel === 'project' && (
          <div className="flex flex-col gap-4">
            <Input
              id="app-name"
              label="App Name"
              value={meta.appName}
              onChange={(e) => setMeta({ appName: e.target.value })}
              placeholder="My App"
            />

            {/* App icon upload */}
            <div>
              <p className="text-xs text-white/50 font-medium mb-2">App Icon</p>
              <div className="flex items-center gap-3">
                <div
                  onClick={() => iconRef.current?.click()}
                  className="w-14 h-14 rounded-2xl overflow-hidden bg-white/6 border border-white/10 cursor-pointer hover:border-violet-500/50 transition-colors flex items-center justify-center"
                >
                  {meta.iconDataUrl ? (
                    <img src={meta.iconDataUrl} alt="Icon" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-white/30">Icon</span>
                  )}
                </div>
                <Button size="sm" onClick={() => iconRef.current?.click()}>
                  Upload Icon
                </Button>
                {meta.iconDataUrl && (
                  <Button size="sm" variant="ghost" onClick={() => setMeta({ iconDataUrl: null })}>
                    Clear
                  </Button>
                )}
              </div>
              <input ref={iconRef} type="file" accept="image/png" onChange={handleIconUpload} className="hidden" />
            </div>

            {/* Platform */}
            <div>
              <p className="text-xs text-white/50 font-medium mb-2">Platform</p>
              <div className="flex gap-2">
                {(['ios', 'android'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      const current = meta.platform;
                      const next = current.includes(p)
                        ? current.filter((x) => x !== p)
                        : [...current, p];
                      if (next.length > 0) setMeta({ platform: next });
                    }}
                    className={`flex-1 py-2 text-xs rounded-xl border transition-colors cursor-pointer capitalize ${
                      meta.platform.includes(p)
                        ? 'border-violet-500/60 bg-violet-600/15 text-white'
                        : 'border-white/8 text-white/40 hover:text-white/60'
                    }`}
                  >
                    {p === 'ios' ? 'iOS' : 'Android'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/6 mt-2" />
            {confirmingReset ? (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mt-2">
                <span className="text-xs text-red-400 font-medium flex-1">Reset project?</span>
                <button
                  onClick={() => {
                    createNewProject();
                    useProjectStore.temporal.getState().clear();
                    setConfirmingReset(false);
                  }}
                  className="flex items-center gap-1 text-xs text-white bg-red-500/80 hover:bg-red-500 px-2 py-0.5 rounded-md transition-colors cursor-pointer font-medium"
                >
                  <Check className="w-3 h-3" /> Yes
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="flex items-center gap-1 text-xs text-white/60 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" /> No
                </button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/5 mt-2"
                onClick={() => setConfirmingReset(true)}
              >
                Reset Project
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
