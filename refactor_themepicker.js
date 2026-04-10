const fs = require('fs');
const path = 'src/components/editor/ThemePicker.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file has a structured pattern.
// We can find the exact indices of each section header, and slice the string.

// 1. Find PALETTE DETECTION
const paletteIdx = content.indexOf('{/* ═══════════════════════════════════════════\n          PALETTE DETECTION');
// 2. Find PRESET THEMES
const presetsIdx = content.indexOf('{/* ═══════════════════════════════════════════\n          PRESET THEMES');
// 3. Find COLORS (has divider before it)
const colorsDividerIdx = content.lastIndexOf('<div className="h-px bg-white/6" />', content.indexOf('COLORS\n          ════════════'));
// 4. Find LAYOUT 
const layoutDividerIdx = content.lastIndexOf('<div className="h-px bg-white/6" />', content.indexOf('LAYOUT\n          ════════════'));
// 5. Find TYPOGRAPHY 
const typographyDividerIdx = content.lastIndexOf('<div className="h-px bg-white/6" />', content.indexOf('TYPOGRAPHY\n          ════════════'));
// 6. Find DEVICE
const deviceDividerIdx = content.lastIndexOf('<div className="h-px bg-white/6" />', content.indexOf('DEVICE\n          ════════════'));
// 7. Find PILLS
const pillsDividerIdx = content.lastIndexOf('<div className="h-px bg-white/6" />', content.indexOf('PILLS\n          ════════════'));
// 8. Find JSON
const jsonDividerIdx = content.lastIndexOf('<div className="h-px bg-white/6" />', content.indexOf('JSON THEME IMPORT'));

// The end of JSON is tricky because it has the final `</div>` `);` `}` of the component.
// But we know JSON is the last section. The component end is:
const endIdx = content.lastIndexOf('</div>\n  );\n}');

if ([paletteIdx, presetsIdx, colorsDividerIdx, layoutDividerIdx, typographyDividerIdx, deviceDividerIdx, pillsDividerIdx, jsonDividerIdx, endIdx].includes(-1)) {
    console.error("Failed to find one or more markers");
    process.exit(1);
}

// Extract the chunks
const topSection = content.slice(0, paletteIdx);
const paletteChunk = content.slice(paletteIdx, presetsIdx);
const presetsChunk = content.slice(presetsIdx, colorsDividerIdx);
const colorsChunk = content.slice(colorsDividerIdx, layoutDividerIdx);
const layoutChunk = content.slice(layoutDividerIdx, typographyDividerIdx);
const typographyChunk = content.slice(typographyDividerIdx, deviceDividerIdx);
const deviceChunk = content.slice(deviceDividerIdx, pillsDividerIdx);
const pillsChunk = content.slice(pillsDividerIdx, jsonDividerIdx);
const jsonChunk = content.slice(jsonDividerIdx, endIdx);
const bottomSection = content.slice(endIdx);

// Note: the dividers are at the START of the chunks. E.g. colorsChunk starts with <div className="h-px bg-white/6" />
// We need to strip the starting dividers from Layout because it will be the FIRST element in Device view!
const layoutChunkClean = layoutChunk.replace('<div className="h-px bg-white/6" />', '');

// Build the new content
const newContent = topSection + 
  `      {view === 'design' && (
        <>
${paletteChunk}${presetsChunk}${colorsChunk}${typographyChunk}${jsonChunk}        </>
      )}

      {view === 'device' && (
        <>
${layoutChunkClean}${deviceChunk}${pillsChunk}        </>
      )}
` + bottomSection;

fs.writeFileSync(path, newContent);
console.log('Successfully refactored ThemePicker.tsx');
