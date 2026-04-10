import type { DeviceKind } from '../../types';
export type { DeviceKind };

/** Returns the height/width aspect ratio for a given device kind */
export function getDeviceAspectRatio(kind: DeviceKind): number {
  switch (kind) {
    case 'ipad': return 2752 / 2064; // ~1.334
    case 'android-tablet': return 1920 / 1200; // 1.6
    case 'android-phone': return 2.05;
    default: return 2.16; // iphone tall
  }
}

interface DeviceFrameProps {
  screenshotUrl: string | null;
  frameWidthPx: number;
  accentColor?: string;
  frameStyle?: 'dark' | 'light' | 'black' | 'white';
  deviceKind?: DeviceKind;
  deviceFrameType?: 'realistic' | 'generic';
  showSensor?: boolean;
}

function getFrameBackground(frameStyle: 'dark' | 'light' | 'black' | 'white'): string {
  switch (frameStyle) {
    case 'dark':
      return 'linear-gradient(145deg, #2a3a46 0%, #1a2830 50%, #0f1e28 100%)';
    case 'light':
      return 'linear-gradient(145deg, #c8d0d8 0%, #a8b4c0 50%, #98a8b8 100%)';
    case 'black':
      return 'linear-gradient(145deg, #111 0%, #050505 100%)';
    case 'white':
      return 'linear-gradient(145deg, #f4f4f4 0%, #e0e0e0 50%, #d0d0d0 100%)';
  }
}

function getButtonBackground(frameStyle: 'dark' | 'light' | 'black' | 'white'): string {
  switch (frameStyle) {
    case 'dark': return 'linear-gradient(to right, #1a2830, #243440)';
    case 'light': return 'linear-gradient(to right, #8898a8, #9aa8b8)';
    case 'black': return 'linear-gradient(to right, #020202, #080808)';
    case 'white': return 'linear-gradient(to right, #c8c8c8, #d8d8d8)';
  }
}

function getCameraColor(frameStyle: 'dark' | 'light' | 'black' | 'white'): string {
  return frameStyle === 'white' ? '#111111' : '#000000';
}

/**
 * Device frame that renders the correct shape based on deviceKind:
 * - iphone: Dynamic island, tall phone proportions
 * - android-phone: Punch-hole camera, slightly different proportions
 * - ipad: Tablet shape, Face ID bar, home indicator
 * - android-tablet: Wider tablet shape, punch-hole camera
 */
export function DeviceFrame({
  screenshotUrl,
  frameWidthPx,
  accentColor = '#00C8DC',
  frameStyle = 'dark',
  deviceKind = 'iphone',
  deviceFrameType = 'realistic',
  showSensor = true,
}: DeviceFrameProps) {
  const w = frameWidthPx;
  const aspectRatio = getDeviceAspectRatio(deviceKind);
  const h = w * aspectRatio;

  const isTablet = deviceKind === 'ipad' || deviceKind === 'android-tablet';
  const radius = isTablet ? w * 0.055 : w * 0.115;
  const bezel = isTablet ? w * 0.025 : w * 0.028;
  const screenRadius = radius - bezel * 0.65;

  const frameBg = getFrameBackground(frameStyle);
  const buttonBg = getButtonBackground(frameStyle);
  const camColor = getCameraColor(frameStyle);

  // ── Top camera / notch area ──
  function renderTopSensor() {
    if (!showSensor || deviceFrameType === 'generic') return null;
    if (deviceKind === 'iphone') {
      const iW = w * 0.24;
      const iH = w * 0.057;
      return (
        <div style={{
          position: 'absolute',
          top: bezel * 1.15,
          left: '50%',
          transform: 'translateX(-50%)',
          width: iW, height: iH,
          background: camColor,
          borderRadius: iH / 2,
          zIndex: 10,
        }} />
      );
    }
    if (deviceKind === 'android-phone') {
      const dotR = w * 0.048;
      return (
        <div style={{
          position: 'absolute',
          top: bezel * 1.2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: dotR, height: dotR,
          background: camColor,
          borderRadius: '50%',
          zIndex: 10,
        }} />
      );
    }
    if (deviceKind === 'ipad') {
      // Face ID thin capsule
      const bW = w * 0.13, bH = w * 0.022;
      return (
        <div style={{
          position: 'absolute',
          top: bezel * 1.2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: bW, height: bH,
          background: camColor,
          borderRadius: bH / 2,
          zIndex: 10,
        }} />
      );
    }
    if (deviceKind === 'android-tablet') {
      // Front camera dot, slightly off-center left on tablets
      const dotR = w * 0.04;
      return (
        <div style={{
          position: 'absolute',
          top: bezel * 1.2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: dotR, height: dotR,
          background: camColor,
          borderRadius: '50%',
          zIndex: 10,
        }} />
      );
    }
    return null;
  }

  // ── Bottom indicator (tablets only) ──
  function renderBottomIndicator() {
    if (!showSensor || !isTablet || deviceFrameType === 'generic') return null;
    const barW = w * 0.28, barH = Math.max(2, w * 0.012);
    return (
      <div style={{
        position: 'absolute',
        bottom: bezel * 1.5,
        left: '50%',
        transform: 'translateX(-50%)',
        width: barW, height: barH,
        background: frameStyle === 'white' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.22)',
        borderRadius: barH / 2,
        zIndex: 10,
      }} />
    );
  }

  // ── Side buttons (phones only) ──
  function renderButtons() {
    if (isTablet || deviceFrameType === 'generic') return null;
    return (
      <>
        {/* Left: volume up + volume down */}
        {[0.14, 0.22].map((topFrac, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: -bezel * 0.85,
            top: h * topFrac,
            width: bezel * 0.8,
            height: h * 0.065,
            background: buttonBg,
            borderRadius: `${bezel * 0.35}px 0 0 ${bezel * 0.35}px`,
          }} />
        ))}
        {/* Right: power */}
        <div style={{
          position: 'absolute',
          right: -bezel * 0.85,
          top: h * 0.18,
          width: bezel * 0.8,
          height: h * 0.1,
          background: buttonBg,
          borderRadius: `0 ${bezel * 0.35}px ${bezel * 0.35}px 0`,
        }} />
      </>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: w,
      height: h,
      borderRadius: radius,
      padding: bezel,
      background: frameBg,
      boxShadow: [
        '0 0 0 1px rgba(255,255,255,0.10)',
        '0 60px 120px rgba(0,0,0,0.80)',
        '0 24px 60px rgba(0,0,0,0.50)',
        'inset 0 1px 0 rgba(255,255,255,0.14)',
        `0 0 50px ${accentColor}12`,
      ].join(', '),
      flexShrink: 0,
    }}>
      {/* Screen */}
      <div style={{
        borderRadius: screenRadius,
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        background: '#000',
        position: 'relative',
      }}>
        {screenshotUrl && (
          <img src={screenshotUrl} alt="" style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'top',
            display: 'block',
          }} />
        )}
        {renderTopSensor()}
        {renderBottomIndicator()}
      </div>

      {/* Glass sheen */}
      <div style={{
        position: 'absolute',
        top: bezel, left: bezel, right: bezel,
        height: h * 0.2,
        borderRadius: `${screenRadius}px ${screenRadius}px 0 0`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {renderButtons()}
    </div>
  );
}
