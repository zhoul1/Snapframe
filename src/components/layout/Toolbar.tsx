import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore, useTemporalStore } from '../../store/useProjectStore';
import { useExport } from '../../hooks/useExport';
import { useProjectIO } from '../../hooks/useProjectIO';
import { Button } from '../ui/Button';
import { Download, FolderOpen, Save, Loader2, Image, Undo2, Redo2, Plus, Check, X, Code2, Languages } from 'lucide-react';
import { getResolution } from '../../lib/resolutions';

interface ToolbarProps {
  onOpenJsonEditor: () => void;
}

export function Toolbar({ onOpenJsonEditor }: ToolbarProps) {
  const { t, i18n } = useTranslation();
  const { 
    meta, slides, activeSlideId, selectedResolutions,
    activeResolutionScope, setActiveResolutionScope,
    themeScope, setThemeScope,
    createNewProject
  } = useProjectStore();
  const { exportSlide, exportAll } = useExport();
  const { saveProject, loadProject } = useProjectIO();
  const [exporting, setExporting] = useState(false);
  const [exportingSlide, setExportingSlide] = useState(false);
  const [confirmingNew, setConfirmingNew] = useState(false);

  const activeId = activeSlideId ?? slides[0]?.id;
  const resolution = getResolution(selectedResolutions[0] ?? 'iphone-69');

  const { undo, redo, pastStates, futureStates } = useTemporalStore((state) => state);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape' && confirmingNew) {
        setConfirmingNew(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, confirmingNew]);

  async function handleExportAll() {
    setExporting(true);
    try {
      await exportAll();
    } finally {
      setExporting(false);
    }
  }

  async function handleExportSlide() {
    if (!activeId) return;
    setExportingSlide(true);
    try {
      await exportSlide(activeId);
    } finally {
      setExportingSlide(false);
    }
  }

  function handleConfirmNew() {
    createNewProject();
    useProjectStore.temporal.getState().clear();
    setConfirmingNew(false);
  }

  return (
    <header className="h-14 bg-[#0d0d18] border-b border-white/6 flex items-center justify-between px-5 flex-shrink-0">
      {/* Left: title info */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white/80">{meta.appName || 'Untitled'}</span>
        <span className="text-white/20">·</span>
        <span className="text-xs text-white/35">
          {t('slide', { count: slides.length })}
        </span>
        {resolution && (
          <>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/35">{resolution.label}</span>
          </>
        )}
      </div>

      {/* Center: Targeting Controls */}
      {selectedResolutions.length > 0 && (
        <div className="flex items-center gap-5 bg-white/5 rounded-lg px-4 py-1.5 border border-white/5 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{t('Device:')}</label>
            <select 
              className="bg-transparent text-[11px] font-medium text-white/90 outline-none cursor-pointer"
              value={activeResolutionScope}
              onChange={(e) => setActiveResolutionScope(e.target.value)}
            >
              <option value="global" className="bg-[#1a1a2e]">{t('Global Base')}</option>
              {selectedResolutions.map(r => (
                <option key={r} value={r} className="bg-[#1a1a2e]">{r.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-3 bg-white/10" />

          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={themeScope === 'global'}
              onChange={(e) => setThemeScope(e.target.checked ? 'global' : 'slide')}
              className="rounded-sm border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 focus:ring-offset-[#0d0d18] cursor-pointer"
            />
            <span className="text-[11px] font-medium text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-wider">{t('All Slides')}</span>
          </label>
        </div>
      )}

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {confirmingNew ? (
          /* Inline "New Project" confirmation — no browser dialog */
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5">
            <span className="text-xs text-red-400 font-medium mr-1">{t('Reset project?')}</span>
            <button
              onClick={handleConfirmNew}
              className="flex items-center gap-1 text-xs text-white bg-red-500/80 hover:bg-red-500 px-2 py-0.5 rounded-md transition-colors cursor-pointer font-medium"
            >
              <Check className="w-3 h-3" /> {t('Yes')}
            </button>
            <button
              onClick={() => setConfirmingNew(false)}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" /> {t('No')}
            </button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmingNew(true)} title={t('New')}>
            <Plus className="w-3.5 h-3.5" />
            {t('New')}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={loadProject} title={t('Open')}>
          <FolderOpen className="w-3.5 h-3.5" />
          {t('Open')}
        </Button>
        <Button size="sm" variant="ghost" onClick={saveProject} title={t('Save')}>
          <Save className="w-3.5 h-3.5" />
          {t('Save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onOpenJsonEditor} title={t('JSON')}>
          <Code2 className="w-3.5 h-3.5" />
          {t('JSON')}
        </Button>
        <div className="w-px h-5 bg-white/10" />
        <Button size="sm" variant="ghost" onClick={() => undo()} disabled={!canUndo} title="Undo (Cmd+Z)">
          <Undo2 className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => redo()} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
          <Redo2 className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-white/10" />
        <Button size="sm" variant="ghost" onClick={() => {
          const langs = ['en', 'zh-CN', 'zh-TW', 'ja'];
          const idx = langs.indexOf(i18n.language);
          i18n.changeLanguage(langs[(idx + 1) % langs.length]);
        }} title={t('Language')}>
          <Languages className="w-3.5 h-3.5" />
          {{ en: 'EN', 'zh-CN': '简', 'zh-TW': '繁', ja: '日' }[i18n.language] ?? 'EN'}
        </Button>
        <div className="w-px h-5 bg-white/10" />
        <Button size="sm" variant="secondary" onClick={handleExportSlide} disabled={exportingSlide}>
          {exportingSlide ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
          {t('Export Slide')}
        </Button>
        <Button size="sm" variant="primary" onClick={handleExportAll} disabled={exporting}>
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {t('Export All')}
        </Button>
      </div>
    </header>
  );
}
