import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Toolbar } from './components/layout/Toolbar';
import { Canvas } from './components/layout/Canvas';
import { SlideStrip } from './components/layout/SlideStrip';
import { JsonEditorPanel } from './components/editor/JsonEditorPanel';

export default function App() {
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar onOpenJsonEditor={() => setJsonEditorOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <SlideStrip />
      </div>
      {jsonEditorOpen && <JsonEditorPanel onClose={() => setJsonEditorOpen(false)} />}
    </div>
  );
}
