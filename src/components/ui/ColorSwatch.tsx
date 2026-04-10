interface ColorSwatchProps {
  color: string;
  label?: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function ColorSwatch({ color, label, selected, onClick, size = 'md' }: ColorSwatchProps) {
  const dim = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';
  return (
    <button
      onClick={onClick}
      title={label ?? color}
      className={`${dim} rounded-full border-2 transition-all cursor-pointer ${
        selected ? 'border-white scale-110' : 'border-transparent hover:scale-105'
      }`}
      style={{ background: color }}
    />
  );
}
