import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export function Input({
  label,
  error,
  icon,
  helperText,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-neutral-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-text-tertiary">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-lg border border-neutral-border
            px-4 py-2 text-neutral-text-primary
            placeholder:text-neutral-text-tertiary
            focus:border-primary-main focus:ring-1 focus:ring-primary-main
            disabled:bg-neutral-background disabled:cursor-not-allowed
            ${icon ? "pl-10" : ""}
            ${error ? "border-red-500" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p
          className={`text-sm ${error ? "text-red-500" : "text-neutral-text-tertiary"}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
