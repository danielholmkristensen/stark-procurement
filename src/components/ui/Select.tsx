import { type SelectHTMLAttributes, type ReactNode, forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
  error?: string;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", options, placeholder, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`px-3 py-2 border rounded-md text-sm transition-colors appearance-none bg-white
          ${error
            ? "border-stark-orange focus:ring-stark-orange focus:border-stark-orange"
            : "border-gray-300 focus:ring-stark-navy focus:border-stark-navy"
          }
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);

Select.displayName = "Select";
