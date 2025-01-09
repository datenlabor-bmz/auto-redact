import * as React from 'react';

interface SelectOption {
  value: string;
  label: string;
  title?: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: (SelectOption | SelectGroup)[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  minimal?: boolean;
}

export function Select({
  options,
  placeholder,
  size = 'md',
  error,
  minimal = false,
  className = '',
  ...props
}: SelectProps) {
  const sizes = {
    sm: 'text-sm py-0.5',
    md: 'text-base py-1',
    lg: 'text-lg py-1.5'
  };

  return (
    <div>
      <select
        className={`
          ${minimal ? 'border border-gray-300 rounded' : 'border border-gray-300 rounded bg-white px-2'}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((item, index) => {
          if ('options' in item) {
            // It's a group
            return (
              <optgroup key={index} label={item.label}>
                {item.options.map((option, optionIndex) => (
                  <option
                    key={`${index}-${optionIndex}`}
                    value={option.value}
                    title={option.title}
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            );
          } else {
            // It's a single option
            return (
              <option
                key={index}
                value={item.value}
                title={item.title}
              >
                {item.label}
              </option>
            );
          }
        })}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 