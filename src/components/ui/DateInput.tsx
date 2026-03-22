import { type InputHTMLAttributes, forwardRef } from "react";

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={`w-full px-3 py-2 border rounded-md text-sm transition-colors
          ${error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-stark-navy focus:border-stark-navy"
          }
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
    );
  }
);

DateInput.displayName = "DateInput";
