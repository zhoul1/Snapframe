import type { Theme, FontPairingId } from '../../types';
import { getFontPairing } from '../../lib/fonts';

interface TextBlockProps {
  header: string;
  subtitle: string;
  theme: Theme;
  width: number;
  height: number;
  overrideTextColor: string | null;
}

export function TextBlock({ header, subtitle, theme, width, height, overrideTextColor }: TextBlockProps) {
  const pairing = getFontPairing(theme.fontPairing as FontPairingId);
  const textColor = overrideTextColor ?? theme.textColor;
  const subtitleColor = overrideTextColor
    ? `${overrideTextColor}aa`
    : theme.subtitleColor;

  const isTop = theme.textPosition === 'top';
  const isSplit = theme.textPosition === 'split';

  const padding = width * 0.06;
  const headerSize = Math.round(width * 0.072);
  const subtitleSize = Math.round(width * 0.042);
  const lineGap = height * 0.016;

  const textShadow = theme.shadowStyle !== 'none'
    ? '0 2px 12px rgba(0,0,0,0.35)'
    : 'none';

  if (isSplit) {
    return (
      <>
        {/* Header at top */}
        <div style={{
          position: 'absolute',
          top: height * 0.06,
          left: padding,
          right: padding,
          fontFamily: pairing.headingFont,
          fontWeight: pairing.headingWeight,
          fontSize: headerSize,
          color: textColor,
          textShadow,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          textAlign: 'center',
        }}>
          {header}
        </div>
        {/* Subtitle at bottom */}
        <div style={{
          position: 'absolute',
          bottom: height * 0.06,
          left: padding,
          right: padding,
          fontFamily: pairing.bodyFont,
          fontWeight: pairing.bodyWeight,
          fontSize: subtitleSize,
          color: subtitleColor,
          textShadow,
          lineHeight: 1.5,
          textAlign: 'center',
        }}>
          {subtitle}
        </div>
      </>
    );
  }

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: padding,
    right: padding,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: lineGap,
    textAlign: 'center',
  };

  if (isTop) {
    containerStyle.top = height * 0.06;
  } else {
    containerStyle.bottom = height * 0.06;
  }

  return (
    <div style={containerStyle}>
      <div style={{
        fontFamily: pairing.headingFont,
        fontWeight: pairing.headingWeight,
        fontSize: headerSize,
        color: textColor,
        textShadow,
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
      }}>
        {header}
      </div>
      <div style={{
        fontFamily: pairing.bodyFont,
        fontWeight: pairing.bodyWeight,
        fontSize: subtitleSize,
        color: subtitleColor,
        textShadow,
        lineHeight: 1.5,
      }}>
        {subtitle}
      </div>
    </div>
  );
}
