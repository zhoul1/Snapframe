import { Sidebar } from './components/layout/Sidebar';
import { Toolbar } from './components/layout/Toolbar';
import { Canvas } from './components/layout/Canvas';
import { SlideStrip } from './components/layout/SlideStrip';

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <SlideStrip />
      </div>
    </div>
  );
}
