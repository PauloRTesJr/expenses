import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  /** Size variant */
  size?: "small" | "default" | "large";
  /** Status state */
  status?: "default" | "error" | "warning" | "success";
  /** Prefix element (icon or text) */
  prefix?: ReactNode;
  /** Suffix element (icon or text) */
  suffix?: ReactNode;
  /** Allow clear functionality */
  allowClear?: boolean;
  /** Custom container className */
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      containerClassName = "",
      type = "text",
      size = "default",
      status = "default",
      prefix,
      suffix,
      allowClear = false,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    // Size variants matching Ant Design
    const sizeClasses = {
      small: "h-8 px-3 py-1 text-sm",
      default: "h-10 px-3 py-2 text-sm",
      large: "h-12 px-4 py-3 text-base",
    };

    // Status variants with enhanced visual feedback
    const statusClasses = {
      default:
        "border-gray-600 focus:border-[--accent-primary] focus:shadow-[0_0_0_2px_rgba(102,126,234,0.2)]",
      error:
        "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.2)] bg-red-500/5",
      warning:
        "border-amber-500 focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.2)] bg-amber-500/5",
      success:
        "border-green-500 focus:border-green-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.2)] bg-green-500/5",
    };

    const baseClasses = `
      w-full rounded-lg border transition-all duration-200 ease-in-out
      bg-[rgba(36,43,61,0.85)] backdrop-blur-sm
      text-white placeholder-gray-400
      focus:outline-none focus:ring-0
      disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-800/50
      file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white
      hover:border-gray-500 hover:shadow-sm
      ${sizeClasses[size]}
      ${statusClasses[status]}
    `;

    const hasAffixes = prefix || suffix || allowClear;

    // Handle clear functionality
    const handleClear = () => {
      if (onChange) {
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    const showClearButton = allowClear && value && !disabled;

    if (hasAffixes) {
      return (
        <div
          className={cn(
            "relative inline-flex items-center w-full",
            "rounded-lg border transition-all duration-200 ease-in-out",
            "bg-[rgba(36,43,61,0.85)] backdrop-blur-sm",
            "hover:border-gray-500 hover:shadow-sm",
            "focus-within:shadow-lg",
            sizeClasses[size].includes("h-8")
              ? "min-h-8"
              : sizeClasses[size].includes("h-10")
              ? "min-h-10"
              : "min-h-12",
            statusClasses[status],
            disabled && "opacity-60 cursor-not-allowed bg-gray-800/50",
            containerClassName
          )}
        >
          {/* Prefix */}
          {prefix && (
            <div
              className={cn(
                "flex items-center justify-center text-gray-400 pointer-events-none",
                size === "small"
                  ? "w-8 h-6"
                  : size === "large"
                  ? "w-12 h-10"
                  : "w-10 h-8",
                "flex-shrink-0"
              )}
            >
              {prefix}
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            className={cn(
              "flex-1 bg-transparent border-0 outline-none text-white placeholder-gray-400",
              "focus:ring-0 focus:outline-none",
              size === "small"
                ? "px-2 py-1 text-sm"
                : size === "large"
                ? "px-3 py-3 text-base"
                : "px-3 py-2 text-sm",
              !prefix &&
                (size === "small"
                  ? "pl-3"
                  : size === "large"
                  ? "pl-4"
                  : "pl-3"),
              !suffix &&
                !showClearButton &&
                (size === "small"
                  ? "pr-3"
                  : size === "large"
                  ? "pr-4"
                  : "pr-3"),
              disabled && "cursor-not-allowed",
              className
            )}
            disabled={disabled}
            value={value}
            onChange={onChange}
            ref={ref}
            {...props}
          />

          {/* Clear Button */}
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "flex items-center justify-center text-gray-400 hover:text-gray-300",
                "transition-colors duration-150 cursor-pointer",
                size === "small"
                  ? "w-6 h-6 mr-2"
                  : size === "large"
                  ? "w-8 h-8 mr-3"
                  : "w-7 h-7 mr-2"
              )}
              tabIndex={-1}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M6 4.586L10.293.293a1 1 0 111.414 1.414L7.414 6l4.293 4.293a1 1 0 01-1.414 1.414L6 7.414l-4.293 4.293a1 1 0 01-1.414-1.414L4.586 6 .293 1.707A1 1 0 011.707.293L6 4.586z" />
              </svg>
            </button>
          )}

          {/* Suffix */}
          {suffix && (
            <div
              className={cn(
                "flex items-center justify-center text-gray-400 pointer-events-none",
                size === "small"
                  ? "w-8 h-6 mr-2"
                  : size === "large"
                  ? "w-12 h-10 mr-3"
                  : "w-10 h-8 mr-2",
                "flex-shrink-0"
              )}
            >
              {suffix}
            </div>
          )}
        </div>
      );
    }

    // Simple input without affixes
    return (
      <input
        type={type}
        className={cn(baseClasses, className)}
        disabled={disabled}
        value={value}
        onChange={onChange}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
