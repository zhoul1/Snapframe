import type { Slide, Theme, Resolution, DeviceKind } from '../../types';
import { DeviceFrame, getDeviceAspectRatio } from './DeviceFrame';
import { getFontPairing } from '../../lib/fonts';
import type { FontPairingId } from '../../types';

interface ScreenshotCardProps {
  slide: Slide;
  theme: Theme;
  resolution: Resolution;
  scale?: number;
  showFrame?: boolean;
  exportId?: string;
  appName?: string;
  iconDataUrl?: string | null;
}

function parseLines(text: string): string[] {
  return text
    .split(/\n/)
    .map((s) => s.trim().replace(/^[-–—•·*]\s*/, ''))
    .filter(Boolean)
    .slice(0, 3);
}

function parseBadges(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function getDeviceKind(resolution: Resolution): DeviceKind {
  if (resolution.id === 'ipad-pro-13' || resolution.id === 'ipad-pro-13-landscape') return 'ipad';
  if (resolution.id === 'android-tablet' || resolution.id === 'android-tablet-landscape') return 'android-tablet';
  if (resolution.id === 'android-phone') return 'android-phone';
  return 'iphone';
}

function getDeviceOrientation(resolution: Resolution): 'portrait' | 'landscape' {
  return resolution.width >= resolution.height ? 'landscape' : 'portrait';
}

/** Returns true if textColor is dark-valued → the background is light */
function isLightBackground(textColor: string): boolean {
  if (!textColor) return false;
  const hex = textColor.replace('#', '');
  if (hex.length !== 6) {
    if (textColor.toLowerCase() === 'transparent') return false;
    return false;
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.35;
}

export function ScreenshotCard({
  slide,
  theme,
  resolution,
  scale = 1,
  showFrame = true,
  exportId,
  appName,
  iconDataUrl,
}: ScreenshotCardProps) {
  const { width, height } = resolution;
  const W = width;
  const H = height;

  // Merge per-slide overrides on top of global theme
  let effectiveTheme: Theme = slide.themeOverrides
    ? { ...theme, ...slide.themeOverrides }
    : theme;

  if (effectiveTheme.resolutionOverrides?.[resolution.id]) {
    effectiveTheme = { ...effectiveTheme, ...effectiveTheme.resolutionOverrides[resolution.id] };
  }

  let effectiveSlide = slide;
  if (slide.resolutionOverrides?.[resolution.id]) {
    effectiveSlide = { ...effectiveSlide, ...slide.resolutionOverrides[resolution.id] };
  }

  const pairing = getFontPairing(effectiveTheme.fontPairing as FontPairingId);
  const hasFrame = showFrame && effectiveSlide.deviceFrame;
  const showSensor = effectiveTheme.showDeviceSensor ?? true;

  const fontScale = effectiveSlide.fontScale ?? 1.0;
  const frameStyle = effectiveTheme.deviceFrameStyle ?? 'dark';
  const deviceFrameType = effectiveTheme.deviceFrameType ?? 'realistic';
  const pillMode = effectiveSlide.pillMode ?? 'pills';
  const layoutMode = effectiveTheme.layoutMode ?? 'header-above';

  const deviceSizeScale = effectiveTheme.deviceSizeScale ?? 0.58;
  const deviceOffsetX = (effectiveTheme.deviceOffsetX ?? 0) * W;
  const deviceOffsetY = (effectiveTheme.deviceOffsetY ?? 0) * H;

  const deviceKind = getDeviceKind(resolution);
  const deviceOrientation = getDeviceOrientation(resolution);
  const deviceAspectRatio = getDeviceAspectRatio(deviceKind, deviceOrientation);
  const textAlign = (effectiveTheme.textAlign ?? 'center') as React.CSSProperties['textAlign'];

  // Layout spacing (fraction of H → px)
  const padTop = (effectiveTheme.paddingTop ?? 0.05) * H;
  const padBottom = (effectiveTheme.paddingBottom ?? 0.04) * H;
  const gap = (effectiveTheme.contentGap ?? 0.02) * H;

  // Pill tuning
  const pillSpread = effectiveTheme.pillSpread ?? 0.6;
  const pillEdgeInset = (effectiveTheme.pillEdgeInset ?? 0.04) * W;

  // Per-device image
  const screenshotUrl = effectiveSlide.deviceImages?.[deviceKind] ?? effectiveSlide.imageDataUrl;

  const bullets = parseLines(effectiveSlide.featureBullets);
  const badges = parseBadges(effectiveSlide.badges);

  // ── Responsive phone sizing ──
  const phoneFrameW = W * deviceSizeScale;
  const phoneFrameH = phoneFrameW * deviceAspectRatio;

  // ── Typography ──
  // Use MIN of W-based and H-based to prevent overflow on short aspect ratios
  // Per-element scales stack on top of the global fontScale
  const baseFontRef = Math.min(W, H * 0.5);
  const eyebrowSize = baseFontRef * 0.045 * (effectiveSlide.eyebrowScale ?? 1.0) * fontScale;
  const headlineSize = baseFontRef * 0.14 * (effectiveSlide.headlineScale ?? 1.0) * fontScale;
  const sublineSize = baseFontRef * 0.060 * (effectiveSlide.sublineScale ?? 1.0) * fontScale;
  const pillLabelSize = baseFontRef * 0.050 * (effectiveSlide.pillScale ?? 1.0) * fontScale;
  const badgeSize = baseFontRef * 0.045 * (effectiveSlide.badgeScale ?? 1.0) * fontScale;

  // Headline style
  const headlineWeight = effectiveTheme.headlineWeight ?? pairing.headingWeight;
  const headlineStyle = effectiveTheme.headlineItalic ? 'italic' : 'normal';

  // Colors
  const bg = effectiveSlide.overrideBackground ?? effectiveTheme.background;
  const textColor = effectiveSlide.overrideTextColor ?? effectiveTheme.textColor;
  const dimText = effectiveSlide.overrideTextColor ? `${effectiveSlide.overrideTextColor}99` : effectiveTheme.subtitleColor;
  const accent = effectiveTheme.accentColor;
  const isLight = isLightBackground(textColor);

  // Pill accent colors
  const pillAccents = [accent, '#FF9F43', '#26de81'];

  // ── Background ──
  function renderBackground() {
    if (effectiveTheme.backgroundType === 'solid') {
      return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.10) 100%)',
          }} />
        </div>
      );
    }
    if (effectiveTheme.backgroundType === 'mesh') {
      return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', width: W * 1.3, height: W * 1.3, borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}28 0%, transparent 65%)`,
            top: -W * 0.4, left: -W * 0.4, filter: `blur(${W * 0.07}px)`,
          }} />
          <div style={{
            position: 'absolute', width: W * 1.1, height: W * 1.1, borderRadius: '50%',
            background: `radial-gradient(circle, ${pillAccents[1]}1e 0%, transparent 65%)`,
            bottom: -W * 0.28, right: -W * 0.3, filter: `blur(${W * 0.07}px)`,
          }} />
          <div style={{
            position: 'absolute', width: W * 0.8, height: W * 0.8, borderRadius: '50%',
            background: `radial-gradient(circle, ${pillAccents[2]}1a 0%, transparent 65%)`,
            top: H * 0.38, left: W * 0.08, filter: `blur(${W * 0.05}px)`,
          }} />
        </div>
      );
    }
    if (effectiveTheme.backgroundType === 'noise') {
      const noiseUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;
      return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', width: W * 0.9, height: W * 0.9, borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}1a 0%, transparent 68%)`,
            top: -W * 0.2, left: -W * 0.2,
          }} />
          <div style={{
            position: 'absolute', width: W * 0.7, height: W * 0.7, borderRadius: '50%',
            background: `radial-gradient(circle, ${pillAccents[1]}12 0%, transparent 70%)`,
            bottom: H * 0.1, right: -W * 0.16,
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: noiseUrl, backgroundSize: '200px 200px', opacity: 0.07,
          }} />
        </div>
      );
    }
    // gradient — glow blobs + subtle grid
    const tileSize = W * 0.09;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', isolation: 'isolate' }}>
        <div style={{
          position: 'absolute', width: W * 0.95, height: W * 0.95, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}1e 0%, transparent 68%)`,
          top: -W * 0.22, left: -W * 0.22, filter: `blur(${W * 0.04}px)`,
        }} />
        <div style={{
          position: 'absolute', width: W * 0.8, height: W * 0.8, borderRadius: '50%',
          background: `radial-gradient(circle, ${pillAccents[1]}18 0%, transparent 70%)`,
          bottom: H * 0.06, right: -W * 0.18, filter: `blur(${W * 0.04}px)`,
        }} />
        <div style={{
          position: 'absolute', width: W * 0.6, height: W * 0.6, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
          top: H * 0.44, right: W * 0.04, filter: `blur(${W * 0.03}px)`,
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `
            linear-gradient(to right, ${accent}3A 4px, transparent 4px),
            linear-gradient(to bottom, ${accent}3A 4px, transparent 4px),
            linear-gradient(to right, ${accent}1F 2px, transparent 2px),
            linear-gradient(to bottom, ${accent}1F 2px, transparent 2px)
          `,
          backgroundSize: `${tileSize}px ${tileSize}px, ${tileSize}px ${tileSize}px, ${tileSize / 4}px ${tileSize / 4}px, ${tileSize / 4}px ${tileSize / 4}px`,
          backgroundPosition: 'center center',
          mixBlendMode: 'overlay',
          opacity: 0.9,
        }} />
      </div>
    );
  }

  // ── Phone mockup ──
  function renderPhone() {
    const offsetStyle: React.CSSProperties = {
      transform: `translate(${deviceOffsetX}px, ${deviceOffsetY}px)`,
      flexShrink: 0,
      position: 'relative',
      zIndex: 1,
    };

    if (hasFrame) {
      return (
        <div style={offsetStyle}>
          <DeviceFrame
            screenshotUrl={screenshotUrl}
            frameWidthPx={phoneFrameW}
            accentColor={accent}
            frameStyle={frameStyle}
            deviceKind={deviceKind}
            orientation={deviceOrientation}
            deviceFrameType={deviceFrameType}
            showSensor={showSensor}
          />
        </div>
      );
    }
    if (screenshotUrl) {
      return (
        <div style={{
          ...offsetStyle,
          width: phoneFrameW, height: phoneFrameH,
          borderRadius: W * 0.04, overflow: 'hidden',
          boxShadow: `0 ${W * 0.04}px ${W * 0.12}px rgba(0,0,0,0.55)`,
        }}>
          <img src={screenshotUrl} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
          }} />
        </div>
      );
    }
    return (
      <div style={{
        ...offsetStyle,
        width: phoneFrameW, height: phoneFrameH,
        borderRadius: phoneFrameW * 0.1,
        border: `${Math.max(1, W * 0.003)}px dashed ${accent}35`,
        background: `${accent}06`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          color: `${accent}55`, fontSize: W * 0.04,
          fontFamily: pairing.bodyFont, textAlign: 'center',
        }}>
          {deviceKind === 'ipad' || deviceKind === 'android-tablet'
            ? 'Upload Tablet Screenshot'
            : 'Upload Screenshot'}
        </span>
      </div>
    );
  }

  // ── Floating pills ──
  // Now positioned relative to the device container, not absolute zones
  function renderFloatingPills() {
    if (pillMode !== 'pills') return null;

    const pillBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(12,8,28,0.78)';
    const pillText = isLight ? '#0f0f1a' : '#ffffff';

    // Distribute pills vertically across the phone frame height
    const pillSides: ('left' | 'right')[] = ['left', 'right', 'left'];
    const maxPillW = W * 0.34;

    return bullets.map((bullet, i) => {
      const color = pillAccents[i % pillAccents.length];
      const side = pillSides[i];
      // Spread pills across the device height using pillSpread
      const verticalRange = phoneFrameH * pillSpread;
      const startOffset = (phoneFrameH - verticalRange) / 2;
      const step = bullets.length > 1 ? verticalRange / (bullets.length - 1) : 0;
      const topOff = startOffset + step * i;

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: topOff,
            ...(side === 'right' ? { right: -pillEdgeInset } : { left: -pillEdgeInset }),
            display: 'flex',
            alignItems: 'center',
            gap: W * 0.02,
            background: pillBg,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: `1.5px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)'}`,
            borderBottom: `1.5px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)'}`,
            borderLeft: side === 'left' ? `3px solid ${color}` : `1.5px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)'}`,
            borderRight: side === 'right' ? `3px solid ${color}` : `1.5px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: W * 0.022,
            padding: `${H * 0.009}px ${W * 0.028}px`,
            maxWidth: maxPillW,
            zIndex: 20,
            boxShadow: `0 ${W * 0.005}px ${W * 0.018}px rgba(0,0,0,0.22)`,
          }}
        >
          <div style={{
            width: W * 0.017, height: W * 0.017,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 ${W * 0.012}px ${color}`,
          }} />
          <span style={{
            fontFamily: pairing.bodyFont,
            fontWeight: 600,
            fontSize: pillLabelSize,
            color: pillText,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: maxPillW - W * 0.085,
            display: 'block',
          }}>
            {bullet}
          </span>
        </div>
      );
    });
  }

  // ── Text block ──
  function renderTextBlock() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        textAlign,
        padding: `0 ${W * 0.07}px`,
        flexShrink: 0,
        zIndex: 15,
      }}>
        {iconDataUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: W * 0.022, marginBottom: H * 0.012 }}>
            <img src={iconDataUrl} alt="" style={{
              width: W * 0.08, height: W * 0.08, borderRadius: W * 0.016,
              boxShadow: `0 ${W * 0.006}px ${W * 0.022}px rgba(0,0,0,0.35)`,
            }} />
            {appName && (
              <span style={{ fontFamily: pairing.bodyFont, fontSize: baseFontRef * 0.053, fontWeight: 500, color: dimText }}>
                {appName}
              </span>
            )}
          </div>
        )}

        {effectiveSlide.eyebrow && (
          <div style={{
            fontFamily: pairing.bodyFont,
            fontSize: eyebrowSize,
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: accent,
            marginBottom: H * 0.008,
            opacity: 0.9,
          }}>
            {effectiveSlide.eyebrow}
          </div>
        )}

        <div style={{
          fontFamily: pairing.headingFont,
          fontWeight: headlineWeight,
          fontStyle: headlineStyle,
          fontSize: headlineSize,
          lineHeight: 1.08,
          color: textColor,
          letterSpacing: '-0.03em',
          textShadow: isLight ? 'none' : `0 ${W * 0.004}px ${W * 0.02}px rgba(0,0,0,0.28)`,
          marginBottom: pillMode === 'subheadline' && bullets.length > 0 ? H * 0.01 : 0,
        }}>
          {effectiveSlide.header}
        </div>

        {pillMode === 'subheadline' && bullets.length > 0 && (
          <div style={{
            fontFamily: pairing.bodyFont,
            fontSize: sublineSize,
            fontWeight: 400,
            color: dimText,
            lineHeight: 1.55,
            maxWidth: W * 0.82,
            marginTop: H * 0.006,
          }}>
            {bullets.map((line, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: W * 0.016, justifyContent: textAlign === 'center' ? 'center' : 'flex-start' }}>
                <div style={{
                  width: W * 0.014, height: W * 0.014,
                  borderRadius: '50%', background: accent, flexShrink: 0, opacity: 0.7,
                }} />
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Badges ──
  function renderBadges() {
    if (badges.length === 0) return null;
    return (
      <div style={{
        display: 'flex', gap: W * 0.018, flexWrap: 'wrap' as const, justifyContent: 'center',
        padding: `0 ${W * 0.06}px`,
        flexShrink: 0,
        zIndex: 15,
      }}>
        {badges.map((label, i) => (
          <div key={label} style={{
            fontFamily: pairing.bodyFont,
            fontSize: badgeSize,
            fontWeight: 500,
            padding: `${H * 0.006}px ${W * 0.034}px`,
            borderRadius: W * 0.035,
            border: `1px solid ${i === 0 ? `${accent}55` : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.13)')}`,
            background: i === 0 ? `${accent}1a` : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
            color: i === 0 ? accent : dimText,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap' as const,
          }}>
            {label}
          </div>
        ))}
      </div>
    );
  }

  // ── Device container (phone + pills relative to it) ──
  function renderDeviceSection() {
    return (
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 1,
        minHeight: 0,
        zIndex: 10,
      }}>
        {renderPhone()}
        {renderFloatingPills()}
      </div>
    );
  }

  // ── Shared outer card style ──
  const wrapperStyle: React.CSSProperties = {
    position: 'relative', width: width * scale, height: height * scale, flexShrink: 0,
  };
  const cardStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, width: W, height: H, overflow: 'hidden',
    borderRadius: scale < 0.5 ? W * 0.03 : 0,
    background: bg, fontFamily: pairing.headingFont,
    transform: `scale(${scale})`, transformOrigin: 'top left',
    willChange: 'transform',
  };

  // ── OVERLAY layout ──
  if (layoutMode === 'overlay') {
    return (
      <div id={exportId} style={wrapperStyle}>
        <div style={cardStyle}>
          {renderBackground()}
        {/* Device centered */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 5,
        }}>
          {renderDeviceSection()}
        </div>
        {/* Text overlaid at top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          paddingTop: padTop,
          paddingBottom: gap,
          background: isLight
            ? 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 100%)',
          zIndex: 15,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          {renderTextBlock()}
        </div>
        {/* Badges overlaid at bottom */}
        {badges.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            paddingBottom: padBottom,
            paddingTop: gap,
            background: isLight
              ? 'linear-gradient(0deg, rgba(255,255,255,0.85) 0%, transparent 100%)'
              : 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 100%)',
            zIndex: 15,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
          }}>
            {renderBadges()}
          </div>
        )}
        </div>
      </div>
    );
  }

  // ── DEVICE-ABOVE layout (was "bottom") ──
  if (layoutMode === 'device-above') {
    return (
      <div id={exportId} style={wrapperStyle}>
        <div style={cardStyle}>
          {renderBackground()}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: padTop,
          paddingBottom: padBottom,
        }}>
          {renderDeviceSection()}
          <div style={{ height: gap, flexShrink: 0 }} />
          {renderTextBlock()}
          {badges.length > 0 && (
            <>
              <div style={{ height: gap * 0.8, flexShrink: 0 }} />
              {renderBadges()}
            </>
          )}
          {/* Push remaining space above device */}
          <div style={{ flex: 1 }} />
        </div>
        </div>
      </div>
    );
  }

  // ── HEADER-ABOVE layout (default, was "top") ──
  return (
    <div id={exportId} style={wrapperStyle}>
      <div style={cardStyle}>
        {renderBackground()}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: padTop,
        paddingBottom: padBottom,
      }}>
        {renderTextBlock()}
        <div style={{ height: gap, flexShrink: 0 }} />
        {renderDeviceSection()}
        {/* Flexible spacer pushes badges to bottom */}
        <div style={{ flex: 1 }} />
        {badges.length > 0 && renderBadges()}
      </div>
      </div>
    </div>
  );
}
