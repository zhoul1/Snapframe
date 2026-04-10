import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs text-white/50 font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
