import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  icon?: ReactNode;
};

export function Field({ label, error, icon, id, className, ...rest }: FieldProps) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-xl border bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : 'border-slate-200 dark:border-slate-700'} ${className || ''}`}
          {...rest}
        />
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
};

export function SelectField({
  label,
  error,
  id,
  children,
  ...rest
}: SelectFieldProps) {
  const selectId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-xl border bg-white/80 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:bg-slate-800/70 dark:text-slate-100 ${
          error
            ? 'border-red-400'
            : 'border-slate-200 dark:border-slate-700'
        }`}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Button({
  children,
  loading,
  className,
  variant = 'primary',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-400/40 disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary:
      'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 hover:shadow-brand-500/40 active:scale-[0.98]',
    secondary:
      'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/60',
    ghost:
      'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className || ''}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}
