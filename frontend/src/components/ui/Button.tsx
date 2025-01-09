import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-primary-main hover:bg-primary-dark text-white',
    secondary: 'bg-neutral-background hover:bg-action-hover text-neutral-text-primary border border-neutral-border',
    ghost: 'hover:bg-action-hover text-neutral-text-secondary'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <span className="animate-spin">⟳</span>}
      {icon && !isLoading && icon}
      {children}
    </button>
  );
} 