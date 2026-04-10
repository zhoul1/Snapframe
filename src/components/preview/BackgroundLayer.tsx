import type { Theme } from '../../types';

interface BackgroundLayerProps {
  theme: Theme;
  overrideBackground: string | null;
  width: number;
  height: number;
}

export function BackgroundLayer({ theme, overrideBackground, width, height }: BackgroundLayerProps) {
  const bg = overrideBackground ?? theme.background;
  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width,
    height,
    background: bg,
  };

  // Add noise texture overlay for 'noise' type
  if (theme.backgroundType === 'noise' && !overrideBackground) {
    return (
      <div style={style}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundSize: '256px 256px',
            opacity: 0.4,
          }}
        />
      </div>
    );
  }

  // Aurora mesh gradient extra blobs
  if (theme.backgroundType === 'mesh' && !overrideBackground) {
    return (
      <div style={style}>
        {/* Colored blobs for mesh effect */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '65%',
          height: '65%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
          filter: 'blur(45px)',
        }} />
      </div>
    );
  }

  return <div style={style} />;
}
